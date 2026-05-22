import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import TimerIcon from '@mui/icons-material/Timer';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../utils/supabase';
import Layout from '../components/common/layout';

const QUOTES = [
  '오늘의 땀이 내일의 자신감을 만든다.',
  '작은 운동도 쌓이면 큰 변화가 된다.',
  '포기하지 않는 사람이 결국 변한다.',
  '오늘 움직인 만큼 내 몸은 달라진다.',
];

const ROUTINES = [
  { name: '홈트 루틴', icon: '🏠', duration: '30분', level: '초급' },
  { name: '전신 스트레칭', icon: '🧘', duration: '15분', level: '초급' },
  { name: '유산소 런닝', icon: '🏃', duration: '40분', level: '중급' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [character, setCharacter] = useState(null);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    supabase
      .from('fitbuddy_workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_date', today)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const totals = data.reduce(
            (acc, w) => ({ duration: acc.duration + w.duration_minutes, calories: acc.calories + w.calories_burned, steps: acc.steps + w.steps }),
            { duration: 0, calories: 0, steps: 0 }
          );
          setTodayWorkout(totals);
        }
      });

    supabase
      .from('fitbuddy_characters')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setCharacter(data));
  }, [user]);

  const goalMinutes = 60;
  const progress = todayWorkout ? Math.min((todayWorkout.duration / goalMinutes) * 100, 100) : 0;

  const characterEmoji = () => {
    if (!character) return '😴';
    if (character.health_status === 'active') return '💪';
    if (character.health_status === 'healthy') return '😊';
    if (character.health_status === 'normal') return '😐';
    return '😴';
  };

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
            <IconButton><NotificationsIcon /></IconButton>
            <Avatar
              src={profile?.avatar_url}
              sx={{ bgcolor: 'primary.main', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              {profile?.display_name?.[0] || 'F'}
            </Avatar>
          </Box>
        </Box>

        {/* 명언 카드 */}
        <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #6BCB77, #5DA9E9)', color: 'white' }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant='body2' sx={{ fontStyle: 'italic', opacity: 0.9 }}>💡 {quote}</Typography>
          </CardContent>
        </Card>

        {/* 캐릭터 + 오늘 운동 현황 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFE082, #A084E8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem',
              }}>
                {characterEmoji()}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h4' sx={{ fontWeight: 600 }}>
                  {character?.character_name || '내 캐릭터'}
                </Typography>
                <Chip
                  label={`Lv.${character?.level || 1}`}
                  size='small'
                  color='primary'
                  sx={{ mr: 0.5 }}
                />
                <Chip label={character?.health_status === 'active' ? '활기참 💪' : '휴식중 😴'} size='small' />
              </Box>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              오늘 운동 달성률 ({todayWorkout?.duration || 0}/{goalMinutes}분)
            </Typography>
            <LinearProgress
              variant='determinate'
              value={progress}
              sx={{ height: 10, borderRadius: 5, bgcolor: '#E8F5E9', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' } }}
            />
          </CardContent>
        </Card>

        {/* 오늘 통계 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#E8F5E9' }}>
              <CardContent sx={{ py: 1.5, px: 1 }}>
                <TimerIcon sx={{ color: '#6BCB77', fontSize: 28 }} />
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
                <LocalFireDepartmentIcon sx={{ color: '#FF7043', fontSize: 28 }} />
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
                <DirectionsWalkIcon sx={{ color: '#5DA9E9', fontSize: 28 }} />
                <Typography variant='h4' sx={{ fontWeight: 700, color: '#5DA9E9' }}>
                  {todayWorkout?.steps?.toLocaleString() || 0}
                </Typography>
                <Typography variant='caption' color='text.secondary'>걸음</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 운동 시작 버튼 */}
        <Button
          variant='contained'
          fullWidth
          size='large'
          startIcon={<FitnessCenterIcon />}
          onClick={() => navigate('/timer')}
          sx={{
            py: 1.8,
            mb: 2,
            fontSize: '1.1rem',
            background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)',
            boxShadow: '0 4px 15px rgba(107,203,119,0.4)',
          }}
        >
          운동 시작하기
        </Button>

        {/* 추천 루틴 */}
        <Typography variant='h4' sx={{ mb: 1.5, fontWeight: 600 }}>오늘의 추천 루틴</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          {ROUTINES.map((r) => (
            <Card key={r.name} sx={{ cursor: 'pointer' }} onClick={() => navigate('/timer')}>
              <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '2rem' }}>{r.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='h4'>{r.name}</Typography>
                  <Typography variant='body2' color='text.secondary'>{r.duration} · {r.level}</Typography>
                </Box>
                <Chip label='시작' size='small' color='primary' />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 게시글 작성 FAB */}
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => navigate('/create')}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            borderRadius: 30,
            background: 'linear-gradient(135deg, #A084E8, #5DA9E9)',
            boxShadow: '0 4px 15px rgba(160,132,232,0.4)',
            zIndex: 100,
          }}
        >
          게시글 작성
        </Button>
      </Box>
    </Layout>
  );
}
