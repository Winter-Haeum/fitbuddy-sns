import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HotelIcon from '@mui/icons-material/Hotel';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const WORKOUT_TYPES = ['홈트', '스트레칭', '러닝', '헬스', '요가', '필라테스', '수영', '자전거', '등산', '기타'];
const INTENSITIES = [
  { value: 'low', label: '낮음', cal: 4 },
  { value: 'medium', label: '보통', cal: 7 },
  { value: 'high', label: '높음', cal: 10 },
];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 타이머 상태: idle | running | paused | resting | completed
function getTimerStatus(running, resting, saved, seconds) {
  if (saved) return 'completed';
  if (resting) return 'resting';
  if (running) return 'running';
  if (seconds > 0) return 'paused';
  return 'idle';
}

export default function TimerPage() {
  const { user } = useAuth();
  const location = useLocation();
  const preset = location.state || {};

  const [workoutType, setWorkoutType] = useState(preset.workoutType || '헬스');
  const [intensity, setIntensity] = useState('medium');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [currentRestSeconds, setCurrentRestSeconds] = useState(0);
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);
  const [resting, setResting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const intervalRef = useRef(null);
  const restRef = useRef(null);

  const status = getTimerStatus(running, resting, saved, seconds);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (resting) {
      restRef.current = setInterval(() => {
        setCurrentRestSeconds((s) => s + 1);
        setTotalRestSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(restRef.current);
      setCurrentRestSeconds(0);
    }
    return () => clearInterval(restRef.current);
  }, [resting]);

  function handleStartPause() {
    if (saved) return;
    if (status === 'idle') setSaved(false);
    if (resting) {
      setResting(false);
      setRunning(true);
    } else {
      setRunning((prev) => !prev);
    }
  }

  function handleRest() {
    if (seconds === 0 || saved) return;
    if (resting) {
      setResting(false);
      setRunning(true);
    } else {
      setRunning(false);
      setResting(true);
    }
  }

  async function handleSave() {
    if (!user || seconds === 0 || saved) return;
    setSaving(true);
    const minutes = Math.ceil(seconds / 60);
    const cal = Math.round(minutes * (INTENSITIES.find((i) => i.value === intensity)?.cal || 7));

    const payload = {
      user_id: user.id,
      workout_type: workoutType,
      duration_minutes: minutes,
      intensity,
      calories_burned: cal,
      workout_date: new Date().toISOString().split('T')[0],
      workout_seconds: seconds,
      rest_seconds: totalRestSeconds,
      workout_status: 'completed',
    };
    console.log('SAVE START:', payload);

    try {
      const { error } = await supabase
        .from('fitbuddy_workouts')
        .insert(payload);
      console.log('INSERT ERROR:', error);
      if (error) {
        console.error('SUPABASE ERROR:', error);
        alert('운동 저장 실패: ' + error.message);
        setSnack({ open: true, msg: '저장 실패: ' + error.message, severity: 'error' });
        return;
      }
      console.log('운동 저장 성공');

      // 캐릭터 XP/포인트 업데이트
      const xpGain = minutes;
      const pointsGain = intensity === 'high' ? 15 : intensity === 'medium' ? 10 : 5;
      const { data: charData } = await supabase
        .from('fitbuddy_characters')
        .select('experience, points, growth_stage, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (charData) {
        const newXp = (charData.experience || 0) + xpGain;
        const newPoints = (charData.points || 0) + pointsGain;
        const XP_STAGES = [0, 100, 300, 700, 1500];
        let newStage = charData.growth_stage || 1;
        for (let i = XP_STAGES.length - 1; i >= 0; i--) {
          if (newXp >= XP_STAGES[i]) { newStage = i + 1; break; }
        }
        const newLevel = Math.floor(newXp / 50) + 1;

        const { error: charErr } = await supabase.from('fitbuddy_characters').update({
          experience: newXp,
          points: newPoints,
          growth_stage: Math.min(newStage, 5),
          level: Math.min(newLevel, 99),
        }).eq('user_id', user.id);
        if (charErr) console.error('SUPABASE ERROR (character):', charErr);
      }

      setRunning(false);
      setResting(false);
      setSaved(true);
      setSnack({ open: true, msg: `운동 완료! ${minutes}분 ${cal}kcal · +${xpGain}XP +${pointsGain}pt 💪`, severity: 'success' });
    } catch (err) {
      console.error('예상 못한 오류:', err);
      alert('오류: ' + err.message);
      setSnack({ open: true, msg: '저장에 실패했습니다.', severity: 'error' });
    } finally {
      console.log('SAVE FINALLY');
      setSaving(false);
    }
  }

  function handleReset() {
    setRunning(false);
    setResting(false);
    setSeconds(0);
    setCurrentRestSeconds(0);
    setTotalRestSeconds(0);
    setSaved(false);
  }

  const minutes = Math.floor(seconds / 60);
  const intensity_obj = INTENSITIES.find((i) => i.value === intensity);
  const calories = Math.round(minutes * (intensity_obj?.cal || 7));
  const progress = Math.min((seconds % 60) / 60 * 100, 100);

  const statusLabels = {
    idle: '대기 중',
    running: '운동 중 💪',
    paused: '일시정지',
    resting: '휴식 중 😴',
    completed: '운동 완료 ✅',
  };

  const statusColors = {
    idle: '#9E9E9E',
    running: '#5FCB77',
    paused: '#FF7043',
    resting: '#5DA9E9',
    completed: '#A084E8',
  };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>운동 타이머 ⏱️</Typography>

        {/* 운동 설정 */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>운동 종류</InputLabel>
              <Select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} label='운동 종류' disabled={status === 'running' || status === 'paused'}>
                {WORKOUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size='small'>
              <InputLabel>강도</InputLabel>
              <Select value={intensity} onChange={(e) => setIntensity(e.target.value)} label='강도' disabled={status === 'running' || status === 'paused'}>
                {INTENSITIES.map((i) => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* 메인 타이머 */}
        <Card sx={{ mb: 2, textAlign: 'center' }}>
          <CardContent sx={{ py: 4 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <CircularProgress
                variant='determinate'
                value={progress}
                size={200}
                thickness={3}
                sx={{
                  color: statusColors[status],
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                }}
              />
              <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: statusColors[status] }}>
                  {formatTime(seconds)}
                </Typography>
                {resting && (
                  <Typography variant='caption' sx={{ color: '#5DA9E9', fontWeight: 600 }}>
                    현재 휴식 {formatTime(currentRestSeconds)}
                  </Typography>
                )}
                <Typography variant='caption' sx={{ color: statusColors[status], fontWeight: 600 }}>
                  {statusLabels[status]}
                </Typography>
              </Box>
            </Box>

            {/* 칼로리 + 휴식시간 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Chip icon={<FitnessCenterIcon />} label={`${minutes}분`} color='primary' variant='outlined' />
              <Chip label={`🔥 ${calories} kcal`} color='warning' variant='outlined' />
              {totalRestSeconds > 0 && (
                <Chip label={`💤 휴식 ${formatTime(totalRestSeconds)}`} variant='outlined' sx={{ color: '#5DA9E9', borderColor: '#5DA9E9' }} />
              )}
            </Box>

            {/* 버튼 */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant='contained'
                size='large'
                startIcon={status === 'running' ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={handleStartPause}
                disabled={status === 'completed'}
                sx={{
                  px: 3,
                  bgcolor: status === 'running' ? '#FF7043' : '#5FCB77',
                  '&:hover': { bgcolor: status === 'running' ? '#E55C2F' : '#4DBB68' },
                  '&:disabled': { bgcolor: '#9E9E9E' },
                }}
              >
                {status === 'idle' ? '시작' : status === 'running' ? '일시정지' : status === 'paused' ? '재개' : status === 'resting' ? '운동 재개' : '완료됨'}
              </Button>
              <Button
                variant='outlined'
                size='large'
                startIcon={<HotelIcon />}
                onClick={handleRest}
                disabled={seconds === 0 || status === 'completed'}
                sx={{ borderColor: '#5DA9E9', color: '#5DA9E9' }}
              >
                {resting ? '운동 재개' : '휴식'}
              </Button>
              <Button
                variant='outlined'
                size='large'
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                disabled={seconds === 0 && !saved}
              >
                초기화
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 완료 저장 */}
        {seconds > 0 && (
          <Button
            variant='contained'
            fullWidth
            size='large'
            startIcon={<StopIcon />}
            onClick={handleSave}
            disabled={saved || saving}
            sx={{
              py: 1.8,
              bgcolor: saved ? '#9E9E9E' : '#A084E8',
              '&:hover': { bgcolor: saved ? '#9E9E9E' : '#8B6FD4' },
              '&:disabled': { bgcolor: '#9E9E9E', color: 'white' },
              fontSize: '1rem',
            }}
          >
            {saving ? '저장 중...' : saved ? '✅ 운동 기록 완료!' : '운동 완료 및 저장'}
          </Button>
        )}

        {/* 프리셋 안내 */}
        {preset.workoutType && (
          <Card sx={{ mt: 2, bgcolor: '#F3EEFF', border: '1px solid #D1B8FF' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant='body2' sx={{ color: '#6B4FC8', fontWeight: 600 }}>
                💡 추천 루틴: {preset.workoutType} ({preset.level}) · {preset.duration}분
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
      </Snackbar>
    </Layout>
  );
}
