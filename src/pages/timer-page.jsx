import { useState, useEffect, useRef } from 'react';
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
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const WORKOUT_TYPES = ['홈트', '러닝', '헬스', '요가', '필라테스', '수영', '자전거', '등산', '기타'];
const INTENSITIES = [{ value: 'low', label: '낮음', cal: 4 }, { value: 'medium', label: '보통', cal: 7 }, { value: 'high', label: '높음', cal: 10 }];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerPage() {
  const { user } = useAuth();
  const [workoutType, setWorkoutType] = useState('헬스');
  const [intensity, setIntensity] = useState('medium');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [resting, setResting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const intervalRef = useRef(null);
  const restRef = useRef(null);

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
      restRef.current = setInterval(() => setRestSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(restRef.current);
      setRestSeconds(0);
    }
    return () => clearInterval(restRef.current);
  }, [resting]);

  function handleStartStop() {
    if (!running && seconds === 0) setSaved(false);
    setRunning(!running);
    if (resting) setResting(false);
  }

  function handleRest() {
    setRunning(false);
    setResting(!resting);
  }

  async function handleSave() {
    if (!user || seconds === 0) return;
    const minutes = Math.ceil(seconds / 60);
    const cal = Math.round(minutes * (INTENSITIES.find((i) => i.value === intensity)?.cal || 7));

    const { error } = await supabase.from('fitbuddy_workouts').insert({
      user_id: user.id,
      workout_type: workoutType,
      duration_minutes: minutes,
      intensity,
      calories_burned: cal,
      workout_date: new Date().toISOString().split('T')[0],
    });

    if (!error) {
      setSaved(true);
      setRunning(false);
      setSnack({ open: true, msg: `운동 완료! ${minutes}분 ${cal}kcal 기록되었습니다 💪`, severity: 'success' });
    }
  }

  function handleReset() {
    setRunning(false);
    setResting(false);
    setSeconds(0);
    setSaved(false);
  }

  const minutes = Math.floor(seconds / 60);
  const intensity_obj = INTENSITIES.find((i) => i.value === intensity);
  const calories = Math.round(minutes * (intensity_obj?.cal || 7));
  const progress = Math.min((seconds % 60) / 60 * 100, 100);

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>운동 타이머 ⏱️</Typography>

        {/* 운동 설정 */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>운동 종류</InputLabel>
              <Select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} label='운동 종류' disabled={running}>
                {WORKOUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size='small'>
              <InputLabel>강도</InputLabel>
              <Select value={intensity} onChange={(e) => setIntensity(e.target.value)} label='강도' disabled={running}>
                {INTENSITIES.map((i) => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* 메인 타이머 */}
        <Card sx={{ mb: 2, textAlign: 'center' }}>
          <CardContent sx={{ py: 4 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress
                variant='determinate'
                value={progress}
                size={200}
                thickness={3}
                sx={{
                  color: running ? 'primary.main' : resting ? 'secondary.main' : '#e0e0e0',
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                }}
              />
              <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: running ? 'primary.main' : 'text.primary' }}>
                  {formatTime(seconds)}
                </Typography>
                {resting && (
                  <Typography variant='caption' color='secondary.main' sx={{ fontWeight: 600 }}>
                    휴식 {formatTime(restSeconds)}
                  </Typography>
                )}
                <Typography variant='caption' color='text.secondary'>
                  {running ? '운동 중' : resting ? '휴식 중' : '대기 중'}
                </Typography>
              </Box>
            </Box>

            {/* 오늘 칼로리 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Chip icon={<FitnessCenterIcon />} label={`${minutes}분`} color='primary' variant='outlined' />
              <Chip label={`🔥 ${calories} kcal`} color='warning' variant='outlined' />
            </Box>

            {/* 버튼 */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant='contained'
                size='large'
                startIcon={running ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={handleStartStop}
                sx={{
                  px: 3,
                  background: running
                    ? 'linear-gradient(90deg, #FF7043, #FF9800)'
                    : 'linear-gradient(90deg, #6BCB77, #5DA9E9)',
                }}
              >
                {running ? '일시정지' : seconds === 0 ? '시작' : '재개'}
              </Button>
              <Button
                variant='outlined'
                size='large'
                color='secondary'
                onClick={handleRest}
                disabled={seconds === 0}
              >
                {resting ? '운동 재개' : '휴식'}
              </Button>
              <Button
                variant='outlined'
                size='large'
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                disabled={seconds === 0}
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
            disabled={saved}
            sx={{
              py: 1.8,
              background: saved ? '#9E9E9E' : 'linear-gradient(90deg, #A084E8, #5DA9E9)',
              fontSize: '1rem',
            }}
          >
            {saved ? '✅ 운동 기록 완료!' : '운동 완료 및 저장'}
          </Button>
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
