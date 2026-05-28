import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { getLevelFromXP } from '../utils/xp-utils';
import Layout from '../components/common/layout';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';

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

/**
 * 타이머 상태:
 * idle        → 대기 (seconds=0, 미시작)
 * running     → 운동 중
 * paused      → 운동 일시정지 (seconds>0)
 * rest_waiting → 휴식 대기 (resting=true, restRunning=false, currentRestSeconds=0)
 * resting     → 휴식 중 (resting=true, restRunning=true)
 * rest_paused → 휴식 일시정지 (resting=true, restRunning=false, currentRestSeconds>0)
 * completed   → 저장 완료
 */
function getStatus(running, resting, restRunning, saved, seconds, currentRestSeconds) {
  if (saved) return 'completed';
  if (resting && restRunning) return 'resting';
  if (resting && !restRunning && currentRestSeconds > 0) return 'rest_paused';
  if (resting && !restRunning) return 'rest_waiting';
  if (running) return 'running';
  if (seconds > 0) return 'paused';
  return 'idle';
}

export default function TimerPage() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const preset = location.state || {};

  const [workoutType, setWorkoutType] = useState(preset.workoutType || '헬스');
  const [intensity, setIntensity] = useState('medium');

  // 운동 타이머
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  // 휴식 상태 분리: resting=모드 진입, restRunning=실제 타이머 작동
  const [resting, setResting] = useState(false);
  const [restRunning, setRestRunning] = useState(false);
  const [currentRestSeconds, setCurrentRestSeconds] = useState(0);
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const intervalRef = useRef(null);
  const restRef = useRef(null);

  const status = getStatus(running, resting, restRunning, saved, seconds, currentRestSeconds);

  // 운동 타이머
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // 휴식 타이머 - restRunning이 true일 때만 작동
  useEffect(() => {
    if (restRunning) {
      restRef.current = setInterval(() => {
        setCurrentRestSeconds((s) => s + 1);
        setTotalRestSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(restRef.current);
    }
    return () => clearInterval(restRef.current);
  }, [restRunning]);

  // 시작/일시정지/재개 버튼
  // - 운동 모드: 운동 타이머 토글
  // - 휴식 모드: 휴식 타이머 토글
  function handleStartPause() {
    if (saved) return;
    if (resting) {
      setRestRunning((prev) => !prev);
    } else {
      setRunning((prev) => !prev);
    }
  }

  // 휴식 ↔ 운동 전환 버튼
  // - 운동 → 휴식: 운동 정지, 휴식 대기 상태로 진입 (타이머 자동 시작 안 함)
  // - 휴식 → 운동: 휴식 종료, 운동 대기 상태로 복귀 (타이머 자동 시작 안 함)
  function handleRest() {
    if (seconds === 0 || saved) return;
    if (resting) {
      setRestRunning(false);
      setResting(false);
      setCurrentRestSeconds(0);
      setRunning(false); // 재개는 사용자가 직접
    } else {
      setRunning(false);
      setResting(true);
      setRestRunning(false); // 자동 시작 안 함
      setCurrentRestSeconds(0);
    }
  }

  async function handleSave() {
    if (!user || seconds === 0 || saved) return;
    setSaving(true);
    const minutes = Math.ceil(seconds / 60);
    const intensityObj = INTENSITIES.find((i) => i.value === intensity);
    const cal = Math.round(minutes * (intensityObj?.cal || 7));
    const today = new Date().toISOString().split('T')[0];

    const payload = {
      user_id: user.id,
      workout_type: workoutType,
      duration_minutes: minutes,
      intensity,
      calories_burned: cal,
      steps: 0,
      workout_date: today,
      workout_seconds: seconds,
      rest_seconds: totalRestSeconds,
      workout_status: 'completed',
    };

    try {
      const { error } = await supabase.from('fitbuddy_workouts').insert(payload);
      if (error) {
        setSnack({ open: true, msg: '저장 실패: ' + error.message, severity: 'error' });
        return;
      }

      // 캐릭터 XP 업데이트 (새 레벨 기반 규칙)
      // 기본 +5, 10분당 +2XP (10분 미만 +1), 강도 보너스 low+1/medium+3/high+5
      const intensityXpBonus = { low: 1, medium: 3, high: 5 };
      let xpGain = 5;
      if (minutes >= 10) {
        xpGain += Math.floor(minutes / 10) * 2;
      } else {
        xpGain += 1;
      }
      xpGain += intensityXpBonus[intensity] || 3;
      xpGain = Math.min(xpGain, 40);

      const { data: charData } = await supabase
        .from('fitbuddy_characters')
        .select('experience, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (charData) {
        const newXp = (charData.experience || 0) + xpGain;
        const newLevel = getLevelFromXP(newXp);
        await supabase.from('fitbuddy_characters').update({
          experience: newXp,
          level: newLevel,
        }).eq('user_id', user.id);
      }

      setRunning(false);
      setResting(false);
      setRestRunning(false);
      setSaved(true);
      setSnack({
        open: true,
        msg: `운동 기록이 저장되었습니다. ${minutes}분 ${cal}kcal · +${xpGain}XP 💪`,
        severity: 'success',
      });

      setTimeout(() => navigate('/records', { state: { initialTab: 0, saved: true } }), 2000);
    } catch (err) {
      console.error('운동 저장 오류:', err);
      setSnack({ open: true, msg: '저장에 실패했습니다.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setRunning(false);
    setResting(false);
    setRestRunning(false);
    setSeconds(0);
    setCurrentRestSeconds(0);
    setTotalRestSeconds(0);
    setSaved(false);
  }

  const minutes = Math.floor(seconds / 60);
  const intensityObj = INTENSITIES.find((i) => i.value === intensity);
  const calories = Math.round(minutes * (intensityObj?.cal || 7));

  // 원형 진행: 휴식 중에는 현재 휴식 시간, 아니면 운동 시간 기준 (1분 단위 루프)
  const progressVal = (resting ? currentRestSeconds : seconds) % 60;
  const progress = Math.min((progressVal / 60) * 100, 100);

  const statusLabels = {
    idle: '대기 중',
    running: '운동 중 💪',
    paused: '일시정지 ⏸',
    rest_waiting: '휴식 대기 중 😴',
    resting: '휴식 중 😴',
    rest_paused: '휴식 일시정지 ⏸',
    completed: '운동 완료 ✅',
  };

  const statusColors = {
    idle: '#9E9E9E',
    running: '#5FCB77',
    paused: '#FF7043',
    rest_waiting: '#5DA9E9',
    resting: '#5DA9E9',
    rest_paused: '#FF7043',
    completed: '#A084E8',
  };

  const isSettingDisabled = ['running', 'paused', 'resting', 'rest_waiting', 'rest_paused'].includes(status);

  const gender = profile?.gender || 'female';

  const WORKOUT_VARIANT = {
    '러닝': 'running', '자전거': 'running', '수영': 'running',
    '스트레칭': 'stretch', '요가': 'stretch', '필라테스': 'stretch',
    '홈트': 'pushup', '헬스': 'pushup',
    '등산': 'squat',
    '기타': 'workout',
  };

  const charVariant = status === 'running' ? (WORKOUT_VARIANT[workoutType] || 'workout') : undefined;
  const charMood = (() => {
    if (status === 'completed') return 'celebrating';
    if (['resting', 'rest_waiting', 'rest_paused'].includes(status)) return 'idle';
    if (status === 'running') return 'running';
    return 'active';
  })();

  const COACH_MSG = {
    idle: ['준비됐죠? 지금 바로 시작해요! 💪', ''],
    running: {
      '러닝': ['달려라! 뛸수록 강해져요 🏃', ''],
      '스트레칭': ['천천히 숨 쉬며 늘려봐요 🧘', ''],
      '요가': ['집중, 그리고 호흡 🧘', ''],
      '필라테스': ['코어에 힘 주세요! ✨', ''],
      '홈트': ['집에서도 충분해요! 한 번 더 💪', ''],
      '헬스': ['근육이 자라는 소리가 들려요 🏋️', ''],
      '수영': ['힘차게 앞으로! 🏊', ''],
      '자전거': ['바람을 가르는 중 🚴', ''],
      '등산': ['한 걸음씩, 정상까지! 🏔️', ''],
      '기타': ['잘 하고 있어요! 파이팅 🔥', ''],
    },
    paused: ['잠깐 멈췄지만 다시 달릴 수 있어요! 💨', ''],
    rest_waiting: ['휴식 준비! 충전하고 다시 달려요 😴', ''],
    resting: ['충전 중... 다음 세트가 기다려요 😴', ''],
    rest_paused: ['언제든 이어서 쉬어가도 돼요 💨', ''],
    completed: ['오늘도 완주! 정말 대단해요 🏆', ''],
  };

  const coachText = (() => {
    const map = COACH_MSG[status === 'running' ? 'running' : status] || ['파이팅! 💪', ''];
    if (status === 'running' && typeof map === 'object' && !Array.isArray(map)) {
      return map[workoutType] || map['기타'] || ['파이팅! 💪', ''];
    }
    return Array.isArray(map) ? map : ['파이팅! 💪', ''];
  })();

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>운동 타이머 ⏱️</Typography>

        {/* 운동 설정 */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>운동 종류</InputLabel>
              <Select
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                label='운동 종류'
                disabled={isSettingDisabled}
              >
                {WORKOUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size='small'>
              <InputLabel>강도</InputLabel>
              <Select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                label='강도'
                disabled={isSettingDisabled}
              >
                {INTENSITIES.map((i) => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* 캐릭터 코치 */}
        <Card sx={{
          mb: 2,
          background: status === 'completed'
            ? 'linear-gradient(135deg,#FFF9C4,#FFFDE7)'
            : status === 'running'
            ? 'linear-gradient(135deg,#E8F5E9,#F0FFF4)'
            : ['resting','rest_waiting','rest_paused'].includes(status)
            ? 'linear-gradient(135deg,#E3F2FD,#F8FBFF)'
            : 'linear-gradient(135deg,#F3E8FF,#FAF8FF)',
          border: status === 'completed' ? '1.5px solid #FFE082'
            : status === 'running' ? '1.5px solid #A5D6A7'
            : ['resting','rest_waiting','rest_paused'].includes(status) ? '1.5px solid #90CAF9'
            : '1.5px solid #CE93D8',
        }}>
          <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FitBuddyCharacter
              size={90}
              gender={gender}
              mood={charMood}
              variant={charVariant}
            />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#333', lineHeight: 1.5 }}>
                {coachText[0]}
              </Typography>
              {status === 'running' && (
                <Typography variant='caption' sx={{ color: '#888', display: 'block', mt: 0.3 }}>
                  {workoutType} · {intensity === 'high' ? '고강도' : intensity === 'medium' ? '중강도' : '저강도'}
                </Typography>
              )}
            </Box>
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
                alignItems: 'center', justifyContent: 'center', gap: 0.3,
              }}>
                {/* 휴식 모드에서는 현재 휴식 타이머, 아니면 운동 타이머 */}
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: statusColors[status], lineHeight: 1 }}>
                  {resting ? formatTime(currentRestSeconds) : formatTime(seconds)}
                </Typography>

                {resting ? (
                  <>
                    <Typography variant='caption' sx={{ color: '#888', fontSize: '0.7rem' }}>
                      운동 {formatTime(seconds)} 경과
                    </Typography>
                    {totalRestSeconds > 0 && (
                      <Typography variant='caption' sx={{ color: '#5DA9E9', fontWeight: 600, fontSize: '0.7rem' }}>
                        누적 휴식 {formatTime(totalRestSeconds)}
                      </Typography>
                    )}
                  </>
                ) : (
                  totalRestSeconds > 0 && (
                    <Typography variant='caption' sx={{ color: '#5DA9E9', fontWeight: 600, fontSize: '0.7rem' }}>
                      휴식 누적 {formatTime(totalRestSeconds)}
                    </Typography>
                  )
                )}

                <Typography variant='caption' sx={{ color: statusColors[status], fontWeight: 700, fontSize: '0.75rem' }}>
                  {statusLabels[status]}
                </Typography>
              </Box>
            </Box>

            {/* 칩 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              <Chip icon={<FitnessCenterIcon />} label={`${minutes}분`} color='primary' variant='outlined' size='small' />
              <Chip label={`🔥 ${calories} kcal`} color='warning' variant='outlined' size='small' />
              {totalRestSeconds > 0 && (
                <Chip
                  label={`💤 ${formatTime(totalRestSeconds)}`}
                  variant='outlined' size='small'
                  sx={{ color: '#5DA9E9', borderColor: '#5DA9E9' }}
                />
              )}
            </Box>

            {/* 버튼: [시작/일시정지/재개 | 휴식/운동 | 초기화] 항상 3개 */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* 메인 액션 버튼 */}
              <Button
                variant='contained'
                size='large'
                startIcon={['running', 'resting'].includes(status) ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={status === 'idle' ? () => setRunning(true) : handleStartPause}
                disabled={status === 'completed'}
                sx={{
                  px: 3,
                  bgcolor: ['running', 'resting'].includes(status) ? '#FF7043' : '#5FCB77',
                  '&:hover': { bgcolor: ['running', 'resting'].includes(status) ? '#E55C2F' : '#4DBB68' },
                }}
              >
                {status === 'idle' ? '시작'
                  : status === 'running' ? '일시정지'
                  : status === 'resting' ? '일시정지'
                  : status === 'rest_waiting' ? '시작'
                  : '재개'}
              </Button>

              {/* 휴식 ↔ 운동 전환 */}
              <Button
                variant='outlined'
                size='large'
                startIcon={resting ? <FitnessCenterIcon /> : <HotelIcon />}
                onClick={handleRest}
                disabled={seconds === 0 || status === 'completed'}
                sx={{
                  borderColor: resting ? '#5FCB77' : '#5DA9E9',
                  color: resting ? '#5FCB77' : '#5DA9E9',
                  '&:hover': { bgcolor: resting ? '#F0FFF4' : '#E3F2FD' },
                }}
              >
                {resting ? '운동' : '휴식'}
              </Button>

              {/* 초기화 */}
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

        {/* 완료 저장 버튼 */}
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
              '&:disabled': { bgcolor: '#E0E0E0', color: '#9E9E9E' },
              fontSize: '1rem',
            }}
          >
            {saving ? '저장 중...' : saved ? '✅ 기록관으로 이동 중...' : '운동 완료 및 저장'}
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
        autoHideDuration={3500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
      </Snackbar>
    </Layout>
  );
}
