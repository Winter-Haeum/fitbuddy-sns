import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useAuth } from '../hooks/use-auth';

const WORKOUT_GOALS = ['다이어트', '근력 증가', '건강 관리', '습관 만들기'];
const INTERESTS = ['홈트', '러닝', '헬스', '요가', '필라테스', '수영', '자전거', '등산'];
const STEPS = ['기본 정보', '신체 정보', '운동 목표'];

function getPasswordStrength(pw) {
  if (pw.length === 0) return 0;
  if (pw.length < 6) return 25;
  if (pw.length < 10) return 50;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 100;
  return 75;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', confirmPw: '',
    displayName: '', height: '', weight: '', goalWeight: '',
    workoutGoal: '', interests: [],
  });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(item) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(item)
        ? prev.interests.filter((i) => i !== item)
        : [...prev.interests, item],
    }));
  }

  function nextStep() {
    if (step === 0) {
      if (!form.email || !form.password) { setError('이메일과 비밀번호를 입력하세요.'); return; }
      if (form.password !== form.confirmPw) { setError('비밀번호가 일치하지 않습니다.'); return; }
      if (!form.displayName) { setError('닉네임을 입력하세요.'); return; }
    }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      await signUp(form.email, form.password, form.displayName);
      navigate('/');
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = getPasswordStrength(form.password);
  const pwColor = pwStrength < 50 ? 'error' : pwStrength < 75 ? 'warning' : 'success';

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
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
          <FitnessCenterIcon sx={{ fontSize: 32, color: '#6BCB77' }} />
        </Box>
        <Typography variant='h2' sx={{ color: 'white', fontWeight: 700 }}>FitBuddy 가입</Typography>
      </Box>

      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

          {/* Step 0: 기본 정보 */}
          {step === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label='닉네임' value={form.displayName} onChange={(e) => update('displayName', e.target.value)} fullWidth />
              <TextField label='이메일' type='email' value={form.email} onChange={(e) => update('email', e.target.value)} fullWidth />
              <TextField label='비밀번호' type='password' value={form.password} onChange={(e) => update('password', e.target.value)} fullWidth />
              {form.password && (
                <Box>
                  <LinearProgress variant='determinate' value={pwStrength} color={pwColor} sx={{ borderRadius: 4, height: 6 }} />
                  <Typography variant='caption' color={`${pwColor}.main`}>
                    {pwStrength < 50 ? '약함' : pwStrength < 75 ? '보통' : '강함'}
                  </Typography>
                </Box>
              )}
              <TextField
                label='비밀번호 확인'
                type='password'
                value={form.confirmPw}
                onChange={(e) => update('confirmPw', e.target.value)}
                fullWidth
                error={form.confirmPw !== '' && form.password !== form.confirmPw}
                helperText={form.confirmPw !== '' && form.password !== form.confirmPw ? '비밀번호가 일치하지 않습니다' : form.confirmPw ? '✓ 일치합니다' : ''}
              />
              <Button variant='contained' fullWidth onClick={nextStep} sx={{ background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }}>다음</Button>
            </Box>
          )}

          {/* Step 1: 신체 정보 */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label='키 (cm)' type='number' value={form.height} onChange={(e) => update('height', e.target.value)} fullWidth />
              <TextField label='현재 몸무게 (kg)' type='number' value={form.weight} onChange={(e) => update('weight', e.target.value)} fullWidth />
              <TextField label='목표 몸무게 (kg)' type='number' value={form.goalWeight} onChange={(e) => update('goalWeight', e.target.value)} fullWidth />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant='outlined' fullWidth onClick={() => setStep(0)}>이전</Button>
                <Button variant='contained' fullWidth onClick={nextStep} sx={{ background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }}>다음</Button>
              </Box>
            </Box>
          )}

          {/* Step 2: 운동 목표 */}
          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant='body2' color='text.secondary'>운동 목표 선택</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {WORKOUT_GOALS.map((g) => (
                  <Chip
                    key={g}
                    label={g}
                    onClick={() => update('workoutGoal', g)}
                    color={form.workoutGoal === g ? 'primary' : 'default'}
                    variant={form.workoutGoal === g ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              <Typography variant='body2' color='text.secondary'>관심 운동 선택 (복수)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {INTERESTS.map((i) => (
                  <Chip
                    key={i}
                    label={i}
                    onClick={() => toggleInterest(i)}
                    color={form.interests.includes(i) ? 'secondary' : 'default'}
                    variant={form.interests.includes(i) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant='outlined' fullWidth onClick={() => setStep(1)}>이전</Button>
                <Button
                  variant='contained'
                  fullWidth
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }}
                >
                  {loading ? '가입 중...' : '🎉 시작하기'}
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              이미 계정이 있으신가요?{' '}
              <Link to='/login' style={{ color: '#6BCB77', fontWeight: 600, textDecoration: 'none' }}>로그인</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
