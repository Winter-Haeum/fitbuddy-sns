import { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import TimerIcon from '@mui/icons-material/Timer';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../utils/supabase';
import { getLocalToday } from '../utils/date-utils';
import Layout from '../components/common/layout';
import { getLevelFromXP } from '../utils/xp-utils';

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

function getTodayRoutine() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return ROUTINES[dayOfYear % ROUTINES.length];
}

const MOODS = [
  { key: 'tired', emoji: '😴', label: '피곤', text: '피곤한 하루예요.' },
  { key: 'normal', emoji: '😐', label: '보통', text: '평범한 컨디션이에요.' },
  { key: 'good', emoji: '😊', label: '좋음', text: '오늘 컨디션이 좋아요.' },
  { key: 'great', emoji: '💪', label: '활기참', text: '에너지가 넘치는 날이에요.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [character, setCharacter] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [joinedCount, setJoinedCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [reminderOn, setReminderOn] = useState(() => localStorage.getItem('workoutReminderEnabled') === '1');
  const [editingMood, setEditingMood] = useState(false);
  const [goalEditMode, setGoalEditMode] = useState(false);
  const [goalEditValue, setGoalEditValue] = useState('60');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  async function handleSignOut() {
    setMenuAnchor(null);
    await signOut();
    navigate('/login');
  }

  function toggleReminder() {
    const next = !reminderOn;
    setReminderOn(next);
    localStorage.setItem('workoutReminderEnabled', next ? '1' : '0');
    setSnack({ open: true, msg: next ? '운동 알림이 켜졌습니다 💪' : '운동 알림이 꺼졌습니다', severity: 'info' });
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
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('fitbuddy_daily_logs').upsert(
      { user_id: user.id, log_date: today, daily_goal_minutes: v },
      { onConflict: 'user_id,log_date' }
    );
    setTodayLog((prev) => ({ ...(prev || { user_id: user.id, log_date: today }), daily_goal_minutes: v }));
  }

  async function awardGoalXP() {
    const today = new Date().toISOString().split('T')[0];
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
    if (todayWorkout.duration >= goalMinutes) awardGoalXP();
  }, [todayWorkout, todayLog]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    supabase
      .from('fitbuddy_workouts')
      .select('duration_minutes, calories_burned, steps')
      .eq('user_id', user.id)
      .eq('workout_date', today)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const totals = data.reduce(
            (acc, w) => ({
              duration: acc.duration + (w.duration_minutes || 0),
              calories: acc.calories + (w.calories_burned || 0),
              steps: acc.steps + (w.steps || 0),
            }),
            { duration: 0, calories: 0, steps: 0 }
          );
          setTodayWorkout(totals);
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
  }, [user, location.key]);

  const goalMinutes = todayLog?.daily_goal_minutes || 60;
  const progress = todayWorkout ? Math.min((todayWorkout.duration / goalMinutes) * 100, 100) : 0;

  function getActivityState() {
    if (!todayWorkout || todayWorkout.duration === 0) return { label: '휴식중', emoji: '💤', color: '#9E9E9E' };
    if (progress >= 100) return { label: '달성완료', emoji: '🏆', color: '#FFB300' };
    if (todayWorkout.duration >= 30) return { label: '활력중', emoji: '💪', color: '#A084E8' };
    return { label: '운동중', emoji: '🏃', color: '#5DA9E9' };
  }

  const activityState = getActivityState();
  const characterMood = progress === 0 ? 'idle' : progress >= 70 ? 'celebrating' : progress >= 30 ? 'running' : 'active';

  return (
    <Layout>
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
            <IconButton onClick={toggleReminder} sx={{ color: reminderOn ? '#FFB300' : '#9E9E9E' }}>
              {reminderOn ? <NotificationsIcon /> : <NotificationsOffIcon />}
            </IconButton>
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
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1B5E20', lineHeight: 1.6 }}>
              💡 {quote}
            </Typography>
          </CardContent>
        </Card>

        {/* 2. 캐릭터 게이지 카드 */}
        <Card sx={{ mb: 2, cursor: 'pointer', overflow: 'hidden', position: 'relative' }} onClick={() => navigate('/character')}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography variant='h4' sx={{ fontWeight: 700 }}>오늘의 운동 목표</Typography>
                <Chip label={`Lv.${character?.level || 1}`} size='small' color='primary' sx={{ height: 20, fontSize: '0.65rem' }} />
              </Box>
              <Chip
                label={todayLog?.goal_achieved ? '🏆 달성!' : progress >= 100 ? '🎯 완료' : `${Math.round(progress)}%`}
                size='small'
                sx={{
                  bgcolor: todayLog?.goal_achieved ? '#FFB300' : progress >= 100 ? '#FFB30044' : `${activityState.color}22`,
                  color: todayLog?.goal_achieved ? 'white' : progress >= 100 ? '#FF8F00' : activityState.color,
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

            {/* 시간 라벨 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='caption' color='text.secondary'>{todayWorkout?.duration || 0}분</Typography>
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
                      width: '42px', fontSize: '0.75rem',
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

        {/* 3. 오늘의 컨디션 */}
        <Card sx={{ mb: 2, bgcolor: '#FAFAFA', border: '1px solid #E8EAF6' }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1.2, color: '#333' }}>
              오늘의 컨디션은 어때요?
            </Typography>
            {todayLog?.mood_status && !editingMood ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#A084E8', lineHeight: 1.4 }}>
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
                <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>
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
                    <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{m.emoji}</Typography>
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
            py: 1.8, mb: 2, fontSize: '1.1rem',
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
                <Typography sx={{ fontSize: '2rem' }}>{r.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='h4'>{r.name}</Typography>
                  <Typography variant='body2' color='text.secondary'>{r.duration} · {r.level}</Typography>
                </Box>
                <Chip label='시작' size='small' color='primary' />
              </CardContent>
            </Card>
          );
        })()}

        {/* 6. 오늘 운동 기록 요약 */}
        <Typography variant='h4' sx={{ mb: 1.2, fontWeight: 600 }}>오늘 운동 요약</Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#E8F5E9' }}>
              <CardContent sx={{ py: 1.5, px: 1 }}>
                <TimerIcon sx={{ color: '#6BCB77', fontSize: 24 }} />
                <Typography variant='h4' sx={{ fontWeight: 700, color: '#4CAF5A' }}>
                  {todayWorkout?.duration || 0}
                </Typography>
                <Typography variant='caption' color='text.secondary'>분</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#FFF3E0' }}>
              <CardContent sx={{ py: 1.5, px: 1 }}>
                <LocalFireDepartmentIcon sx={{ color: '#FF7043', fontSize: 24 }} />
                <Typography variant='h4' sx={{ fontWeight: 700, color: '#FF7043' }}>
                  {todayWorkout?.calories || 0}
                </Typography>
                <Typography variant='caption' color='text.secondary'>kcal</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#E3F2FD' }}>
              <CardContent sx={{ py: 1.5, px: 1 }}>
                <DirectionsWalkIcon sx={{ color: '#5DA9E9', fontSize: 24 }} />
                <Typography variant='h4' sx={{ fontWeight: 700, color: '#5DA9E9' }}>
                  {(todayWorkout?.steps || 0).toLocaleString()}
                </Typography>
                <Typography variant='caption' color='text.secondary'>걸음</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 7. 기록관 바로가기 */}
        <Card
          sx={{ mb: 2, cursor: 'pointer', border: '1px solid #E3F2FD', bgcolor: '#F8FCFF', '&:hover': { boxShadow: '0 4px 12px rgba(93,169,233,0.15)' } }}
          onClick={() => navigate('/records')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: '1.8rem' }}>📓</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant='h4' sx={{ fontWeight: 600, color: '#1565C0' }}>기록관</Typography>
              <Typography variant='body2' color='text.secondary'>운동 일기 · 컨디션 · 기록 확인</Typography>
            </Box>
            <Typography color='text.secondary'>›</Typography>
          </CardContent>
        </Card>

        {/* 8. 챌린지 현황 */}
        <Card
          sx={{ mb: 2, cursor: 'pointer', border: '1px solid #EDE7F6', bgcolor: '#FAF8FF', '&:hover': { boxShadow: '0 4px 12px rgba(160,132,232,0.15)' } }}
          onClick={() => navigate('/challenges')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 32, color: '#A084E8' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant='h4' sx={{ fontWeight: 600, color: '#6B4FC8' }}>
                {joinedCount > 0 ? `${joinedCount}개 챌린지 참여 중` : '챌린지 참여하기'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>운동 챌린지로 함께 성장해요 🎯</Typography>
            </Box>
            <Typography color='text.secondary'>›</Typography>
          </CardContent>
        </Card>

        {/* 게시글 작성 FAB */}
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => navigate('/create')}
          sx={{
            position: 'fixed', bottom: 80, right: 16,
            borderRadius: 30, bgcolor: '#A084E8', color: 'white',
            '&:hover': { bgcolor: '#8B6FD4' },
            boxShadow: '0 4px 15px rgba(160,132,232,0.4)',
            zIndex: 100,
          }}
        >
          게시글 작성
        </Button>
      </Box>

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
