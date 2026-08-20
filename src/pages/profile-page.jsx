import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TodayIcon from '@mui/icons-material/Today';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import { useFontScale } from '../hooks/use-font-scale';
import { FONT_SCALE_LEVELS, FONT_SCALE_LABELS } from '../theme';
import Layout from '../components/common/layout';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import { getBasePreviewScale, getProfileButtonExtraMarginBottomPx } from '../utils/character-preview';
import StatsCard from '../components/ui/stats-card';
import { getDaysLeft as getChallengesDaysLeft, getLocalToday } from '../utils/date-utils';
import { WORKOUT_TYPES } from '../constants/workout';

// getLocalToday()와 동일한 로컬 날짜 포맷 방식을, 오늘이 아닌 임의의(과거) Date에도
// 적용하기 위한 파일 내부 전용 헬퍼. toISOString()은 UTC로 변환되어 한국 시간 자정~오전 9시
// 사이에는 하루가 어긋나므로 사용하지 않는다.
function formatLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const POSTS_PREVIEW = 5;

const WORKOUT_GOALS = ['다이어트', '근력 증가', '건강 관리', '습관 만들기'];
// 관심 운동 선택지 — 운동 종류(WORKOUT_TYPES)와 같은 10종 도메인이라 별도 배열을 두지 않고
// 공통 상수를 그대로 참조한다(기존엔 8종으로 스트레칭/줄넘기가 빠져 있었다).
const INTERESTS = WORKOUT_TYPES;

const TYPE_LABEL = { workout: '운동', diet: '식단', free: '자유' };
const TYPE_EMOJI = { workout: '🏋️', diet: '🥗', free: '💬' };
const TYPE_BG = { workout: '#E8F5E9', diet: '#FFF8E1', free: '#F3E5F5' };

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, fetchProfile } = useAuth();
  const { fontScale, setFontScale, scale, scaleRem: es } = useFontScale();
  const isAdmin = profile?.role === 'admin';
  const avatarInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [joinedChallenges, setJoinedChallenges] = useState([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, thisWeek: 0, todayCount: 0, streak: 0 });
  const [workoutDetails, setWorkoutDetails] = useState({
    totalTime: 0, totalCalories: 0, topWorkout: '',
    weekTime: 0, weekCalories: 0,
    todayTime: 0, todayCalories: 0,
    bestStreak: 0,
  });
  const [statsModal, setStatsModal] = useState(null); // null | 'total' | 'week' | 'today' | 'streak'
  const [character, setCharacter] = useState(null);

  const [tab, setTab] = useState('posts');

  // 상단 우측 설정 드롭다운(프로필 수정 진입점 + 글자 크기) — 별도 페이지 대신 헤더에서
  // 여는 Menu 하나로 처리한다.
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  // 프로필 수정
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  // 탈퇴
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // 게시글 메뉴
  const [postMenuAnchor, setPostMenuAnchor] = useState(null);
  const [postMenuTarget, setPostMenuTarget] = useState(null);
  const [postDeleteOpen, setPostDeleteOpen] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // Profile page data loaders intentionally run once on mount; reordering/useCallback has repeatedly caused set-state-in-effect lint errors.
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/immutability
    fetchMyPosts();
    // eslint-disable-next-line react-hooks/immutability
    fetchSavedPosts();
    // eslint-disable-next-line react-hooks/immutability
    fetchStats();
    supabase.from('fitbuddy_characters').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setCharacter(data));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchJoinedChallenges() {
    try {
      // Step 1: 내가 참여한 challenge_id 목록
      const { data: joined, error: joinErr } = await supabase
        .from('fitbuddy_challenge_users')
        .select('challenge_id')
        .eq('user_id', user.id);
      if (joinErr) { console.error('참여 챌린지 조회 오류:', joinErr.message); setJoinedChallenges([]); return; }
      const ids = (joined || []).map((d) => d.challenge_id).filter(Boolean);
      if (!ids.length) { setJoinedChallenges([]); return; }

      // Step 2: 챌린지 상세 정보
      const { data: challenges } = await supabase
        .from('fitbuddy_challenges')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      setJoinedChallenges(challenges || []);
    } catch (err) {
      console.error('참여 챌린지 조회 오류:', err);
      setJoinedChallenges([]);
    }
  }

  async function fetchMyPosts() {
    try {
      const { data } = await supabase
        .from('fitbuddy_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } catch (err) { console.error(err); }
  }

  async function fetchSavedPosts() {
    try {
      const { data } = await supabase
        .from('fitbuddy_saved_posts')
        .select('*, fitbuddy_posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSavedPosts((data || []).map((d) => d.fitbuddy_posts).filter(Boolean));
    } catch (err) { console.error(err); }
  }

  async function fetchStats() {
    try {
      const { data } = await supabase
        .from('fitbuddy_workouts')
        .select('workout_date, duration_minutes, calories_burned, workout_type')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });
      const all = data || [];
      const today = getLocalToday();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = formatLocalDate(weekAgo);
      const uniqueDates = [...new Set(all.map((w) => w.workout_date))];
      const dateSet = new Set(uniqueDates);

      let streak = 0;
      const checkDate = new Date();
      while (true) {
        const dateStr = formatLocalDate(checkDate);
        if (dateSet.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }

      // 최고 연속 운동일
      const sortedDates = [...uniqueDates].sort();
      let bestStreak = streak > 0 ? 1 : 0;
      let curStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000;
        if (diff === 1) { curStreak++; bestStreak = Math.max(bestStreak, curStreak); }
        else curStreak = 1;
      }

      const weekData = all.filter((w) => w.workout_date >= weekAgoStr);
      const todayData = all.filter((w) => w.workout_date === today);

      // 가장 많이 한 운동 종류
      const typeCounts = {};
      all.forEach((w) => { if (w.workout_type) typeCounts[w.workout_type] = (typeCounts[w.workout_type] || 0) + 1; });
      const topWorkout = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      setStats({
        totalWorkouts: all.length,
        thisWeek: uniqueDates.filter((d) => d >= weekAgoStr).length,
        todayCount: all.filter((w) => w.workout_date === today).length,
        streak,
      });
      setWorkoutDetails({
        totalTime: all.reduce((s, w) => s + (w.duration_minutes || 0), 0),
        totalCalories: all.reduce((s, w) => s + (w.calories_burned || 0), 0),
        topWorkout,
        weekTime: weekData.reduce((s, w) => s + (w.duration_minutes || 0), 0),
        weekCalories: weekData.reduce((s, w) => s + (w.calories_burned || 0), 0),
        todayTime: todayData.reduce((s, w) => s + (w.duration_minutes || 0), 0),
        todayCalories: todayData.reduce((s, w) => s + (w.calories_burned || 0), 0),
        bestStreak,
      });
    } catch (err) { console.error(err); }
  }

  // 프로필 이미지 업로드
  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('fitbuddy-avatars')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('fitbuddy-avatars').getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from('fitbuddy_users')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updateErr) throw updateErr;
      await fetchProfile(user.id);
      setSnack({ open: true, msg: '프로필 이미지가 변경되었습니다!', severity: 'success' });
    } catch (err) {
      console.error('아바타 업로드 실패:', err);
      const msg = err?.message?.includes('Bucket not found')
        ? 'Supabase Storage 버킷이 없습니다. 아래 안내에 따라 생성해주세요.'
        : '이미지 업로드에 실패했습니다.';
      setSnack({ open: true, msg, severity: 'error' });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  function openEdit() {
    setEditForm({
      // real_name(실제 이름)은 닉네임으로 자동 대체해 채우지 않는다 — 채워두면 저장 시
      // "닉네임을 실제 이름으로 그대로 저장"하는 것처럼 보일 수 있다. 비어 있으면 그대로
      // 빈 칸으로 시작해 사용자가 직접 입력하게 한다.
      real_name: profile?.real_name || '',
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      height: profile?.height > 0 ? String(profile.height) : '',
      weight: profile?.weight > 0 ? String(profile.weight) : '',
      goal_weight: profile?.goal_weight > 0 ? String(profile.goal_weight) : '',
      workoutGoals: profile?.workout_goal
        ? profile.workout_goal.split(',').map((g) => g.trim()).filter(Boolean)
        : [],
      interests: Array.isArray(profile?.interests) ? profile.interests : [],
      gender: profile?.gender || '',
    });
    setEditOpen(true);
  }

  function toggleEditGoal(item) {
    setEditForm((prev) => ({
      ...prev,
      workoutGoals: prev.workoutGoals.includes(item)
        ? prev.workoutGoals.filter((g) => g !== item)
        : [...prev.workoutGoals, item],
    }));
  }

  function toggleEditInterest(item) {
    setEditForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(item)
        ? prev.interests.filter((i) => i !== item)
        : [...prev.interests, item],
    }));
  }

  async function saveProfile() {
    setLoading(true);
    setSaveError('');
    const payload = {
      real_name: editForm.real_name,
      display_name: editForm.display_name,
      bio: editForm.bio,
      height: editForm.height ? Number(editForm.height) : 0,
      weight: editForm.weight ? Number(editForm.weight) : 0,
      goal_weight: editForm.goal_weight ? Number(editForm.goal_weight) : 0,
      workout_goal: (editForm.workoutGoals || []).join(','),
      interests: editForm.interests || [],
      gender: editForm.gender,
    };
    try {
      const { error } = await supabase.from('fitbuddy_users').update(payload).eq('id', user.id);
      if (error) { setSaveError('저장에 실패했습니다: ' + error.message); return; }
      await fetchProfile(user.id);
      setEditOpen(false);
      setSnack({ open: true, msg: '프로필이 저장되었습니다!', severity: 'success' });
    } catch {
      setSaveError('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const uid = user.id;

      // 0. 내가 만든 챌린지의 참여자 삭제 후 챌린지 삭제
      const { data: myChallenges } = await supabase
        .from('fitbuddy_challenges').select('id').eq('creator_id', uid);
      if (myChallenges?.length > 0) {
        const cids = myChallenges.map((c) => c.id);
        await supabase.from('fitbuddy_challenge_users').delete().in('challenge_id', cids);
        await supabase.from('fitbuddy_challenges').delete().in('id', cids);
      }

      // 1. 내가 참여한 챌린지 기록 삭제
      await supabase.from('fitbuddy_challenge_users').delete().eq('user_id', uid);

      // 2. 내 게시글에 달린 좋아요·댓글 삭제
      const { data: myPostIds } = await supabase
        .from('fitbuddy_posts').select('id').eq('user_id', uid);
      if (myPostIds?.length > 0) {
        const ids = myPostIds.map((p) => p.id);
        await supabase.from('fitbuddy_post_likes').delete().in('post_id', ids);
        await supabase.from('fitbuddy_comments').delete().in('post_id', ids);
      }

      // 3. 내가 남긴 좋아요·댓글·저장 삭제
      await supabase.from('fitbuddy_post_likes').delete().eq('user_id', uid);
      await supabase.from('fitbuddy_comments').delete().eq('user_id', uid);
      await supabase.from('fitbuddy_saved_posts').delete().eq('user_id', uid);

      // 4. 게시글 삭제
      await supabase.from('fitbuddy_posts').delete().eq('user_id', uid);

      // 5. 운동·식단·일지 기록 삭제
      await supabase.from('fitbuddy_workouts').delete().eq('user_id', uid);
      await supabase.from('fitbuddy_daily_logs').delete().eq('user_id', uid);
      await supabase.from('fitbuddy_meals').delete().eq('user_id', uid);

      // 6. 캐릭터 삭제
      await supabase.from('fitbuddy_characters').delete().eq('user_id', uid);

      // 6a. Storage 프로필 이미지 삭제
      try {
        const { data: avatarFiles } = await supabase.storage.from('fitbuddy-avatars').list(uid);
        if (avatarFiles?.length > 0) {
          const paths = avatarFiles.map((f) => `${uid}/${f.name}`);
          await supabase.storage.from('fitbuddy-avatars').remove(paths);
        }
      } catch (storageErr) {
        console.warn('스토리지 이미지 삭제 실패 (무시):', storageErr.message);
      }

      // 7. 프로필 소프트 삭제 (avatar_url도 초기화)
      const { error } = await supabase
        .from('fitbuddy_users')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), avatar_url: null })
        .eq('id', uid);
      if (error) console.warn('탈퇴 상태 저장 실패:', error.message);

      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('탈퇴 오류:', err);
      setDeleteError('탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  }

  // 게시글 도트 메뉴
  function openPostMenu(e, post) {
    e.stopPropagation();
    setPostMenuAnchor(e.currentTarget);
    setPostMenuTarget(post);
  }

  function handleEditPost() {
    setPostMenuAnchor(null);
    if (!postMenuTarget) return;
    navigate('/create', { state: { mode: 'edit', postId: postMenuTarget.id } });
  }

  async function handleDeletePost() {
    if (!postMenuTarget) return;
    try {
      const postId = postMenuTarget.id;
      await supabase.from('fitbuddy_post_likes').delete().eq('post_id', postId);
      await supabase.from('fitbuddy_comments').delete().eq('post_id', postId);
      await supabase.from('fitbuddy_saved_posts').delete().eq('post_id', postId);
      await supabase.from('fitbuddy_posts').delete().eq('id', postId).eq('user_id', user.id);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setPostDeleteOpen(false);
      setSnack({ open: true, msg: '게시글이 삭제되었습니다.', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: '삭제에 실패했습니다.', severity: 'error' });
    }
  }

  async function handleUnsavePost() {
    if (!postMenuTarget) return;
    setPostMenuAnchor(null);
    try {
      await supabase.from('fitbuddy_saved_posts')
        .delete().eq('user_id', user.id).eq('post_id', postMenuTarget.id);
      setSavedPosts((prev) => prev.filter((p) => p.id !== postMenuTarget.id));
      setSnack({ open: true, msg: '저장이 취소되었습니다.', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: '저장 취소에 실패했습니다.', severity: 'error' });
    }
  }

  const allPosts = tab === 'posts' ? posts : savedPosts;
  const previewPosts = allPosts.slice(0, POSTS_PREVIEW);
  const hasMore = allPosts.length > POSTS_PREVIEW;
  const activeJoinedChallenges = joinedChallenges.filter((c) => getChallengesDaysLeft(c.end_date) > 0);
  const endedJoinedChallenges = joinedChallenges.filter((c) => getChallengesDaysLeft(c.end_date) === 0);

  // real_name(실제 이름)은 마이페이지 상단 전용 표시값. 기존 사용자는 NULL일 수 있어
  // trim 후 빈 값이면 기존 닉네임(display_name)으로 "표시만" 대체한다 — DB에는 절대
  // real_name = display_name으로 되돌려 쓰지 않는다(순수 read-time fallback).
  const headerName = (profile?.real_name && profile.real_name.trim())
    ? profile.real_name
    : (profile?.display_name || '사용자');

  const profileGender = profile?.gender || 'female';
  const profileCharacterStyle = profile?.character_style || 'semi';
  const profileCharacterVariant = profile?.character_variant || 1;
  // base 단계(워크아웃/percentage/mood 없이 렌더)로 보이는 두 미리보기(캐릭터 요약 카드,
  // 성별 수정 미리보기)에서만 필요 — character-style-picker.jsx의 getBasePreviewScale 참고.
  const basePreviewScale = getBasePreviewScale(profileGender, profileCharacterStyle, profileCharacterVariant);
  const profileCharBoxSize = Math.round(110 * scale.content);
  const profileCharBoxHeight = Math.round(profileCharBoxSize * 1.3);
  const basePreviewScaleSx = basePreviewScale !== 1
    ? { transform: `scale(${basePreviewScale})`, transformOrigin: 'bottom center' }
    : undefined;
  // MUI Card는 컴포넌트 자체에 overflow:hidden이 박혀 있어(node_modules/@mui/material/Card/
  // Card.js 확인), scale(1.3)로 커진 캐릭터를 담을 자리를 레이아웃으로 먼저 확보하지 않으면
  // 머리 위쪽이 카드 경계에서 잘린다 — 캐릭터 column의 minHeight를 scale만큼 키워서(음수
  // margin으로 부모 공간을 줄이는 대신) 캐릭터 전체가 항상 카드 안에 들어오게 한다.
  const profileCharColMinHeight = Math.round(profileCharBoxHeight * basePreviewScale);
  // chibi female 1번 외에는 항상 0 — 위와 같이 자리를 넉넉히 확보하면 (scale이 걸린) chibi
  // female 1번에서는 "캐릭터 변경 ›" 버튼이 실제 신발 끝보다 아래에 남는다. 큰 캐릭터 이미지를
  // 원하는 위치로 밀어내는 대신, 버튼 쪽에 이 값만큼 margin-bottom을 더해 신발 끝 높이로
  // 끌어올린다 — utils/character-preview.js 설명 참고.
  const profileButtonExtraMb = getProfileButtonExtraMarginBottomPx(profileGender, profileCharacterStyle, profileCharacterVariant, profileCharBoxHeight);

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 프로필 헤더 */}
        <Card sx={{ mb: 2, bgcolor: '#EAF7EE', border: '1.5px solid #B2DFC0' }}>
          <CardContent sx={{ pb: '20px !important', position: 'relative' }}>
            {/* 설정 진입점 — 헤더 우측 상단 고정. 별도 /settings 페이지 대신 Menu 드롭다운으로
                프로필 수정 + 글자 크기를 모아둔다(아래 Menu 참고). */}
            <IconButton
              onClick={(e) => setSettingsAnchor(e.currentTarget)}
              size='small'
              sx={{ position: 'absolute', top: 8, right: 8, color: '#5C7A66' }}
            >
              <SettingsIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              {/* 프로필 이미지 + 카메라 아이콘 */}
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={profile?.avatar_url}
                  sx={{ width: 80, height: 80, bgcolor: '#5FCB77', fontSize: '2rem', border: '3px solid white', boxShadow: '0 2px 8px rgba(95,203,119,0.3)', cursor: 'pointer', opacity: avatarUploading ? 0.6 : 1 }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {!profile?.avatar_url && (profile?.display_name?.[0] || 'F')}
                </Avatar>
                <Box
                  onClick={() => avatarInputRef.current?.click()}
                  sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 24, height: 24, borderRadius: '50%',
                    bgcolor: '#5FCB77', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', '&:hover': { bgcolor: '#4DBB68' },
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 13, color: 'white' }} />
                </Box>
                <input type='file' accept='image/*' ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </Box>

              {/* 이름/관리자 chip/자기소개 — 우측 상단 설정 아이콘과 겹치지 않도록 pr을 둔다. */}
              <Box sx={{ flex: '1 1 160px', minWidth: 0, pr: 4.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: profile?.bio ? 0.5 : 0 }}>
                  {/* 상단 닉네임은 시선은 끌되 압도적이지 않아야 한다는 피드백 — 페이지
                      제목급인 h2에서 h3로 한 단계 낮췄다("작게" 단계에서도 더 확실히
                      줄어드는 체감을 준다). */}
                  <Typography
                    variant='h3'
                    sx={{ fontWeight: 700, color: '#1B5E20', wordBreak: 'keep-all', overflowWrap: 'break-word' }}
                  >
                    {headerName}
                  </Typography>
                  {isAdmin && (
                    <Chip label='관리자' size='small' color='error' sx={{ flexShrink: 0 }} />
                  )}
                </Box>
                {profile?.bio && (
                  <Typography variant='body2' color='text.secondary'>
                    {profile.bio}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6, mt: 1.8 }}>
              {/* 신체 정보 — 수정 진입점은 상단 설정(⚙) 드롭다운의 "프로필 수정"으로 통합했다
                  (중복 진입점 제거). */}
              <Box>
                <Typography variant='caption' sx={{ color: '#757575', fontWeight: 600, display: 'block', mb: 0.7 }}>
                  👤 신체 정보
                </Typography>
                {(profile?.height > 0 || profile?.weight > 0 || profile?.goal_weight > 0) ? (
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                    {profile?.height > 0 && <Chip label={`키: ${profile.height}cm`} size='small' sx={{ bgcolor: '#C8E6C9', color: '#2E7D32', fontWeight: 500 }} />}
                    {profile?.weight > 0 && <Chip label={`몸무게: ${profile.weight}kg`} size='small' sx={{ bgcolor: '#C8E6C9', color: '#2E7D32', fontWeight: 500 }} />}
                    {profile?.goal_weight > 0 && <Chip label={`목표: ${profile.goal_weight}kg`} size='small' sx={{ bgcolor: '#C8E6C9', color: '#2E7D32', fontWeight: 500 }} />}
                  </Box>
                ) : (
                  <Typography variant='caption' color='text.secondary'>등록된 신체 정보가 없습니다</Typography>
                )}
              </Box>
              {/* 운동 목표 */}
              {profile?.workout_goal && profile.workout_goal.split(',').filter(Boolean).length > 0 && (
                <Box>
                  <Typography variant='caption' sx={{ color: '#757575', fontWeight: 600, display: 'block', mb: 0.7 }}>
                    🎯 운동 목표
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                    {profile.workout_goal.split(',').filter(Boolean).map((g) => (
                      <Chip key={g} label={g.trim()} size='small' sx={{ bgcolor: '#E9D8FD', color: '#6B46C1', fontWeight: 500 }} />
                    ))}
                  </Box>
                </Box>
              )}
              {/* 관심 운동 */}
              {Array.isArray(profile?.interests) && profile.interests.length > 0 && (
                <Box>
                  <Typography variant='caption' sx={{ color: '#757575', fontWeight: 600, display: 'block', mb: 0.7 }}>
                    🏃 관심 운동
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                    {profile.interests.map((i) => (
                      <Chip key={i} label={i} size='small' sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 500 }} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 캐릭터 요약 카드 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ cursor: 'pointer', border: '1px solid #E8F0EA' }} onClick={() => navigate('/character')}>
              {/* character column을 flex:'0 0 auto'(캐릭터 박스 크기만큼만)로 두면 CardContent
                  자체는 전체 폭이어도 두 column을 합친 콘텐츠가 카드 가운데에 좁게 몰려 보인다
                  — 실제로 폭을 나눠 쓰는 2열이 되도록 CSS Grid로 명시적 비율(캐릭터 42.5% /
                  정보 57.5%)을 준다. 세로 정렬은 grid의 기본 align-items:stretch로 두 column이
                  같은 행 높이를 공유하고, 왼쪽은 alignItems:'flex-end'로 캐릭터를 column
                  바닥에, 오른쪽은 버튼에 mt:'auto'를 줘 컬럼 바닥에 붙인다.
                  [중요] MUI Card는 overflow:hidden이 컴포넌트에 박혀 있어(Card.js 확인),
                  scale이 걸린 variant 1을 예전처럼 음수 margin-bottom으로 밀면 레이아웃이
                  필요로 하는 높이 자체가 줄어들어 머리 위쪽이 카드 경계에서 잘린다
                  — 그래서 이번엔 순서를 바꿔 캐릭터 column에 minHeight(profileCharColMinHeight
                  = 박스높이×scale)를 먼저 줘서 스케일된 캐릭터 전체가 들어갈 자리를 레이아웃
                  으로 확보하고(Card도 함께 자연스럽게 커짐), 그 다음 버튼에만 작은 양수
                  margin-bottom(profileButtonExtraMb)을 더해 실제 신발 끝 높이로 끌어올린다 —
                  큰 이미지를 밀어내는 대신 작은 텍스트를 옮기는 쪽이 안전하다. alpha 채널
                  실측 + overflow:hidden을 포함한 Playwright 렌더링으로 머리 잘림 없음과
                  신발 끝↔버튼 하단 차이 0px을 확인했다. translateX 좌우 보정은 쓰지 않는다 —
                  좌우 균형은 이 grid 비율 구조 자체로 해결한다. */}
              {/* CardContent는 MUI 기본값이 padding:16(모든 방향)이지만 &:last-child에서
                  paddingBottom만 24로 덮어써서(node_modules/@mui/material/CardContent/
                  CardContent.js 확인 — 이 CardContent가 Card의 유일한/마지막 자식이라 항상
                  적용됨) 상단(16)보다 하단(24)이 8px 더 컸다. 위 헤더 카드가 이미 같은
                  이유로 pb를 override하고 있던 것과 동일한 문제라 같은 방식(:last-child도
                  같이 override)으로 상하를 16px로 맞춘다. 이 pb는 grid 콘텐츠 "바깥" 여백만
                  줄이는 것이라 버튼 위치(= row 안에서 mt:'auto'로 정해짐)는 전혀 움직이지
                  않는다 — 카드 하단 테두리만 버튼 쪽으로 당겨온다. */}
              <CardContent sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)', gap: 2, pb: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: profileCharColMinHeight }}>
                  <Box sx={basePreviewScaleSx}>
                    <FitBuddyCharacter
                      size={profileCharBoxSize}
                      gender={profileGender}
                      characterStyle={profileCharacterStyle}
                      characterVariant={profileCharacterVariant}
                    />
                  </Box>
                </Box>
                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  {/* 닉네임+Lv/XP 묶음이 버튼과 너무 떨어져 보인다는 피드백 — 버튼은
                      mt:'auto'로 "남는 공간"을 흡수해 컬럼 바닥에 붙어 있으므로, 위 블록에
                      mt를 줘서 아래로 내리면 그만큼 auto-margin이 줄어들 뿐 버튼 자체의
                      위치(= row 바닥 기준)는 그대로 유지된다. */}
                  <Typography variant='h4' noWrap sx={{ fontWeight: 700, mt: 1.75 }}>{profile?.display_name || '내 캐릭터'}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.1 }}>
                    <Chip label={`Lv.${character?.level || 1}`} size='small' color='primary' />
                    <Chip label={`${character?.experience || 0} XP`} size='small' variant='outlined' />
                  </Box>
                  <Button
                    variant='text' size='small'
                    sx={{
                      alignSelf: 'flex-start', flexShrink: 0, whiteSpace: 'nowrap', minWidth: 0, px: 1,
                      mt: 'auto', mb: profileButtonExtraMb ? `${profileButtonExtraMb}px` : undefined,
                      pt: 0.6, color: '#6B7280',
                    }}
                  >
                    캐릭터 변경 ›
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 운동 통계 4개 */}
          {[
            { icon: <FitnessCenterIcon />, value: stats.totalWorkouts, unit: '총 운동', bgcolor: '#E8F5E9', color: '#6BCB77', modalKey: 'total' },
            { icon: <CalendarTodayIcon />, value: stats.thisWeek, unit: '이번 주', bgcolor: '#E3F2FD', color: '#5DA9E9', modalKey: 'week' },
            { icon: <TodayIcon />, value: stats.todayCount, unit: '오늘', bgcolor: '#F3E8FF', color: '#A084E8', modalKey: 'today' },
            { icon: <WhatshotIcon />, value: stats.streak, unit: '연속 운동', bgcolor: '#FFF3E0', color: '#FF7043', modalKey: 'streak' },
          ].map((item) => (
            <Grid size={{ xs: 3 }} key={item.unit}>
              <StatsCard
                icon={item.icon}
                value={item.value}
                unit={item.unit}
                bgcolor={item.bgcolor}
                color={item.color}
                compact
                onClick={() => setStatsModal(item.modalKey)}
              />
            </Grid>
          ))}
        </Grid>

        {/* 탭 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={tab === 'posts' ? 'contained' : 'outlined'}
            onClick={() => setTab('posts')}
            sx={{ flex: 1, ...(tab === 'posts' && { bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }) }}
          >
            내 게시글 ({posts.length})
          </Button>
          <Button
            variant={tab === 'saved' ? 'contained' : 'outlined'}
            onClick={() => setTab('saved')}
            sx={{ flex: 1, ...(tab === 'saved' && { bgcolor: '#A084E8', '&:hover': { bgcolor: '#8B6FD4' } }) }}
          >
            저장한 글 ({savedPosts.length})
          </Button>
          <Button
            variant={tab === 'challenges' ? 'contained' : 'outlined'}
            onClick={() => { setTab('challenges'); fetchJoinedChallenges(); }}
            sx={{ flex: 1, ...(tab === 'challenges' && { bgcolor: '#FF7043', '&:hover': { bgcolor: '#E55C2F' } }) }}
          >
            챌린지 ({joinedChallenges.length})
          </Button>
        </Box>

        {/* 참여 챌린지 탭 */}
        {tab === 'challenges' && (
          <Box>
            {joinedChallenges.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🎯</Typography>
                <Typography color='text.secondary'>참여 중인 챌린지가 없습니다</Typography>
                <Button
                  variant='outlined' size='small' onClick={() => navigate('/challenges')}
                  sx={{ mt: 1.5, borderColor: '#A084E8', color: '#6B4FC8' }}
                >
                  챌린지 둘러보기
                </Button>
              </Box>
            ) : (
              <>
                {/* 진행 중 챌린지 */}
                {activeJoinedChallenges.length > 0 && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.8 }}>
                      <Box sx={{ width: 3, height: 14, bgcolor: '#A084E8', borderRadius: 2 }} />
                      <Typography variant='caption' sx={{ fontWeight: 700, color: '#6B4FC8' }}>
                        진행 중 ({activeJoinedChallenges.length})
                      </Typography>
                    </Box>
                    {activeJoinedChallenges.map((c) => {
                      const dl = getChallengesDaysLeft(c.end_date);
                      const isUrgent = dl <= 3;
                      return (
                        <Card
                          key={c.id}
                          onClick={() => navigate('/challenges')}
                          sx={{
                            mb: 1.5, cursor: 'pointer',
                            border: `1.5px solid ${isUrgent ? '#FFCDD2' : '#EDE7F6'}`,
                            bgcolor: isUrgent ? '#FFFAFA' : 'white',
                            transition: 'transform 0.12s ease, box-shadow 0.15s',
                            '&:hover': { boxShadow: '0 2px 10px rgba(160,132,232,0.15)', transform: 'translateY(-1px)' },
                            '&:active': { transform: 'scale(0.98)' },
                          }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              {/* 왼쪽 아이콘 영역 */}
                              <Box sx={{
                                width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                                bgcolor: isUrgent ? '#FFEBEE' : '#EDE7F6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Typography sx={{ fontSize: '1.3rem' }}>🏆</Typography>
                              </Box>
                              {/* 내용 */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant='body2'
                                  sx={{ fontWeight: 700, mb: 0.3, lineHeight: 1.3 }}
                                  noWrap
                                >
                                  {c.title}
                                </Typography>
                                {c.goal && (
                                  <Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block' }}>
                                    🎯 {c.goal}
                                  </Typography>
                                )}
                                {c.challenge_type === 'period' && (
                                  <Typography variant='caption' sx={{ color: '#A084E8', fontSize: es(0.7) }}>
                                    {c.start_date} ~ {c.end_date}
                                  </Typography>
                                )}
                              </Box>
                              {/* D-day */}
                              <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                                <Chip
                                  label={dl === 0 ? 'D-day' : `D-${dl}`}
                                  size='small'
                                  sx={{
                                    bgcolor: isUrgent ? '#EF5350' : '#7C4DFF',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: es(0.75),
                                    height: 22,
                                  }}
                                />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}

                {/* 종료된 챌린지 */}
                {endedJoinedChallenges.length > 0 && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.8, mt: activeJoinedChallenges.length > 0 ? 2 : 0 }}>
                      <Box sx={{ width: 3, height: 14, bgcolor: '#BDBDBD', borderRadius: 2 }} />
                      <Typography variant='caption' sx={{ fontWeight: 700, color: '#9E9E9E' }}>
                        종료됨 ({endedJoinedChallenges.length})
                      </Typography>
                    </Box>
                    {endedJoinedChallenges.map((c) => (
                      <Card key={c.id} sx={{ mb: 1.5, border: '1px solid #EEEEEE', opacity: 0.65 }}>
                        <CardContent sx={{ py: 1.5, px: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                              bgcolor: '#F5F5F5',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Typography sx={{ fontSize: '1.3rem' }}>✅</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant='body2' sx={{ fontWeight: 600, color: '#757575' }} noWrap>
                                {c.title}
                              </Typography>
                              {c.goal && (
                                <Typography variant='caption' sx={{ color: '#BDBDBD' }} noWrap>
                                  🎯 {c.goal}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label='종료'
                              size='small'
                              sx={{ bgcolor: '#F5F5F5', color: '#9E9E9E', fontSize: es(0.72), height: 22 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </>
            )}
          </Box>
        )}

        {/* 게시글 카드 리스트 — 챌린지 탭일 때는 렌더링 안 함 */}
        {tab !== 'challenges' && (
          allPosts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color='text.secondary'>
                {tab === 'posts' ? '아직 작성한 게시글이 없습니다.' : '저장한 게시글이 없습니다.'}
              </Typography>
            </Box>
          ) : (
            <>
              {/* 카드 간 gap(1.5→1)과 내부 padding(1.5→1.25)을 살짝 줄여, 내용이 짧은
                  게시글에서도 게시글 사이 여백이 과하게 느껴지지 않게 했다. 썸네일 80×80은
                  그대로 유지. */}
              {previewPosts.map((post) => (
                <Card key={post.id} sx={{ mb: 1 }}>
                  <Box
                    onClick={() => navigate(`/post/${post.id}`)}
                    sx={{ display: 'flex', gap: 1.25, p: 1.25, cursor: 'pointer' }}
                  >
                    {/* 썸네일 */}
                    <Box sx={{
                      width: 80, height: 80, borderRadius: 1.5, overflow: 'hidden',
                      flexShrink: 0, bgcolor: TYPE_BG[post.post_type] || '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {post.image_url ? (
                        <Box component='img' src={post.image_url} alt={post.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Typography sx={{ fontSize: '2rem' }}>{TYPE_EMOJI[post.post_type] || '📝'}</Typography>
                      )}
                    </Box>

                    {/* 내용 — 카테고리/날짜/좋아요를 한 줄 메타 정보로 합쳐서(예: "운동 ·
                        2026. 8. 15. · ♡ 0") 기존 4줄(카테고리 줄 / 제목 / 본문 / 날짜·좋아요
                        줄) 구조를 3줄로 줄였다. 메타/제목/본문 모두 variant + 리터럴 fontSize를
                        같이 갖고 있어 리터럴이 variant의 scale을 가리고 있었다 — 리터럴을
                        제거하거나 variant를 지정해 theme typography(스케일 연동)를 따르게
                        정리했다. */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        <Typography variant='caption' color='text.secondary' sx={{ minWidth: 0 }}>
                          {TYPE_LABEL[post.post_type] || '게시글'} · {new Date(post.created_at).toLocaleDateString('ko-KR')} · ♡ {post.likes_count || 0}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <IconButton
                          size='small'
                          onClick={(e) => openPostMenu(e, post)}
                          sx={{ p: 0.3, flexShrink: 0 }}
                        >
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                      <Typography variant='body1' sx={{
                        fontWeight: 600, mb: 0.2, lineHeight: 1.3, wordBreak: 'keep-all',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {post.title || '(제목 없음)'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{
                        lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {post.caption}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}

              {/* 모두 보기 버튼 */}
              {hasMore && (
                <Button
                  variant='outlined'
                  fullWidth
                  size='small'
                  onClick={() => navigate('/feed', { state: { feedFilter: tab === 'posts' ? 'mine' : 'saved' } })}
                  sx={{
                    mt: 1, mb: 1,
                    borderColor: tab === 'posts' ? '#6BCB77' : '#A084E8',
                    color: tab === 'posts' ? '#388E3C' : '#6B4FC8',
                    '&:hover': { bgcolor: tab === 'posts' ? '#F1F8E9' : '#F3E8FF' },
                  }}
                >
                  모두 보기 ({allPosts.length}개) →
                </Button>
              )}
            </>
          )
        )}

        <Divider sx={{ my: 3 }} />
        <Button variant='outlined' fullWidth color='error' startIcon={<LogoutIcon />} onClick={handleSignOut} sx={{ mb: 1.5 }}>
          로그아웃
        </Button>
        <Button
          variant='text' fullWidth startIcon={<DeleteForeverIcon />}
          onClick={() => { setDeleteError(''); setDeleteOpen(true); }}
          sx={{ color: '#BDBDBD', fontSize: es(0.8) }}
        >
          회원 탈퇴
        </Button>
      </Box>

      {/* 게시글 도트 메뉴 */}
      <Menu anchorEl={postMenuAnchor} open={Boolean(postMenuAnchor)} onClose={() => setPostMenuAnchor(null)}>
        {tab === 'posts' ? [
          <MenuItem key='edit' onClick={handleEditPost}>수정하기</MenuItem>,
          <MenuItem key='delete' sx={{ color: 'error.main' }} onClick={() => { setPostMenuAnchor(null); setPostDeleteOpen(true); }}>삭제하기</MenuItem>,
        ] : (
          <MenuItem onClick={handleUnsavePost}>저장 취소</MenuItem>
        )}
      </Menu>

      {/* 게시글 삭제 확인 다이얼로그 */}
      <Dialog open={postDeleteOpen} onClose={() => setPostDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <WarningAmberIcon sx={{ fontSize: 40, color: '#FF7043', mb: 1 }} />
          <Typography variant='h4' sx={{ fontWeight: 700 }}>게시글을 삭제할까요?</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>이 작업은 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setPostDeleteOpen(false)}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={handleDeletePost}>삭제</Button>
        </DialogActions>
      </Dialog>

      {/* 탈퇴 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <WarningAmberIcon sx={{ fontSize: 48, color: '#FF7043', mb: 1 }} />
          <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>정말 탈퇴하시겠습니까?</Typography>
          <Typography variant='body2' color='text.secondary'>
            탈퇴 시 게시글, 캐릭터, 프로필 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </Typography>
          {deleteError && <Alert severity='error' sx={{ mt: 2, textAlign: 'left' }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={handleDeleteAccount} disabled={deleteLoading}>
            {deleteLoading ? '처리 중...' : '탈퇴하기'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상단 설정 드롭다운 — 별도 /settings 페이지 대신 Menu 하나로 "프로필 수정"과
          "글자 크기"를 모은다. 글자 크기 pill은 MenuItem이 아닌 일반 Box라 클릭해도 메뉴가
          닫히지 않는다 — 값을 바꿔가며 바로 비교해볼 수 있도록. localStorage 저장 방식과
          font scale 로직 자체는 변경하지 않았다. */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { setSettingsAnchor(null); openEdit(); }}>
          ✎ 프로필 수정
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography variant='caption' sx={{ color: '#757575', fontWeight: 600, display: 'block', mb: 0.8 }}>
            글자 크기
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {FONT_SCALE_LEVELS.map((level) => {
              const selected = fontScale === level;
              return (
                <Box
                  key={level}
                  onClick={() => setFontScale(level)}
                  sx={{
                    px: 1.5, py: 0.6, borderRadius: '999px', cursor: 'pointer',
                    border: `2px solid ${selected ? '#6BCB77' : '#E0E0E0'}`,
                    bgcolor: selected ? '#E8F5E9' : '#FAFAFA',
                    color: selected ? '#2E7D32' : '#757575',
                    fontWeight: selected ? 700 : 400,
                    fontSize: es(0.85),
                    userSelect: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {FONT_SCALE_LABELS[level]}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Menu>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => !loading && setEditOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {saveError && <Alert severity='error'>{saveError}</Alert>}
          {/* 이름(real_name)과 닉네임(display_name)은 독립된 값 — 하나만 고쳐도 다른 값은
              그대로 다시 저장된다(saveProfile 참고). */}
          <TextField
            label='이름'
            value={editForm.real_name || ''}
            onChange={(e) => setEditForm({ ...editForm, real_name: e.target.value })}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
          <TextField
            label='닉네임'
            value={editForm.display_name || ''}
            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
          <TextField
            label='자기소개'
            value={editForm.bio || ''}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            fullWidth multiline rows={2}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label='키 (cm)' type='number' value={editForm.height || ''} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} fullWidth size='small' />
            <TextField label='몸무게 (kg)' type='number' value={editForm.weight || ''} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} fullWidth size='small' />
            <TextField label='목표 (kg)' type='number' value={editForm.goal_weight || ''} onChange={(e) => setEditForm({ ...editForm, goal_weight: e.target.value })} fullWidth size='small' />
          </Box>
          {/* 운동 목표 pill 선택 */}
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.8, color: '#333' }}>
              운동 목표 <Typography component='span' variant='caption' color='text.secondary'>(복수 선택 가능)</Typography>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {WORKOUT_GOALS.map((g) => {
                const selected = (editForm.workoutGoals || []).includes(g);
                return (
                  <Box
                    key={g}
                    onClick={() => toggleEditGoal(g)}
                    sx={{
                      px: 1.5, py: 0.6, borderRadius: '999px', cursor: 'pointer',
                      border: `2px solid ${selected ? '#9F7AEA' : '#E0E0E0'}`,
                      bgcolor: selected ? '#E9D8FD' : '#FAFAFA',
                      color: selected ? '#6B46C1' : '#757575',
                      fontWeight: selected ? 700 : 400,
                      fontSize: es(0.85),
                      userSelect: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {g}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* 관심 운동 pill 선택 */}
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.8, color: '#333' }}>
              관심 운동 <Typography component='span' variant='caption' color='text.secondary'>(복수 선택 가능)</Typography>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {INTERESTS.map((i) => {
                const selected = (editForm.interests || []).includes(i);
                return (
                  <Box
                    key={i}
                    onClick={() => toggleEditInterest(i)}
                    sx={{
                      px: 1.5, py: 0.6, borderRadius: '999px', cursor: 'pointer',
                      border: `2px solid ${selected ? '#5DA9E9' : '#E0E0E0'}`,
                      bgcolor: selected ? '#E3F2FD' : '#FAFAFA',
                      color: selected ? '#1565C0' : '#757575',
                      fontWeight: selected ? 700 : 400,
                      fontSize: es(0.85),
                      userSelect: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {i}
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>성별</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[{ value: 'female', label: '여성' }, { value: 'male', label: '남성' }].map((opt) => {
                // gender만 바뀔 뿐 캐릭터 페이지에서 고른 style/variant는 그대로 유지되므로,
                // 이 미리보기도 semi/1로 고정하지 않고 현재 저장된 값으로 보여준다. opt.value가
                // 'female'/'male'로 바뀌므로 base 보정도 옵션별로 다시 계산한다.
                const optScale = getBasePreviewScale(opt.value, profileCharacterStyle, profileCharacterVariant);
                return (
                  <Box
                    key={opt.value}
                    onClick={() => setEditForm({ ...editForm, gender: opt.value })}
                    sx={{
                      flex: 1, textAlign: 'center', py: 1.2, borderRadius: 2, cursor: 'pointer',
                      border: `2px solid ${editForm.gender === opt.value ? '#6BCB77' : '#E0E0E0'}`,
                      bgcolor: editForm.gender === opt.value ? '#E8F5E9' : '#FAFAFA',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Box sx={optScale !== 1 ? { display: 'inline-block', transform: `scale(${optScale})`, transformOrigin: 'bottom center' } : { display: 'inline-block' }}>
                      <FitBuddyCharacter
                        size={36}
                        gender={opt.value}
                        characterStyle={profileCharacterStyle}
                        characterVariant={profileCharacterVariant}
                      />
                    </Box>
                    <Typography variant='caption' sx={{ display: 'block', fontWeight: editForm.gender === opt.value ? 700 : 400, color: editForm.gender === opt.value ? '#2E7D32' : '#757575' }}>
                      {opt.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={loading}>취소</Button>
          <Button variant='contained' onClick={saveProfile} disabled={loading} sx={{ bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 통계 상세 모달 4개 */}
      {[
        {
          key: 'total', title: '총 운동 기록 💪',
          rows: [
            { label: '총 운동 횟수', value: `${stats.totalWorkouts}회` },
            { label: '총 운동 시간', value: `${workoutDetails.totalTime}분` },
            { label: '총 소모 칼로리', value: `${workoutDetails.totalCalories.toLocaleString()}kcal` },
            { label: '가장 많이 한 운동', value: workoutDetails.topWorkout || '기록 없음' },
          ],
        },
        {
          key: 'week', title: '이번 주 운동 📅',
          rows: [
            { label: '이번 주 운동 일수', value: `${stats.thisWeek}일` },
            { label: '이번 주 운동 시간', value: `${workoutDetails.weekTime}분` },
            { label: '이번 주 소모 칼로리', value: `${workoutDetails.weekCalories.toLocaleString()}kcal` },
          ],
        },
        {
          key: 'today', title: '오늘 운동 🏃',
          rows: [
            { label: '오늘 운동 횟수', value: `${stats.todayCount}회` },
            { label: '오늘 운동 시간', value: `${workoutDetails.todayTime}분` },
            { label: '오늘 소모 칼로리', value: `${workoutDetails.todayCalories.toLocaleString()}kcal` },
          ],
        },
        {
          key: 'streak', title: '연속 운동 🔥',
          rows: [
            { label: '현재 연속 운동일', value: `${stats.streak}일` },
            { label: '최고 연속 운동일', value: `${workoutDetails.bestStreak}일` },
            {
              label: '응원 메시지',
              value: stats.streak === 0 ? '오늘부터 다시 시작해봐요! 💪'
                : stats.streak < 3 ? '좋은 시작이에요! 계속 유지해봐요 🌱'
                : stats.streak < 7 ? `${stats.streak}일 연속! 멈추지 마세요 🔥`
                : `대단해요! ${stats.streak}일째 운동 중! 🏆`,
            },
          ],
        },
      ].map(({ key, title, rows }) => (
        <Dialog
          key={key}
          open={statsModal === key}
          onClose={() => setStatsModal(null)}
          fullWidth
          maxWidth='xs'
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{title}</DialogTitle>
          <DialogContent sx={{ py: 1.5 }}>
            {rows.map((row) => (
              <Box
                key={row.label}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid #F5F5F5' }}
              >
                <Typography variant='body2' color='text.secondary'>{row.label}</Typography>
                <Typography variant='body2' sx={{ fontWeight: 700 }}>{row.value}</Typography>
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2 }}>
            <Button fullWidth variant='contained' onClick={() => setStatsModal(null)} sx={{ bgcolor: '#6BCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
              닫기
            </Button>
          </DialogActions>
        </Dialog>
      ))}

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
