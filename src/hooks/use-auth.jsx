import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

// 네이티브 앱(Capacitor)에서는 "모두 닫기"로 프로세스가 종료되면 sessionStorage도 함께
// 사라지므로, 웹 전용으로 설계된 "자동 로그인 미체크 시 재로그인 요구" 정책을 그대로
// 적용하면 매번 강제 로그아웃된다. 네이티브에서는 이 정책 자체를 건너뛰고 Supabase가 이미
// localStorage에 영구 저장해둔 세션을 항상 그대로 복구한다 — 로그아웃은 오직 사용자가 직접
// "로그아웃" 버튼을 눌렀을 때만 발생해야 한다는 것이 앱의 정책이기 때문이다.
const isNativeApp = Capacitor.isNativePlatform();

/**
 * AuthProvider 컴포넌트
 * @param {React.ReactNode} children [Required]
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSigningUpRef = useRef(false);

  function safeSetLoadingFalse() {
    setLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      safeSetLoadingFalse();
    }, 5000);

    let subscription = null;
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        if (_event === 'INITIAL_SESSION' && session?.user && !isNativeApp) {
          const autoLogin = localStorage.getItem('fitbuddy_autoLogin') === '1';
          const sessionActive = sessionStorage.getItem('fitbuddy_session') === '1';
          // 자동로그인 미설정 + 현재 브라우저 세션에서 로그인한 적 없음 → 이전 세션 잔존 → 로그아웃
          // (웹/PWA 전용 정책 — 네이티브 앱은 위 isNativeApp 분기로 이 블록 자체를 건너뛴다)
          if (!autoLogin && !sessionActive) {
            clearTimeout(timeout);
            safeSetLoadingFalse();
            setTimeout(() => supabase.auth.signOut(), 0);
            return;
          }
        }

        if (session?.user) {
          setLoading(true);
          fetchProfile(session.user.id, timeout, session.user);
        } else {
          setUser(null);
          setProfile(null);
          clearTimeout(timeout);
          safeSetLoadingFalse();
        }
      });
      subscription = result.data.subscription;
    } catch (err) {
      console.error('AUTH INIT ERROR:', err);
      clearTimeout(timeout);
      setTimeout(() => safeSetLoadingFalse(), 0);
    }

    return () => {
      clearTimeout(timeout);
      if (subscription) subscription.unsubscribe();
    };
  // Auth subscription is intentionally registered once; fetchProfile runs inside Supabase auth event callbacks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId, timeout, sessionUser) {
    try {
      const { data, error } = await supabase
        .from('fitbuddy_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) console.error('[fetchProfile] error:', error);

      if (data) {
        if (data.is_deleted === true) {
          if (isSigningUpRef.current) {
            // 회원가입 진행 중: signOut 스킵 — signUp의 upsert가 is_deleted를 false로 리셋함
            return;
          }
          if (timeout) clearTimeout(timeout);
          localStorage.removeItem('fitbuddy_autoLogin');
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          safeSetLoadingFalse();
          return;
        }
        if (sessionUser) setUser(sessionUser);
        setProfile(data);
      } else {
        const { data: authResp } = await supabase.auth.getUser();
        const authUser = authResp?.user;
        const email = authUser?.email || '';
        const displayName =
          authUser?.user_metadata?.display_name ||
          email.split('@')[0] ||
          'FitBuddy';
        const username = (email.split('@')[0] || 'user') + '_' + userId.slice(0, 6);

        const profilePayload = {
          id: userId,
          username,
          display_name: displayName,
          bio: '',
          height: 0,
          weight: 0,
          goal_weight: 0,
          workout_goal: 'health',
          interests: [],
          gender: '',
          is_deleted: false,
          deleted_at: null,
        };

        const { data: created, error: createErr } = await supabase
          .from('fitbuddy_users')
          .upsert(profilePayload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (createErr) console.error('[fetchProfile] 자동 생성 오류:', createErr.message, createErr.code);
        if (sessionUser) setUser(sessionUser);
        setProfile(created || profilePayload);

        await supabase.from('fitbuddy_characters').upsert({
          user_id: userId,
          character_name: displayName + '의 캐릭터',
          health_status: 'normal',
          growth_stage: 1,
          level: 1,
          experience: 0,
          points: 0,
        }, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.error('[fetchProfile] 예외 오류:', err);
      setProfile(null);
      if (sessionUser) setUser(sessionUser);
    } finally {
      if (timeout) clearTimeout(timeout);
      safeSetLoadingFalse();
    }
  }

  // 프로필 생성/복구 공통 헬퍼
  async function applyProfileUpsert(authUser, email, displayName, extraData) {
    const username = email.split('@')[0] + '_' + authUser.id.slice(0, 6);
    const profilePayload = {
      id: authUser.id,
      username,
      display_name: displayName,
      real_name: extraData.realName || null,
      bio: '',
      height: extraData.height ? Number(extraData.height) : 0,
      weight: extraData.weight ? Number(extraData.weight) : 0,
      goal_weight: extraData.goalWeight ? Number(extraData.goalWeight) : 0,
      workout_goal: extraData.workoutGoals?.join(',') || 'health',
      interests: extraData.interests || [],
      gender: extraData.gender || '',
      character_style: extraData.characterStyle || 'semi',
      character_variant: extraData.characterVariant || 1,
      avatar_url: null,
      is_deleted: false,
      deleted_at: null,
    };

    let { error: upsertErr } = await supabase
      .from('fitbuddy_users')
      .upsert(profilePayload, { onConflict: 'id' });

    // PGRST204: 스키마 캐시에 없는 컬럼 → gender 제외 후 재시도
    if (upsertErr?.code === 'PGRST204') {
      const payloadWithoutGender = { ...profilePayload };
      delete payloadWithoutGender.gender;
      const { error: retryErr } = await supabase
        .from('fitbuddy_users')
        .upsert(payloadWithoutGender, { onConflict: 'id' });
      upsertErr = retryErr || null;
    }

    if (upsertErr) {
      console.error('[signUp] 프로필 upsert 실패:', upsertErr.message, '| code:', upsertErr.code, '| hint:', upsertErr.hint);
    }

    const { error: charErr } = await supabase
      .from('fitbuddy_characters')
      .upsert({
        user_id: authUser.id,
        character_name: displayName + '의 캐릭터',
        health_status: 'normal',
        growth_stage: 1,
        level: 1,
        experience: 0,
        points: 0,
      }, { onConflict: 'user_id' });
    if (charErr) console.error('[signUp] 캐릭터 생성 실패:', charErr.message);

    return profilePayload;
  }

  async function signUp(email, password, displayName, extraData = {}) {
    isSigningUpRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;

      if (data.user && data.session) {
        // 새 가입 — 프로필 생성 후 즉시 로그아웃 (로그인 페이지에서 수동 로그인)
        await applyProfileUpsert(data.user, email, displayName, extraData);
        await supabase.auth.signOut();
        return data;
      }

      // 세션 없음: 기존 이메일 — 비밀번호로 확인 후 탈퇴 계정 복구
      const { data: recoverData, error: recoverError } = await supabase.auth.signInWithPassword({ email, password });

      if (recoverError || !recoverData?.user) {
        return data;
      }

      // JWT clock skew 대응
      await new Promise(r => setTimeout(r, 400));

      const { data: existingProfile } = await supabase
        .from('fitbuddy_users')
        .select('is_deleted')
        .eq('id', recoverData.user.id)
        .maybeSingle();

      if (existingProfile?.is_deleted === true) {
        // 탈퇴 계정 → 복구 후 로그아웃
        await applyProfileUpsert(recoverData.user, email, displayName, extraData);
        await supabase.auth.signOut();
        return recoverData;
      }

      if (existingProfile && existingProfile.is_deleted === false) {
        // 활성 계정 → 재가입 불가
        await supabase.auth.signOut();
        throw new Error('이미 가입된 이메일입니다. 로그인 페이지를 이용해주세요.');
      }

      // 프로필 없음 — 새로 생성 후 로그아웃
      await applyProfileUpsert(recoverData.user, email, displayName, extraData);
      await supabase.auth.signOut();
      return recoverData;
    } finally {
      isSigningUpRef.current = false;
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // 현재 브라우저 세션에서 로그인했음을 표시 (탭/새로고침 유지용, 브라우저 닫으면 초기화)
    sessionStorage.setItem('fitbuddy_session', '1');

    // JWT clock skew 대응: iat가 서버보다 미래로 인식되는 PGRST303 방어
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: profileData, error: profileError } = await supabase
      .from('fitbuddy_users')
      .select('is_deleted')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) console.error('[signIn] PROFILE FETCH ERROR:', profileError.message, '| code:', profileError.code, '| hint:', profileError.hint);

    if (profileData?.is_deleted === true) {
      await supabase.auth.signOut();
      const deletedErr = new Error('가입되지 않은 이메일입니다.');
      deletedErr.code = 'ACCOUNT_DELETED';
      throw deletedErr;
    }

    return data;
  }

  async function signOut() {
    localStorage.removeItem('fitbuddy_autoLogin');
    sessionStorage.removeItem('fitbuddy_session');
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// AuthProvider and useAuth are intentionally kept together to avoid broad auth import churn.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
