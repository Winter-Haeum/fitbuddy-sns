import { useEffect } from 'react';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '../hooks/use-auth';
import { useTimer, WORKOUT_TYPES, INTENSITIES, formatTime } from '../hooks/use-timer';
import { useStepCounter } from '../hooks/use-step-counter';
import Layout from '../components/common/layout';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';

const STATUS_LABELS = {
  idle: '대기 중',
  running: '운동 중 💪',
  paused: '일시정지 ⏸',
  rest_waiting: '휴식 대기 중 😴',
  resting: '휴식 중 😴',
  rest_paused: '휴식 일시정지 ⏸',
  completed: '운동 완료 ✅',
};

const STATUS_COLORS = {
  idle: '#9E9E9E',
  running: '#5FCB77',
  paused: '#FF7043',
  rest_waiting: '#5DA9E9',
  resting: '#5DA9E9',
  rest_paused: '#FF7043',
  completed: '#A084E8',
};

const COACH_MSG = {
  idle: '준비됐죠? 지금 바로 시작해요! 💪',
  paused: '잠깐 멈췄지만 다시 달릴 수 있어요! 💨',
  rest_waiting: '휴식 준비! 충전하고 다시 달려요 😴',
  resting: '충전 중... 다음 세트가 기다려요 😴',
  rest_paused: '언제든 이어서 쉬어가도 돼요 💨',
  completed: '오늘도 완주! 정말 대단해요 🏆',
  running: {
    '헬스': '오늘도 한 세트 더! 근육은 배신하지 않는다 🏋️',
    '스트레칭': '천천히 숨 쉬며 몸을 늘려봐요 🧘',
    '러닝': '한 걸음씩 목표에 가까워지고 있어 🏃',
    '홈트': '집에서도 충분해요! 한 번 더 💪',
    '요가': '몸과 마음의 균형을 찾아보자 🧘',
    '필라테스': '작은 움직임이 큰 변화를 만든다 ✨',
    '수영': '물살을 가르며 목표를 향해! 🏊',
    '자전거': '페달을 밟을수록 성장한다 🚴',
    '등산': '천천히 가도 정상은 가까워진다 🏔️',
    '기타': '잘 하고 있어요! 파이팅 🔥',
  },
};

export default function TimerPage() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const preset = location.state || {};

  const {
    workoutType, setWorkoutType,
    intensity, setIntensity,
    seconds, resting,
    currentRestSeconds, totalRestSeconds,
    saved, saving, snack, setSnack,
    status,
    handleStartPause, handleRest, handleReset, handleSave,
  } = useTimer();

  // 만보기
  const isRunning = status === 'running';
  const {
    steps,
    isSupported: isStepSupported,
    permissionState,
    requestPermission,
    resetSteps,
  } = useStepCounter(isRunning);

  // 초기화 시 걸음 수도 리셋
  const wrappedReset = () => {
    handleReset();
    resetSteps();
  };

  // 홈에서 추천 루틴으로 진입 시 idle 상태일 때만 워크아웃 타입 설정
  useEffect(() => {
    if (preset.workoutType && status === 'idle') {
      setWorkoutType(preset.workoutType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(seconds / 60);
  const intensityObj = INTENSITIES.find((i) => i.value === intensity);
  const calories = Math.round(minutes * (intensityObj?.cal || 7));

  const progressVal = (resting ? currentRestSeconds : seconds) % 60;
  const progress = Math.min((progressVal / 60) * 100, 100);

  const isSettingDisabled = ['running', 'paused', 'resting', 'rest_waiting', 'rest_paused'].includes(status);
  const gender = profile?.gender || 'female';

  // 운동 중일 때 운동 종류별 이미지, 아닐 때 mood 이미지
  const charWorkoutType = status === 'running' ? workoutType : undefined;
  const charMood = (() => {
    if (status === 'completed') return 'celebrating';
    if (['resting', 'rest_waiting', 'rest_paused'].includes(status)) return 'idle';
    if (status === 'running') return 'running';
    return 'active';
  })();

  const coachText = (() => {
    if (status === 'running') {
      return COACH_MSG.running[workoutType] || COACH_MSG.running['기타'];
    }
    return COACH_MSG[status] || '파이팅! 💪';
  })();

  const cardBg = (() => {
    if (status === 'completed') return 'linear-gradient(135deg,#FFF9C4,#FFFDE7)';
    if (status === 'running') return 'linear-gradient(135deg,#E8F5E9,#F0FFF4)';
    if (['resting', 'rest_waiting', 'rest_paused'].includes(status)) return 'linear-gradient(135deg,#E3F2FD,#F8FBFF)';
    return 'linear-gradient(135deg,#F3E8FF,#FAF8FF)';
  })();

  const cardBorder = (() => {
    if (status === 'completed') return '1.5px solid #FFE082';
    if (status === 'running') return '1.5px solid #A5D6A7';
    if (['resting', 'rest_waiting', 'rest_paused'].includes(status)) return '1.5px solid #90CAF9';
    return '1.5px solid #CE93D8';
  })();

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} size='small' sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='h2' sx={{ fontWeight: 700, flex: 1, textAlign: 'center' }}>운동 타이머 ⏱️</Typography>
          {/* 레이아웃 균형을 위한 빈 공간 */}
          <Box sx={{ width: 34 }} />
        </Box>

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
        <Card sx={{ mb: 2, background: cardBg, border: cardBorder }}>
          <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FitBuddyCharacter
              size={90}
              gender={gender}
              mood={charMood}
              workoutType={charWorkoutType}
              clickable
            />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#333', lineHeight: 1.5 }}>
                {coachText}
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
                  color: STATUS_COLORS[status],
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                }}
              />
              <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 0.3,
              }}>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: STATUS_COLORS[status], lineHeight: 1 }}>
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

                <Typography variant='caption' sx={{ color: STATUS_COLORS[status], fontWeight: 700, fontSize: '0.75rem' }}>
                  {STATUS_LABELS[status]}
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

            {/* 버튼: 항상 3개 [시작/일시정지/재개 | 휴식/운동 | 초기화] */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant='contained'
                size='large'
                startIcon={['running', 'resting'].includes(status) ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={status === 'idle' ? () => handleStartPause() : handleStartPause}
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

              <Button
                variant='outlined'
                size='large'
                startIcon={<RestartAltIcon />}
                onClick={wrappedReset}
                disabled={seconds === 0 && !saved}
              >
                초기화
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 만보기 카드 — 가속도계 지원 기기에서만 표시 */}
        {isStepSupported && (
          <Card sx={{ mb: 2, border: '1px solid #E3F2FD', bgcolor: steps > 0 ? '#F0F8FF' : 'white' }}>
            <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 2,
                bgcolor: '#E3F2FD',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <DirectionsWalkIcon sx={{ color: '#5DA9E9', fontSize: 26 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                  만보기
                  {permissionState === 'not-required' && (
                    <Typography component='span' variant='caption' sx={{ ml: 0.8, color: '#4CAF50' }}>● 측정 중</Typography>
                  )}
                  {permissionState === 'granted' && (
                    <Typography component='span' variant='caption' sx={{ ml: 0.8, color: '#4CAF50' }}>● 측정 중</Typography>
                  )}
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 700, color: '#1565C0' }}>
                  {steps.toLocaleString()} <Typography component='span' variant='body2' color='text.secondary'>걸음</Typography>
                </Typography>
                {permissionState === 'unknown' || permissionState === 'denied' ? (
                  <Typography variant='caption' color='text.secondary'>
                    {permissionState === 'denied' ? '권한이 거부됐습니다' : '허용 후 측정됩니다'}
                  </Typography>
                ) : (
                  <Typography variant='caption' color='text.secondary'>
                    {isRunning ? '운동 중 측정 중...' : '운동 시작 시 측정됩니다'}
                  </Typography>
                )}
              </Box>
              {(permissionState === 'unknown') && (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={requestPermission}
                  sx={{ borderColor: '#5DA9E9', color: '#5DA9E9', flexShrink: 0 }}
                >
                  허용
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* 완료 저장 버튼 */}
        {seconds > 0 && (
          <Button
            variant='contained'
            fullWidth
            size='large'
            startIcon={<StopIcon />}
            onClick={() => handleSave(() => {
              setTimeout(() => navigate('/records', { state: { initialTab: 0, saved: true } }), 2000);
            }, steps)}
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
