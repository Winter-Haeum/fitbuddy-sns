import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import SaveIcon from '@mui/icons-material/Save';
import { useTimer, formatTime } from '../../hooks/use-timer';

const WORKOUT_EMOJI = {
  '헬스': '🏋️', '스트레칭': '🧘', '러닝': '🏃', '홈트': '💪',
  '요가': '🧘', '필라테스': '✨', '수영': '🏊', '자전거': '🚴', '등산': '🏔️', '기타': '🔥',
};

/**
 * TimerMiniPlayer - 타이머 실행 중 다른 페이지 이동 시 하단 플로팅 미니플레이어
 */
export default function TimerMiniPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isActive, status, workoutType, seconds,
    resting, currentRestSeconds, handleStartPause, handleSave,
  } = useTimer();

  if (!isActive || location.pathname === '/timer') return null;

  const isRunning = ['running', 'resting'].includes(status);
  const isRestMode = ['rest_waiting', 'resting', 'rest_paused'].includes(status);
  const displaySeconds = resting ? currentRestSeconds : seconds;
  const emoji = WORKOUT_EMOJI[workoutType] || '🔥';

  return (
    <Card
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        width: { xs: 'calc(100% - 32px)', sm: 360 },
        maxWidth: 400,
        zIndex: 1200,
        borderRadius: 3,
        background: isRestMode
          ? 'linear-gradient(135deg,#E3F2FD,#BBDEFB)'
          : 'linear-gradient(135deg,#E8F5E9,#C8E6C9)',
        border: isRestMode ? '1.5px solid #90CAF9' : '1.5px solid #A5D6A7',
      }}
    >
      <Box sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{emoji}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: isRestMode ? '#1565C0' : '#2E7D32', lineHeight: 1.3 }}>
            {isRestMode ? `휴식 중 · ${workoutType}` : `운동 중 · ${workoutType}`}
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.15rem', color: isRestMode ? '#0D47A1' : '#1B5E20', lineHeight: 1.2 }}>
            {formatTime(displaySeconds)}
          </Typography>
        </Box>
        <IconButton
          size='small'
          onClick={handleStartPause}
          sx={{
            color: isRunning ? '#FF7043' : '#5FCB77',
            bgcolor: 'rgba(255,255,255,0.75)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
          }}
        >
          {isRunning ? <PauseIcon fontSize='small' /> : <PlayArrowIcon fontSize='small' />}
        </IconButton>
        <IconButton
          size='small'
          onClick={() => handleSave(() => {
            setTimeout(() => navigate('/records', { state: { initialTab: 0, saved: true } }), 2000);
          })}
          sx={{
            color: '#A084E8',
            bgcolor: 'rgba(255,255,255,0.75)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
          }}
        >
          <SaveIcon fontSize='small' />
        </IconButton>
        <IconButton
          size='small'
          onClick={() => navigate('/timer')}
          sx={{
            color: '#5DA9E9',
            bgcolor: 'rgba(255,255,255,0.75)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
          }}
        >
          <OpenInFullIcon fontSize='small' />
        </IconButton>
      </Box>
    </Card>
  );
}
