import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

/**
 * AuthProvider 컴포넌트
 * @param {React.ReactNode} children [Required]
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  function safeSetLoadingFalse() {
    setLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('AUTH TIMEOUT - 강제 로딩 종료');
      safeSetLoadingFalse();
    }, 5000);

    let subscription = null;
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        if (_event === 'INITIAL_SESSION' && session?.user) {
          if (localStorage.getItem('fitbuddy_autoLogin') !== '1') {
            clearTimeout(timeout);
            safeSetLoadingFalse();
            setTimeout(() => supabase.auth.signOut(), 0);
            return;
          }
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, timeout);
        } else {
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
  }, []);

  async function fetchProfile(userId, timeout) {
    try {
      const { data, error } = await supabase
        .from('fitbuddy_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        if (data.is_deleted === true) {
          if (timeout) clearTimeout(timeout);
          localStorage.removeItem('fitbuddy_autoLogin');
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          safeSetLoadingFalse();
          return;
        }
        setProfile(data);
      } else {
        // 프로필이 없으면 자동 생성 (이메일 인증 타이밍 이슈 방어)
        console.warn('프로필 없음, 자동 생성 시작...', error?.code);
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
        };

        const { data: created, error: createErr } = await supabase
          .from('fitbuddy_users')
          .upsert(profilePayload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (createErr) console.error('프로필 자동 생성 오류:', createErr);
        setProfile(created || profilePayload);

        // 캐릭터도 없으면 자동 생성
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
      console.error('fetchProfile 오류:', err);
      setProfile(null);
    } finally {
      if (timeout) clearTimeout(timeout);
      safeSetLoadingFalse();
    }
  }

  async function signUp(email, password, displayName, extraData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;

    if (data.user && data.session) {
      // 세션이 있을 때만 직접 insert (이메일 인증 불필요 시)
      const username = email.split('@')[0] + '_' + data.user.id.slice(0, 6);
      const profilePayload = {
        id: data.user.id,
        username,
        display_name: displayName,
        bio: '',
        height: extraData.height ? Number(extraData.height) : 0,
        weight: extraData.weight ? Number(extraData.weight) : 0,
        goal_weight: extraData.goalWeight ? Number(extraData.goalWeight) : 0,
        workout_goal: extraData.workoutGoals?.join(',') || 'health',
        interests: extraData.interests || [],
        gender: extraData.gender || '',
      };

      const { error: upsertErr } = await supabase
        .from('fitbuddy_users')
        .upsert(profilePayload, { onConflict: 'id' });
      if (upsertErr) console.error('signUp - 프로필 생성 실패:', upsertErr);

      const { error: charErr } = await supabase
        .from('fitbuddy_characters')
        .upsert({
          user_id: data.user.id,
          character_name: displayName + '의 캐릭터',
          health_status: 'normal',
          growth_stage: 1,
          level: 1,
          experience: 0,
          points: 0,
        }, { onConflict: 'user_id' });
      if (charErr) console.error('signUp - 캐릭터 생성 실패:', charErr);

      setProfile({ ...profilePayload, avatar_url: '', role: 'user', is_public: true });
    }
    // 세션 없는 경우(이메일 인증 필요): 로그인 시 fetchProfile에서 자동 생성됨
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profileData } = await supabase
      .from('fitbuddy_users')
      .select('is_deleted')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileData?.is_deleted === true) {
      await supabase.auth.signOut();
      const deletedErr = new Error('탈퇴 처리된 계정입니다. 다시 가입해주세요.');
      deletedErr.code = 'ACCOUNT_DELETED';
      throw deletedErr;
    }

    return data;
  }

  async function signOut() {
    localStorage.removeItem('fitbuddy_autoLogin');
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

export function useAuth() {
  return useContext(AuthContext);
}
