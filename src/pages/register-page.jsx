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
import LinearProgress from '@mui/material/LinearProgress';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import CharacterStylePicker from '../components/ui/character-style-picker';
import { useAuth } from '../hooks/use-auth';
import { WORKOUT_TYPES } from '../constants/workout';

const WORKOUT_GOALS = ['다이어트', '근력 증가', '건강 관리', '습관 만들기'];
// 관심 운동 선택지 — 운동 종류(WORKOUT_TYPES)와 같은 10종 도메인이라 별도 배열을 두지 않고
// 공통 상수를 그대로 참조한다(기존엔 8종으로 스트레칭/줄넘기가 빠져 있었다).
const INTERESTS = WORKOUT_TYPES;
const STEPS = ['기본 정보', '신체 정보', '운동 목표'];

function getPasswordStrength(pw) {
  if (pw.length === 0) return 0;
  if (pw.length < 6) return 25;
  if (pw.length < 10) return 50;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 100;
  return 75;
}

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

/**
 * SelectPill - 다중 선택 가능한 pill 버튼
 *
 * Props:
 * @param {string} label - 표시할 텍스트 [Required]
 * @param {boolean} isSelected - 선택 여부 [Required]
 * @param {function} onClick - 클릭 핸들러 [Required]
 *
 * Example usage:
 * <SelectPill label="러닝" isSelected={true} onClick={() => toggle('러닝')} />
 */
function SelectPill({ label, isSelected, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 0.8,
        borderRadius: '999px',
        border: `2px solid ${isSelected ? '#6BCB77' : '#E0E0E0'}`,
        bgcolor: isSelected ? '#E8F5E9' : '#FAFAFA',
        color: isSelected ? '#2E7D32' : '#757575',
        fontWeight: isSelected ? 700 : 400,
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        '&:hover': {
          borderColor: '#6BCB77',
          bgcolor: isSelected ? '#C8E6C9' : '#F1F8E9',
          color: isSelected ? '#1B5E20' : '#388E3C',
        },
      }}
    >
      {label}
    </Box>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', confirmPw: '',
    realName: '', displayName: '', gender: '', height: '', weight: '', goalWeight: '',
    workoutGoals: [], interests: [],
    // 아무것도 고르지 않아도 DB DEFAULT와 같은 semi/1로 가입되도록 기본값을 미리 채워둔다.
    characterStyle: 'semi', characterVariant: 1,
  });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGoal(item) {
    setForm((prev) => ({
      ...prev,
      workoutGoals: prev.workoutGoals.includes(item)
        ? prev.workoutGoals.filter((g) => g !== item)
        : [...prev.workoutGoals, item],
    }));
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
      if (!form.realName) { setError('이름을 입력하세요.'); return; }
      if (!form.displayName) { setError('닉네임을 입력하세요.'); return; }
    }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      await signUp(form.email, form.password, form.displayName, {
        realName: form.realName,
        height: form.height,
        weight: form.weight,
        goalWeight: form.goalWeight,
        workoutGoals: form.workoutGoals,
        interests: form.interests,
        gender: form.gender,
        characterStyle: form.characterStyle,
        characterVariant: form.characterVariant,
      });
      // 회원가입 완료 → 로그인 페이지로 이동 (수동 로그인)
      navigate('/login');
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = getPasswordStrength(form.password);
  const pwColor = pwStrength < 50 ? 'error' : pwStrength < 75 ? 'warning' : 'success';

  const primaryBtnSx = {
    py: 1.4,
    bgcolor: '#6BCB77',
    borderRadius: 2,
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': { bgcolor: '#5ABB67', boxShadow: '0 6px 18px rgba(107, 203, 119, 0.45)' },
    '&:disabled': { bgcolor: '#A5D6A7', boxShadow: 'none' },
  };

  const outlinedBtnSx = {
    py: 1.4,
    borderRadius: 2,
    fontWeight: 600,
    fontSize: '1rem',
    textTransform: 'none',
    borderColor: '#6BCB77',
    color: '#388E3C',
    '&:hover': { borderColor: '#5ABB67', bgcolor: '#F1F8E9' },
  };

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
        py: 4,
      }}
    >
      {/* 로고 */}
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Box sx={{ mb: 1 }}>
          <FitBuddyCharacter size={58} />
        </Box>
        <Typography
          variant='h2'
          sx={{ color: '#1B5E20', fontWeight: 900, fontSize: '1.7rem', letterSpacing: '-0.3px', lineHeight: 1 }}
        >
          FitBuddy 가입
        </Typography>
        <Typography variant='body2' sx={{ color: '#66BB6A', mt: 0.4, fontWeight: 500 }}>
          건강한 습관의 시작
        </Typography>
      </Box>

      {/* 메인 카드 */}
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid #E8F5E9',
        }}
      >
        <CardContent sx={{ p: 3.5, '&:last-child': { pb: 3.5 } }}>
          <Stepper
            activeStep={step}
            sx={{
              mb: 3.5,
              '& .MuiStepLabel-label': { fontSize: '0.8rem' },
              '& .MuiStepIcon-root.Mui-active': { color: '#6BCB77' },
              '& .MuiStepIcon-root.Mui-completed': { color: '#6BCB77' },
            }}
          >
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Step 0: 기본 정보 */}
          {step === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 이름(real_name)은 실제 프로필 정보, 닉네임(display_name)은 FitBuddy 서비스
                  전반(Feed/Post/캐릭터 등)에서 쓰는 표시 이름 — 서로 독립된 값이라 각각
                  입력받는다. */}
              <TextField label='이름' value={form.realName} onChange={(e) => update('realName', e.target.value)} fullWidth sx={inputSx} />
              <TextField label='닉네임' value={form.displayName} onChange={(e) => update('displayName', e.target.value)} fullWidth sx={inputSx} />

              {/* 성별 선택 */}
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 600, mb: 1, color: '#333' }}>성별</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  {[
                    { value: 'female', label: '여성', char: <FitBuddyCharacter size={44} gender='female' /> },
                    { value: 'male', label: '남성', char: <FitBuddyCharacter size={44} gender='male' /> },
                  ].map((opt) => (
                    <Box
                      key={opt.value}
                      onClick={() => update('gender', opt.value)}
                      sx={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        py: 1.5, borderRadius: 3, cursor: 'pointer',
                        border: `2px solid ${form.gender === opt.value ? '#6BCB77' : '#E0E0E0'}`,
                        bgcolor: form.gender === opt.value ? '#E8F5E9' : '#FAFAFA',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.char}
                      <Typography variant='caption' sx={{ fontWeight: form.gender === opt.value ? 700 : 400, color: form.gender === opt.value ? '#2E7D32' : '#757575' }}>
                        {opt.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* 캐릭터 스타일/번호 선택 — 성별 선택 바로 아래에 자연스럽게 이어 붙인다.
                  아무것도 고르지 않으면 기본값(semi/1번)으로 가입된다. */}
              <CharacterStylePicker
                gender={form.gender || 'female'}
                characterStyle={form.characterStyle}
                characterVariant={form.characterVariant}
                onStyleChange={(v) => update('characterStyle', v)}
                onVariantChange={(v) => update('characterVariant', v)}
                previewSize={60}
              />

              <TextField label='이메일' type='email' value={form.email} onChange={(e) => update('email', e.target.value)} fullWidth sx={inputSx} />
              <TextField
                label='비밀번호'
                type='password'
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                fullWidth
                sx={inputSx}
              />
              {form.password && (
                <Box sx={{ mt: -1 }}>
                  <LinearProgress variant='determinate' value={pwStrength} color={pwColor} sx={{ borderRadius: 4, height: 5 }} />
                  <Typography variant='caption' color={`${pwColor}.main`} sx={{ fontWeight: 600 }}>
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
                sx={inputSx}
                error={form.confirmPw !== '' && form.password !== form.confirmPw}
                helperText={
                  form.confirmPw !== '' && form.password !== form.confirmPw
                    ? '비밀번호가 일치하지 않습니다'
                    : form.confirmPw
                    ? '✓ 일치합니다'
                    : ''
                }
              />
              <Button variant='contained' fullWidth onClick={nextStep} sx={primaryBtnSx}>
                다음
              </Button>
            </Box>
          )}

          {/* Step 1: 신체 정보 */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label='키 (cm)' type='number' value={form.height} onChange={(e) => update('height', e.target.value)} fullWidth sx={inputSx} />
              <TextField label='현재 몸무게 (kg)' type='number' value={form.weight} onChange={(e) => update('weight', e.target.value)} fullWidth sx={inputSx} />
              <TextField label='목표 몸무게 (kg)' type='number' value={form.goalWeight} onChange={(e) => update('goalWeight', e.target.value)} fullWidth sx={inputSx} />
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button variant='outlined' fullWidth onClick={() => setStep(0)} sx={outlinedBtnSx}>이전</Button>
                <Button variant='contained' fullWidth onClick={nextStep} sx={primaryBtnSx}>다음</Button>
              </Box>
            </Box>
          )}

          {/* Step 2: 운동 목표 */}
          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* 운동 목표 — 다중 선택 */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.2 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#333' }}>운동 목표</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E' }}>복수 선택 가능</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {WORKOUT_GOALS.map((g) => (
                    <SelectPill key={g} label={g} isSelected={form.workoutGoals.includes(g)} onClick={() => toggleGoal(g)} />
                  ))}
                </Box>
              </Box>

              {/* 관심 운동 — 다중 선택 */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.2 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#333' }}>관심 운동</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E' }}>복수 선택 가능</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {INTERESTS.map((i) => (
                    <SelectPill key={i} label={i} isSelected={form.interests.includes(i)} onClick={() => toggleInterest(i)} />
                  ))}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button variant='outlined' fullWidth onClick={() => setStep(1)} sx={outlinedBtnSx}>이전</Button>
                <Button
                  variant='contained'
                  fullWidth
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={primaryBtnSx}
                >
                  {loading ? '가입 중...' : '🎉 시작하기'}
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Typography variant='body2' sx={{ color: '#9E9E9E' }}>
              이미 계정이 있으신가요?{' '}
              <Link to='/login' style={{ color: '#6BCB77', fontWeight: 700, textDecoration: 'none' }}>
                로그인
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
