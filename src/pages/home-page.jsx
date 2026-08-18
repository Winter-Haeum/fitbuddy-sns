import { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Fab from '@mui/material/Fab';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import TimerIcon from '@mui/icons-material/Timer';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../utils/supabase';
import { getLocalToday } from '../utils/date-utils';
import Layout from '../components/common/layout';
import { getLevelFromXP } from '../utils/xp-utils';
import { MOODS } from '../constants/workout';
import StatsCard from '../components/ui/stats-card';
import { useDailySteps, DAILY_STEP_GOAL } from '../hooks/use-daily-steps';
import { useFontScale } from '../hooks/use-font-scale';

const confettiFall = keyframes({
  '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
  '100%': { transform: 'translateY(160px) rotate(540deg)', opacity: 0 },
});

const CONFETTI_COLORS = ['#5FCB77', '#FFB300', '#5DA9E9', '#A084E8', '#FF7043', '#FF9AA2'];
const CONFETTI_PIECES = Array.from({ length: 16 }, (_, i) => ({
  x: 2 + i * 6.2,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: parseFloat(((i * 0.12) % 1.6).toFixed(2)),
  isSquare: i % 3 === 0,
}));

const QUOTES = [
  '오늘의 땀이 내일의 자신감을 만든다.',
  '작은 운동도 쌓이면 큰 변화가 된다.',
  '포기하지 않는 사람이 결국 변한다.',
  '오늘 움직인 만큼 내 몸은 달라진다.',
  '습관이 쌓이면 인생이 바뀐다.',
  '시작이 반이다. 오늘도 파이팅!',
  '꾸준함이 재능을 이긴다.',
];

const ROUTINES = [
  { name: '상체 집중 루틴', icon: '💪', duration: '35분', level: '중급', type: '헬스', durationNum: 35 },
  { name: '하체 집중 루틴', icon: '🦵', duration: '35분', level: '중급', type: '헬스', durationNum: 35 },
  { name: '유산소 런닝', icon: '🏃', duration: '40분', level: '중급', type: '러닝', durationNum: 40 },
  { name: '전신 홈트', icon: '🏠', duration: '45분', level: '중급', type: '홈트', durationNum: 45 },
  { name: '코어 & 플랭크', icon: '🔥', duration: '30분', level: '초급', type: '홈트', durationNum: 30 },
  { name: '장거리 러닝', icon: '🏅', duration: '60분', level: '고급', type: '러닝', durationNum: 60 },
  { name: '회복 스트레칭', icon: '🧘', duration: '20분', level: '초급', type: '스트레칭', durationNum: 20 },
];

// 걸음 목표 입력 허용 범위. 0 이하/비정상적으로 큰 값은 저장하지 않는다.
const MIN_STEP_GOAL = 1000;
const MAX_STEP_GOAL = 100000;

function getTodayRoutine() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return ROUTINES[dayOfYear % ROUTINES.length];
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, fetchProfile } = useAuth();
  // 장식용 이모지/아이콘(제목이 아니라 보조 요소)에 쓰는 헬퍼 — use-font-scale.jsx의
  // scaleRem을 공용으로 쓴다(페이지마다 계산식을 따로 두지 않기 위해).
  const { scaleRem: es } = useFontScale();
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [todayWorkoutList, setTodayWorkoutList] = useState([]);
  const [workoutSummaryOpen, setWorkoutSummaryOpen] = useState(false);
  const [character, setCharacter] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [joinedCount, setJoinedCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editingMood, setEditingMood] = useState(false);
  const [goalEditMode, setGoalEditMode] = useState(false);
  const [goalEditValue, setGoalEditValue] = useState('60');
  const [stepGoalEditMode, setStepGoalEditMode] = useState(false);
  const [stepGoalEditValue, setStepGoalEditValue] = useState('10000');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  // 오늘의 걸음: 운동 목표/진행률과는 완전히 별개의 데이터(Android Health Connect 기반).
  const dailySteps = useDailySteps();

  // 1회차 목표 달성 후 추가 운동(2회차) 진행 상태 — DB에 저장하지 않는 프론트 전용 상태.
  // 새로고침하면 초기화되며, todayWorkout.duration은 그대로 유지되므로 1회차 달성 기록은 보존된다.
  const [extraGoalMode, setExtraGoalMode] = useState(false);
  const [extraGoalBaseDuration, setExtraGoalBaseDuration] = useState(0);

  // 날짜 변경 감지 — 자정 넘으면 오늘 데이터 초기화
  const [currentDate, setCurrentDate] = useState(getLocalToday);
  useEffect(() => {
    const timer = setInterval(() => {
      const newDate = getLocalToday();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        setTodayWorkout(null);
        setTodayWorkoutList([]);
        setTodayLog(null);
        setGoalEditValue('60');
        setExtraGoalMode(false);
        setExtraGoalBaseDuration(0);
      }
    }, 30000); // 30초마다 날짜 체크
    return () => clearInterval(timer);
  }, [currentDate]);

  async function handleSignOut() {
    setMenuAnchor(null);
    await signOut();
    navigate('/login');
  }

  async function saveMood(moodKey) {
    const today = getLocalToday();
    const payload = { user_id: user.id, log_date: today, mood_status: moodKey };
    try {
      const { error } = await supabase
        .from('fitbuddy_daily_logs')
        .upsert(payload, { onConflict: 'user_id,log_date' });
      if (error) {
        setSnack({ open: true, msg: '저장에 실패했습니다: ' + error.message, severity: 'error' });
        return;
      }
      setTodayLog((prev) => ({ ...(prev || {}), mood_status: moodKey }));
      setSnack({ open: true, msg: '오늘의 컨디션이 저장되었습니다!', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: '저장 중 오류가 발생했습니다.', severity: 'error' });
    }
  }

  async function saveGoalMinutes() {
    setGoalEditMode(false);
    const parsed = parseInt(goalEditValue, 10);
    const v = isNaN(parsed) ? goalMinutes : Math.max(10, Math.min(300, parsed));
    setGoalEditValue(String(v));
    if (v === goalMinutes) return;
    const today = getLocalToday();
    await supabase.from('fitbuddy_daily_logs').upsert(
      { user_id: user.id, log_date: today, daily_goal_minutes: v },
      { onConflict: 'user_id,log_date' }
    );
    setTodayLog((prev) => ({ ...(prev || { user_id: user.id, log_date: today }), daily_goal_minutes: v }));
  }

  // 걸음 목표는 운동 세션이 아니라 계정 preference 성격이 강해 fitbuddy_users에 저장한다.
  // Health Connect가 돌려주는 실제 걸음 수(dailySteps.steps)는 절대 건드리지 않고, 목표
  // 값만 바뀌므로 퍼센트/진행바는 stepGoal이 바뀌는 즉시 재계산되어 반영된다.
  async function saveStepGoal() {
    setStepGoalEditMode(false);
    const parsed = parseInt(stepGoalEditValue, 10);
    const v = isNaN(parsed) ? stepGoal : Math.max(MIN_STEP_GOAL, Math.min(MAX_STEP_GOAL, parsed));
    setStepGoalEditValue(String(v));
    if (v === stepGoal) return;
    const { error } = await supabase.from('fitbuddy_users').update({ daily_step_goal: v }).eq('id', user.id);
    if (error) {
      console.error('[saveStepGoal] 저장 실패:', error.message);
      setSnack({ open: true, msg: '걸음 목표 저장에 실패했습니다.', severity: 'error' });
      return;
    }
    await fetchProfile(user.id);
  }

  async function awardGoalXP() {
    const today = getLocalToday();
    const { data: charData } = await supabase
      .from('fitbuddy_characters').select('experience, level').eq('user_id', user.id).maybeSingle();
    if (!charData) return;
    const newXp = (charData.experience || 0) + 10;
    const newLevel = getLevelFromXP(newXp);
    await supabase.from('fitbuddy_characters').update({ experience: newXp, level: newLevel }).eq('user_id', user.id);
    await supabase.from('fitbuddy_daily_logs').upsert(
      { user_id: user.id, log_date: today, goal_achieved: true, goal_achieved_at: new Date().toISOString() },
      { onConflict: 'user_id,log_date' }
    );
    setTodayLog((prev) => ({ ...(prev || {}), goal_achieved: true }));
    setCharacter((prev) => prev ? { ...prev, experience: newXp, level: newLevel } : prev);
    setSnack({ open: true, msg: '오늘 목표 달성! +10 XP 🏆', severity: 'success' });
  }

  useEffect(() => {
    if (!user || !todayWorkout || !todayLog || todayLog.goal_achieved) return;
    // Keep the XP reward gate stable; adding deps can re-run awardGoalXP before goal_achieved is persisted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (todayWorkout.duration >= goalMinutes) awardGoalXP();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayWorkout, todayLog]);

  useEffect(() => {
    if (!user) return;
    const today = getLocalToday();

    supabase
      .from('fitbuddy_workouts')
      .select('duration_minutes, calories_burned, workout_type, intensity')
      .eq('user_id', user.id)
      .eq('workout_date', today)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const totals = data.reduce(
            (acc, w) => ({
              duration: acc.duration + (w.duration_minutes || 0),
              calories: acc.calories + (w.calories_burned || 0),
            }),
            { duration: 0, calories: 0 }
          );
          setTodayWorkout(totals);
          setTodayWorkoutList(data);
        }
      });

    supabase
      .from('fitbuddy_characters')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setCharacter(data));

    supabase
      .from('fitbuddy_daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTodayLog(data);
          setGoalEditValue(String(data.daily_goal_minutes || 60));
        }
      });

    supabase
      .from('fitbuddy_challenge_users')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setJoinedCount(count || 0));
  }, [user, location.key, currentDate]);

  const goalMinutes = todayLog?.daily_goal_minutes || 60;
  // extraGoalMode: 1회차 달성 후 추가 운동은 추가된 시간만 2회차 진행률에 반영(기존 1회차 시간은 그대로 유지)
  const effectiveDuration = extraGoalMode
    ? Math.max(0, (todayWorkout?.duration || 0) - extraGoalBaseDuration)
    : (todayWorkout?.duration || 0);
  const progress = todayWorkout ? Math.min((effectiveDuration / goalMinutes) * 100, 100) : 0;

  function getActivityState() {
    if (!todayWorkout || todayWorkout.duration === 0) return { label: '휴식중', emoji: '💤', color: '#9E9E9E' };
    if (extraGoalMode && progress >= 100) return { label: '2회차 달성!', emoji: '🎉', color: '#FFB300' };
    if (extraGoalMode) return { label: '추가 운동중', emoji: '🔥', color: '#FF7043' };
    if (progress >= 100) return { label: '달성완료', emoji: '🏆', color: '#FFB300' };
    if (todayWorkout.duration >= 30) return { label: '활력중', emoji: '💪', color: '#A084E8' };
    return { label: '운동중', emoji: '🏃', color: '#5DA9E9' };
  }

  function handleStartExtraGoal(e) {
    e.stopPropagation();
    setExtraGoalMode(true);
    setExtraGoalBaseDuration(todayWorkout?.duration || 0);
    setSnack({ open: true, msg: '추가 운동 시작! 새 목표를 향해 달려봐요 🔥', severity: 'info' });
  }

  const activityState = getActivityState();
  const characterMood = progress === 0 ? 'idle' : progress >= 70 ? 'celebrating' : progress >= 30 ? 'running' : 'active';
  // fitbuddy_users.daily_step_goal이 아직 없는 사용자(컬럼 미도입/미설정)는 기존 고정값으로 폴백.
  const stepGoal = profile?.daily_step_goal || DAILY_STEP_GOAL;
  const stepPercent = Math.round((dailySteps.steps / stepGoal) * 100);
  const stepProgressClamped = Math.min(stepPercent, 100);

  return (
    <Layout>
      {/* 상단 오늘 목표 진행률 바 */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, height: 3, bgcolor: '#E8F5E9', width: '100%' }}>
        <Box
          sx={{
            height: '100%',
            width: `${progress}%`,
            bgcolor: progress >= 100 ? '#FFB300' : '#6BCB77',
            borderRadius: '0 3px 3px 0',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease',
            willChange: 'width',
          }}
        />
      </Box>

      <Box sx={{ p: 2 }}>
        {/* 상단 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant='body2' color='text.secondary'>안녕하세요 👋</Typography>
            <Typography variant='h3' sx={{ fontWeight: 700 }}>
              {profile?.display_name || '핏버디'}님
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 알림 종 아이콘은 실제 알림 기능(로컬/푸시 알림)이 전혀 없는 로컬 UI 토글일
                뿐이었다(localStorage 값만 바꾸고 어떤 알림도 발생시키지 않음) — 있는 것처럼
                오해를 주는 상태로 남겨두지 않기 위해 실제 알림 설정 기능이 만들어지기 전까지
                제거한다. */}
            <Avatar
              src={profile?.avatar_url}
              sx={{ bgcolor: 'primary.main', cursor: 'pointer' }}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              {profile?.display_name?.[0] || 'F'}
            </Avatar>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { setMenuAnchor(null); navigate('/profile'); }}>
                <ListItemIcon><PersonIcon fontSize='small' /></ListItemIcon>
                내 프로필
              </MenuItem>
              <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize='small' sx={{ color: 'error.main' }} /></ListItemIcon>
                로그아웃
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* 1. 오늘의 한마디 */}
        <Card sx={{ mb: 2, bgcolor: 'white', border: '2px solid #C8E6C9', boxShadow: '0 2px 10px rgba(107,203,119,0.12)' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant='caption' sx={{ color: '#6BCB77', fontWeight: 700, letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
              오늘의 한마디
            </Typography>
            {/* variant 없이 fontSize:'1rem'을 직접 박아뒀던 부분 — 글자 크기 설정을 완전히
                우회하고 있었다. body1(테마 스케일 적용)로 바꿔 본문 위계를 유지하면서 4단계에
                맞춰 함께 커지고 작아지게 한다. */}
            <Typography variant='body1' sx={{ fontWeight: 600, color: '#1B5E20', lineHeight: 1.6 }}>
              💡 {quote}
            </Typography>
          </CardContent>
        </Card>

        {/* 2. 캐릭터 게이지 카드 */}
        <Card sx={{ mb: 1, cursor: 'pointer', overflow: 'hidden', position: 'relative' }} onClick={() => navigate('/character')}>
          {/* 폭죽 효과 (100% 달성 시) */}
          {progress >= 100 && (
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
              {CONFETTI_PIECES.map((p, i) => (
                <Box key={i} sx={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: 0,
                  width: p.isSquare ? 9 : 7,
                  height: p.isSquare ? 7 : 9,
                  borderRadius: p.isSquare ? '2px' : '50%',
                  bgcolor: p.color,
                  animation: `${confettiFall} 1.6s ${p.delay}s ease-in infinite`,
                }} />
              ))}
            </Box>
          )}

          <CardContent sx={{ pb: 1.5, position: 'relative', zIndex: 6 }}>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3, flexWrap: 'wrap', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                <Typography variant='h4' sx={{ fontWeight: 700, wordBreak: 'keep-all' }}>오늘의 운동 목표</Typography>
                <Chip label={`Lv.${character?.level || 1}`} size='small' color='primary' sx={{ height: 20, fontSize: es(0.65), flexShrink: 0 }} />
              </Box>
              <Chip
                label={
                  extraGoalMode
                    ? (progress >= 100 ? '🎉 2회차 달성!' : `2회차 ${Math.round(progress)}%`)
                    : (todayLog?.goal_achieved ? '🏆 달성!' : progress >= 100 ? '🎯 완료' : `${Math.round(progress)}%`)
                }
                size='small'
                sx={{
                  flexShrink: 0,
                  bgcolor: extraGoalMode ? '#FF704322' : (todayLog?.goal_achieved ? '#FFB300' : progress >= 100 ? '#FFB30044' : `${activityState.color}22`),
                  color: extraGoalMode ? '#FF7043' : (todayLog?.goal_achieved ? 'white' : progress >= 100 ? '#FF8F00' : activityState.color),
                  fontWeight: 700,
                }}
              />
            </Box>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
              {profile?.display_name ? `${profile.display_name}의 캐릭터` : (character?.character_name || '내 캐릭터')} · {activityState.label} {activityState.emoji}
            </Typography>

            {/* 게이지 트랙 */}
            <Box sx={{ position: 'relative', height: 84, mx: 0.5 }}>
              {/* 캐릭터 (게이지 위에서 이동) */}
              <Box sx={{
                position: 'absolute',
                bottom: 16,
                left: `calc(${Math.min(Math.max(progress, 0), 93)}% - 22px)`,
                transition: 'left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 2,
                filter: progress >= 100 ? 'drop-shadow(0 0 8px rgba(255,179,0,0.8))' : 'none',
              }}>
                <FitBuddyCharacter size={44} gender={profile?.gender || 'female'} mood={characterMood} />
              </Box>

              {/* 진행 바 트랙 */}
              <Box sx={{
                position: 'absolute',
                bottom: 4,
                left: 0, right: 0,
                height: 12,
                bgcolor: '#F0F0F0',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <Box sx={{
                  width: `${progress}%`,
                  minWidth: progress > 0 ? 12 : 0,
                  height: '100%',
                  borderRadius: 6,
                  background: progress >= 100
                    ? 'linear-gradient(90deg, #FFB300, #FF8F00)'
                    : progress >= 60
                    ? 'linear-gradient(90deg, #5FCB77, #5DA9E9)'
                    : 'linear-gradient(90deg, #5FCB77, #6BCB77)',
                  transition: 'width 0.7s ease',
                  boxShadow: progress > 0 ? '0 1px 4px rgba(95,203,119,0.4)' : 'none',
                }} />
              </Box>
            </Box>

            {/* 달성 후 추가 운동 버튼 — 카드 클릭과 분리 */}
            {todayLog?.goal_achieved && !extraGoalMode && (
              <Box
                onClick={handleStartExtraGoal}
                sx={{
                  mt: 1, mb: 0.5, py: 0.8, px: 1.5,
                  bgcolor: '#FF704314', borderRadius: 2,
                  border: '1px dashed #FF7043',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#FF704322' },
                  '&:active': { transform: 'scale(0.98)' },
                  transition: 'all 0.15s',
                }}
              >
                <Typography sx={{ fontSize: es(1) }}>🔥</Typography>
                <Typography variant='body2' sx={{ fontWeight: 700, color: '#FF7043' }}>
                  추가 운동 시작
                </Typography>
              </Box>
            )}

            {/* 시간 라벨 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='caption' color='text.secondary'>
                {extraGoalMode
                  ? `+${effectiveDuration}분 (총 ${todayWorkout?.duration || 0}분)`
                  : `${todayWorkout?.duration || 0}분`}
              </Typography>
              {goalEditMode ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography variant='caption' color='text.secondary'>목표 </Typography>
                  <input
                    type='number'
                    value={goalEditValue}
                    autoFocus
                    onChange={(e) => setGoalEditValue(e.target.value)}
                    onBlur={saveGoalMinutes}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.target.blur(); }
                      if (e.key === 'Escape') { setGoalEditMode(false); setGoalEditValue(String(goalMinutes)); }
                    }}
                    style={{
                      width: '42px', fontSize: es(0.75),
                      border: 'none', borderBottom: '1.5px solid #6BCB77',
                      background: 'transparent', textAlign: 'center', outline: 'none',
                    }}
                  />
                  <Typography variant='caption' color='text.secondary'>분</Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setGoalEditValue(String(goalMinutes)); setGoalEditMode(true); }}
                >
                  <Typography variant='caption' color='text.secondary'>목표 {goalMinutes}분</Typography>
                  <EditIcon sx={{ fontSize: 10, color: '#ccc' }} />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 2.5 오늘의 걸음 — 운동 세션과 무관한 하루 전체 걸음 수. Android 앱(Health Connect)에서만 표시 */}
        {dailySteps.isNative && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.2, px: 2 }}>
              {dailySteps.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant='circular' width={18} height={18} />
                  <Skeleton variant='text' width='55%' height={20} />
                </Box>
              ) : dailySteps.availability !== 'available' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsWalkIcon sx={{ fontSize: 18, color: '#9E9E9E' }} />
                  <Typography variant='caption' color='text.secondary'>
                    이 기기에서는 자동 걸음 측정을 사용할 수 없습니다.
                  </Typography>
                </Box>
              ) : dailySteps.error ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant='caption' color='text.secondary'>걸음 수를 불러오지 못했습니다.</Typography>
                  <Button size='small' onClick={dailySteps.refresh} sx={{ minWidth: 0, py: 0.2, fontSize: es(0.75) }}>
                    재시도
                  </Button>
                </Box>
              ) : !dailySteps.permissionGranted ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                    <DirectionsWalkIcon sx={{ fontSize: 18, color: '#5DA9E9', flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant='body2' sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>오늘의 걸음</Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.3 }} noWrap>
                        걸음 수 연결 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Button size='small' variant='outlined' onClick={dailySteps.connect} sx={{ minWidth: 0, py: 0.2, px: 1.2, fontSize: es(0.75), flexShrink: 0 }}>
                    연결
                  </Button>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <DirectionsWalkIcon sx={{ fontSize: 18, color: '#5DA9E9' }} />
                      <Typography variant='body2' sx={{ fontWeight: 700 }}>오늘의 걸음</Typography>
                    </Box>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: '#5DA9E9' }}>{stepPercent}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, height: 8, bgcolor: '#E3F2FD', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${stepProgressClamped}%`, height: '100%', bgcolor: '#5DA9E9',
                        borderRadius: 4, transition: 'width 0.5s ease',
                      }} />
                    </Box>
                    {stepGoalEditMode ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontSize: es(0.72) }}>
                          {dailySteps.steps.toLocaleString()}/
                        </Typography>
                        <input
                          type='number'
                          value={stepGoalEditValue}
                          autoFocus
                          onChange={(e) => setStepGoalEditValue(e.target.value)}
                          onBlur={saveStepGoal}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.target.blur(); }
                            if (e.key === 'Escape') { setStepGoalEditMode(false); setStepGoalEditValue(String(stepGoal)); }
                          }}
                          style={{
                            width: '52px', fontSize: es(0.72),
                            border: 'none', borderBottom: '1.5px solid #5DA9E9',
                            background: 'transparent', textAlign: 'center', outline: 'none',
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => { setStepGoalEditValue(String(stepGoal)); setStepGoalEditMode(true); }}
                      >
                        <Typography variant='caption' color='text.secondary' sx={{ fontSize: es(0.72) }}>
                          {dailySteps.steps.toLocaleString()}/{stepGoal.toLocaleString()}
                        </Typography>
                        <EditIcon sx={{ fontSize: 10, color: '#ccc' }} />
                      </Box>
                    )}
                  </Box>
                  {!dailySteps.activityRecognitionGranted && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.4 }}>
                      <Typography
                        variant='caption'
                        onClick={dailySteps.enableLiveSteps}
                        sx={{ color: '#5DA9E9', fontWeight: 600, fontSize: es(0.68), cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        실시간 걸음 보기 켜기
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. 오늘의 컨디션 */}
        <Card sx={{ mb: 2, bgcolor: '#FAFAFA', border: '1px solid #E8EAF6' }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1.2, color: '#333' }}>
              오늘의 컨디션은 어때요?
            </Typography>
            {todayLog?.mood_status && !editingMood ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: es(0.95), fontWeight: 600, color: '#A084E8', lineHeight: 1.4 }}>
                    {MOODS.find((m) => m.key === todayLog.mood_status)?.text}
                  </Typography>
                  <Typography
                    variant='caption'
                    onClick={() => setEditingMood(true)}
                    sx={{ color: '#999', cursor: 'pointer', textDecoration: 'underline', mt: 0.3, display: 'block' }}
                  >
                    변경하기
                  </Typography>
                </Box>
                {/* 선택된 컨디션 이모지 — 기존 3rem(리터럴, scale 우회)에서 2.25rem로 한 단계
                    낮추고 scale.content를 곱해 글자 크기 설정과 함께 움직이게 했다. */}
                <Typography sx={{ fontSize: es(2.25), lineHeight: 1 }}>
                  {MOODS.find((m) => m.key === todayLog.mood_status)?.emoji}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
                {MOODS.map((m) => (
                  <Box
                    key={m.key}
                    onClick={() => { saveMood(m.key); setEditingMood(false); }}
                    sx={{
                      flex: 1, textAlign: 'center', py: 1, borderRadius: 2, cursor: 'pointer',
                      bgcolor: todayLog?.mood_status === m.key ? '#EDE7F6' : 'transparent',
                      border: todayLog?.mood_status === m.key ? '2px solid #A084E8' : '2px solid transparent',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: '#F3E8FF' },
                    }}
                  >
                    <Typography sx={{ fontSize: es(1.3), lineHeight: 1 }}>{m.emoji}</Typography>
                    <Typography variant='caption' sx={{ color: todayLog?.mood_status === m.key ? '#A084E8' : '#888', fontWeight: todayLog?.mood_status === m.key ? 700 : 400 }}>
                      {m.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 4. 운동 시작 버튼 */}
        <Button
          variant='contained'
          fullWidth
          size='large'
          startIcon={<FitnessCenterIcon />}
          onClick={() => navigate('/timer')}
          sx={{
            py: 1.8, mb: 2, fontSize: es(1.1),
            bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' },
            boxShadow: '0 4px 15px rgba(95,203,119,0.35)',
          }}
        >
          운동 시작하기
        </Button>

        {/* 5. 추천 루틴 (날짜 기반 - 매일 자동 변경) */}
        <Typography variant='h4' sx={{ mb: 1.2, fontWeight: 600 }}>오늘의 추천 루틴</Typography>
        {(() => {
          const r = getTodayRoutine();
          return (
            <Card
              sx={{ cursor: 'pointer', mb: 2, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
              onClick={() => navigate('/timer', { state: { workoutType: r.type, duration: r.durationNum, level: r.level } })}
            >
              <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: es(1.5), flexShrink: 0 }}>{r.icon}</Typography>
                <Box sx={{ flex: '1 1 100px', minWidth: 0 }}>
                  <Typography variant='h4' sx={{ wordBreak: 'keep-all' }}>{r.name}</Typography>
                  <Typography variant='body2' color='text.secondary'>{r.duration} · {r.level}</Typography>
                </Box>
                <Chip label='시작' size='small' color='primary' sx={{ flexShrink: 0 }} />
              </CardContent>
            </Card>
          );
        })()}

        {/* 6. 오늘 운동 기록 요약 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>오늘 운동 요약</Typography>
          {todayWorkout && (
            <Typography
              variant='caption'
              onClick={() => setWorkoutSummaryOpen(true)}
              sx={{ color: '#6BCB77', cursor: 'pointer', fontWeight: 600 }}
            >
              상세 보기 →
            </Typography>
          )}
        </Box>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { icon: <TimerIcon sx={{ color: '#6BCB77', fontSize: es(1.35) }} />, value: todayWorkout?.duration || 0, unit: '분', bgcolor: '#E8F5E9', color: '#4CAF5A' },
            { icon: <LocalFireDepartmentIcon sx={{ color: '#FF7043', fontSize: es(1.35) }} />, value: todayWorkout?.calories || 0, unit: 'kcal', bgcolor: '#FFF3E0', color: '#FF7043' },
          ].map((item, i) => (
            <Grid size={{ xs: 6 }} key={i}>
              <StatsCard
                icon={item.icon}
                value={item.value}
                unit={item.unit}
                bgcolor={item.bgcolor}
                color={item.color}
                onClick={todayWorkout ? () => setWorkoutSummaryOpen(true) : undefined}
              />
            </Grid>
          ))}
        </Grid>

        {/* 7. 기록관 바로가기 */}
        <Card
          sx={{ mb: 2, cursor: 'pointer', border: '1px solid #E3F2FD', bgcolor: '#F8FCFF', '&:hover': { boxShadow: '0 4px 12px rgba(93,169,233,0.15)' } }}
          onClick={() => navigate('/records')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            {/* 이모지(📓)는 같은 rem이어도 outline 아이콘보다 시각적으로 더 무거워 보여, rem을
                아무리 낮춰도 옆 챌린지 카드의 EmojiEventsIcon과 무게감이 안 맞았다 — 같은
                outline 아이콘 계열(AutoStoriesIcon)로 바꿔 렌더링 방식 자체를 맞췄다. */}
            <AutoStoriesIcon sx={{ fontSize: es(1.5), color: '#5DA9E9', flexShrink: 0 }} />
            <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
              <Typography variant='h4' sx={{ fontWeight: 600, color: '#1565C0', wordBreak: 'keep-all' }}>기록관</Typography>
              {/* 큰 글씨에서도 설명이 카드를 무한정 늘리지 않도록 최대 2줄로 제한(글자 축소 아님) */}
              <Typography variant='body2' color='text.secondary' sx={{
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                운동 일기 · 컨디션 · 기록 확인
              </Typography>
            </Box>
            <Typography color='text.secondary' sx={{ flexShrink: 0 }}>›</Typography>
          </CardContent>
        </Card>

        {/* 8. 챌린지 현황 */}
        <Card
          sx={{ mb: 2, cursor: 'pointer', border: '1px solid #EDE7F6', bgcolor: '#FAF8FF', '&:hover': { boxShadow: '0 4px 12px rgba(160,132,232,0.15)' } }}
          onClick={() => navigate('/challenges')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <EmojiEventsIcon sx={{ fontSize: es(1.5), color: '#A084E8', flexShrink: 0 }} />
            <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
              <Typography variant='h4' sx={{ fontWeight: 600, color: '#6B4FC8', wordBreak: 'keep-all' }}>
                {joinedCount > 0 ? `${joinedCount}개 챌린지 참여 중` : '챌린지 참여하기'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                운동 챌린지로 함께 성장해요 🎯
              </Typography>
            </Box>
            <Typography color='text.secondary' sx={{ flexShrink: 0 }}>›</Typography>
          </CardContent>
        </Card>

        {/* 게시글 작성 FAB - 피드 페이지와 동일한 스타일로 통일 */}
        <Fab
          color='primary'
          onClick={() => navigate('/create')}
          sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 100 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* 오늘 운동 요약 상세 모달 */}
      <Dialog
        open={workoutSummaryOpen}
        onClose={() => setWorkoutSummaryOpen(false)}
        fullWidth maxWidth='xs'
        scroll='paper'
        sx={{ '& .MuiDialog-paper': { maxHeight: '85vh', mx: 2 } }}
      >
        <DialogTitle>오늘 운동 요약 💪</DialogTitle>
        <DialogContent dividers>
          {/* 총계 */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            {[
              { label: '운동 시간', value: `${todayWorkout?.duration || 0}분`, color: '#4CAF5A', bg: '#E8F5E9' },
              { label: '소모 칼로리', value: `${todayWorkout?.calories || 0}kcal`, color: '#FF7043', bg: '#FFF3E0' },
            ].map((s) => (
              <Box key={s.label} sx={{ flex: 1, textAlign: 'center', bgcolor: s.bg, borderRadius: 2, py: 1.2 }}>
                <Typography sx={{ fontWeight: 700, color: s.color, fontSize: es(1) }}>{s.value}</Typography>
                <Typography variant='caption' color='text.secondary'>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* 운동 목록 */}
          {todayWorkoutList.length > 0 && (
            <>
              <Typography variant='caption' sx={{ fontWeight: 700, color: '#757575', display: 'block', mb: 1 }}>
                오늘의 운동 기록
              </Typography>
              {todayWorkoutList.map((w, i) => (
                <Box key={i}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6BCB77', flexShrink: 0 }} />
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>{w.workout_type || '운동'}</Typography>
                    </Box>
                    <Typography variant='body2' color='text.secondary'>
                      {w.duration_minutes}분 · {w.calories_burned}kcal
                      {w.intensity && ` · ${w.intensity === 'low' ? '낮음' : w.intensity === 'high' ? '높음' : '보통'}`}
                    </Typography>
                  </Box>
                  {i < todayWorkoutList.length - 1 && <Divider />}
                </Box>
              ))}
            </>
          )}

          {/* 응원 문구 */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F3E8FF', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant='body2' sx={{ color: '#6B4FC8', fontWeight: 600 }}>
              {(todayWorkout?.duration || 0) >= 60 ? '🏆 오늘 목표 달성! 정말 대단해요!'
                : (todayWorkout?.duration || 0) >= 30 ? '💪 절반 이상 채웠어요. 파이팅!'
                : '🌱 작은 시작이 큰 변화를 만들어요!'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button fullWidth variant='contained' onClick={() => setWorkoutSummaryOpen(false)} sx={{ bgcolor: '#6BCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

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
