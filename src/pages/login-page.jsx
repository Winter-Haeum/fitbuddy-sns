import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useAuth } from '../hooks/use-auth';

const QUOTES = [
  '오늘의 땀이 내일의 자신감을 만든다.',
  '작은 운동도 쌓이면 큰 변화가 된다.',
  '포기하지 않는 사람이 결국 변한다.',
  '오늘 움직인 만큼 내 몸은 달라진다.',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6BCB77 0%, #5DA9E9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* 로고 영역 */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <FitnessCenterIcon sx={{ fontSize: 40, color: '#6BCB77' }} />
        </Box>
        <Typography variant='h2' sx={{ color: 'white', fontWeight: 700, fontSize: '1.8rem' }}>
          FitBuddy
        </Typography>
        <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
          운동 기록 + 성장 + 커뮤니티
        </Typography>
      </Box>

      {/* 명언 카드 */}
      <Card sx={{ maxWidth: 400, width: '100%', mb: 2, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
        <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
          <Typography variant='body2' sx={{ color: 'white', fontStyle: 'italic' }}>
            💪 {quote}
          </Typography>
        </CardContent>
      </Card>

      {/* 로그인 카드 */}
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant='h3' sx={{ mb: 2.5, textAlign: 'center', color: 'text.primary' }}>
            로그인
          </Typography>

          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

          <Box component='form' onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label='이메일'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size='medium'
            />
            <TextField
              label='비밀번호'
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={() => setShowPw(!showPw)} edge='end'>
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type='submit'
              variant='contained'
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              계정이 없으신가요?{' '}
              <Link to='/register' style={{ color: '#6BCB77', fontWeight: 600, textDecoration: 'none' }}>
                회원가입
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
