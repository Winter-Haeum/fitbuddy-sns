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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import { useAuth } from '../hooks/use-auth';

const QUOTES = [
  { emoji: '💪', text: '오늘 움직인 만큼 내 몸은 달라진다.' },
  { emoji: '🔥', text: '오늘의 움직임이 내일의 변화를 만든다.' },
  { emoji: '🌱', text: '작은 움직임이 건강한 변화를 만든다.' },
  { emoji: '✨', text: '포기하지 않는 사람이 결국 변한다.' },
  { emoji: '🏃', text: '오늘 걷지 않으면 내일 뛰어야 한다.' },
];

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#FAFAFA',
    '& fieldset': { borderColor: '#E0E0E0' },
    '&:hover fieldset': { borderColor: '#6BCB77' },
    '&.Mui-focused fieldset': { borderColor: '#6BCB77', borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#388E3C' },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('fitbuddy_email') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('fitbuddy_email'));
  const [autoLogin, setAutoLogin] = useState(() => localStorage.getItem('fitbuddy_autoLogin') === '1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      if (rememberEmail) {
        localStorage.setItem('fitbuddy_email', email);
      } else {
        localStorage.removeItem('fitbuddy_email');
      }
      if (autoLogin) {
        localStorage.setItem('fitbuddy_autoLogin', '1');
      } else {
        localStorage.removeItem('fitbuddy_autoLogin');
      }
      navigate('/');
    } catch (err) {
      if (err.code === 'ACCOUNT_DELETED') {
        setError(err.message);
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #DCF0E3 0%, #F7FAF8 40%, #F7FAF8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* 로고 영역 */}
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Box sx={{ mb: 1.5 }}>
          <FitBuddyCharacter size={72} />
        </Box>
        <Typography
          variant='h2'
          sx={{ color: '#1B5E20', fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.5px', lineHeight: 1 }}
        >
          FitBuddy
        </Typography>
        <Typography variant='body2' sx={{ color: '#66BB6A', mt: 0.5, fontWeight: 500, letterSpacing: '0.04em' }}>
          운동 기록 · 성장 · 커뮤니티
        </Typography>
      </Box>

      {/* 명언 카드 */}
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          mb: 2,
          bgcolor: 'white',
          border: '1.5px solid #C8E6C9',
          boxShadow: '0 4px 18px rgba(107, 203, 119, 0.18)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ py: 2, px: 3, textAlign: 'center', '&:last-child': { pb: 2 } }}>
          <Typography sx={{ fontSize: '0.98rem', fontWeight: 600, color: '#2E7D32', lineHeight: 1.65 }}>
            {quote.emoji}&nbsp; {quote.text}
          </Typography>
        </CardContent>
      </Card>

      {/* 로그인 카드 */}
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid #E8F5E9',
        }}
      >
        <CardContent sx={{ p: 3.5, '&:last-child': { pb: 3.5 } }}>
          <Typography
            variant='h3'
            sx={{ mb: 3, textAlign: 'center', color: '#1A1A1A', fontWeight: 700, fontSize: '1.4rem' }}
          >
            로그인
          </Typography>

          {error && <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component='form' onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label='이메일'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              sx={inputSx}
            />
            <TextField
              label='비밀번호'
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={() => setShowPw(!showPw)} edge='end' size='small'>
                      {showPw ? <VisibilityOff fontSize='small' /> : <Visibility fontSize='small' />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    size='small'
                    sx={{ color: '#6BCB77', '&.Mui-checked': { color: '#6BCB77' } }}
                  />
                }
                label={<Typography variant='body2' sx={{ color: '#757575', fontSize: '0.85rem' }}>이메일 기억하기</Typography>}
                sx={{ mt: -0.5 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                    size='small'
                    sx={{ color: '#6BCB77', '&.Mui-checked': { color: '#6BCB77' } }}
                  />
                }
                label={<Typography variant='body2' sx={{ color: '#757575', fontSize: '0.85rem' }}>자동 로그인</Typography>}
                sx={{ mt: -0.5 }}
              />
            </Box>
            <Button
              type='submit'
              variant='contained'
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 0.5,
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: '#6BCB77',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(107, 203, 119, 0.45)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#5ABB67',
                  boxShadow: '0 6px 18px rgba(107, 203, 119, 0.55)',
                },
                '&:disabled': { bgcolor: '#A5D6A7', boxShadow: 'none' },
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Typography variant='body2' sx={{ color: '#9E9E9E' }}>
              계정이 없으신가요?{' '}
              <Link to='/register' style={{ color: '#6BCB77', fontWeight: 700, textDecoration: 'none' }}>
                회원가입
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
