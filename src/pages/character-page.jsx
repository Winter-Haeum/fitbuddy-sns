import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import CharacterStylePicker from '../components/ui/character-style-picker';
import { getLevelFromXP, xpToReachLevel, xpForNextLevel } from '../utils/xp-utils';

const XP_RULES = [
  ['운동 완료 1회', '+5 XP'],
  ['운동 시간 10분당', '+2 XP'],
  ['10분 미만 운동', '+1 XP'],
  ['낮은 강도 보너스', '+1 XP'],
  ['보통 강도 보너스', '+3 XP'],
  ['높은 강도 보너스', '+5 XP'],
  ['운동 일기 작성', '+2 XP (하루 1회)'],
  ['하루 목표 달성', '+10 XP (하루 1회)'],
];

export default function CharacterPage() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuth();
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('fitbuddy_characters').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setCharacter(data); });
  }, [user]);

  const xp = character?.experience || 0;
  const level = getLevelFromXP(xp);
  const xpCurrentStart = xpToReachLevel(level);
  const xpNeeded = xpForNextLevel(level);
  const xpInLevel = xp - xpCurrentStart;
  const xpPct = Math.min((xpInLevel / xpNeeded) * 100, 100);

  const circumference = 2 * Math.PI * 52;
  const filledArc = (xpPct / 100) * circumference;

  const gender = profile?.gender || 'female';
  // fitbuddy_users에 DB DEFAULT('semi'/1)가 있지만, 그 값이 아직 반영되지 않은 오래된 profile
  // row(예: 컬럼 추가 전 가입)에서도 undefined가 안전하게 같은 값으로 폴백되도록 유지한다.
  const characterStyle = profile?.character_style || 'semi';
  const characterVariant = profile?.character_variant || 1;
  const nickName = profile?.display_name || '내 캐릭터';

  // 캐릭터 변경 UI의 선택 상태 — DB에 저장된 값과 별개로 두고, 명시적으로 저장 버튼을 눌러야만
  // fitbuddy_users에 반영한다(선택 즉시 저장 금지). 이 페이지는 ProtectedRoute가 useAuth의
  // loading이 끝난 뒤에만 마운트하므로(App.jsx), 마운트 시점에는 profile이 이미 채워져 있어
  // lazy initializer로 한 번만 읽으면 된다 — 저장 성공 후에는 fetchProfile로 characterStyle/
  // characterVariant 자체가 selectedStyle/selectedVariant와 같은 값으로 갱신되므로 별도
  // 동기화 effect 없이도 hasCharacterChanges가 다시 false로 떨어진다.
  const [selectedStyle, setSelectedStyle] = useState(() => characterStyle);
  const [selectedVariant, setSelectedVariant] = useState(() => characterVariant);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const hasCharacterChanges = selectedStyle !== characterStyle || selectedVariant !== characterVariant;

  async function handleSaveCharacter() {
    if (!hasCharacterChanges || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fitbuddy_users')
        .update({ character_style: selectedStyle, character_variant: selectedVariant })
        .eq('id', user.id);
      if (error) throw error;
      await fetchProfile(user.id);
      setSnack({ open: true, msg: '캐릭터가 변경되었습니다!', severity: 'success' });
    } catch (err) {
      console.error('[character-page] 캐릭터 저장 실패:', err);
      setSnack({ open: true, msg: '캐릭터 저장에 실패했습니다. 다시 시도해주세요.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} size='small' sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='h2' sx={{ fontWeight: 700 }}>내 캐릭터 🎮</Typography>
        </Box>

        {/* 캐릭터 메인 카드 */}
        <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #6BCB7718 0%, white 60%)', border: '1.5px solid #6BCB7744' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            {/* 원형 XP 게이지 + 캐릭터 */}
            <Box sx={{ position: 'relative', width: 180, height: 180, mx: 'auto', mb: 1.5 }}>
              <svg width='180' height='180' viewBox='0 0 120 120'>
                <circle cx='60' cy='60' r='52' fill='none' stroke='#6BCB7730' strokeWidth='7' />
                <circle
                  cx='60' cy='60' r='52'
                  fill='none'
                  stroke='#6BCB77'
                  strokeWidth='7'
                  strokeLinecap='round'
                  strokeDasharray={`${filledArc} ${circumference}`}
                  transform='rotate(-90 60 60)'
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FitBuddyCharacter
                  size={110}
                  gender={gender}
                  characterStyle={selectedStyle}
                  characterVariant={selectedVariant}
                  percentage={Math.round(xpPct)}
                />
              </Box>
            </Box>

            <Typography variant='h2' sx={{ fontWeight: 700, mb: 0.5 }}>
              {nickName}
            </Typography>

            <Chip label={`Lv.${level}`} sx={{ bgcolor: '#6BCB77', color: 'white', fontWeight: 700 }} />
          </CardContent>
        </Card>

        {/* 경험치 정보 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>Lv.{level} 경험치</Typography>
              <Typography variant='body2' color='text.secondary'>
                {xpInLevel} XP / {xpNeeded} XP
              </Typography>
            </Box>
            <Box sx={{ bgcolor: '#6BCB7720', borderRadius: 3, height: 12, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#6BCB77', width: `${xpPct}%`, height: '100%', borderRadius: 3, transition: 'width 0.5s ease' }} />
            </Box>
            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
              다음 레벨까지 {xpNeeded - xpInLevel} XP 남음
            </Typography>
          </CardContent>
        </Card>

        {/* 경험치 획득 방법 */}
        <Card sx={{ mb: 2, bgcolor: '#F1F8E9', border: '1px solid #C8E6C9' }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1, color: '#2E7D32' }}>⚡ 경험치 획득 방법</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
              {XP_RULES.map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='caption' color='text.secondary'>{label}</Typography>
                  <Typography variant='caption' sx={{ fontWeight: 700, color: '#388E3C' }}>{val}</Typography>
                </Box>
              ))}
            </Box>
            <Typography variant='caption' sx={{ color: '#888', mt: 1, display: 'block' }}>
              하루 최대 획득 가능 XP: 40 XP
            </Typography>
          </CardContent>
        </Card>

        {/* 캐릭터 변경 — gender는 Profile에서만 관리하고 여기서는 style/variant만 다룬다.
            선택은 저장 버튼을 눌러야 fitbuddy_users에 반영된다(즉시 저장 금지). */}
        <Card>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1.5 }}>캐릭터 변경</Typography>
            <CharacterStylePicker
              gender={gender}
              characterStyle={selectedStyle}
              characterVariant={selectedVariant}
              onStyleChange={setSelectedStyle}
              onVariantChange={setSelectedVariant}
            />
            <Button
              fullWidth
              variant='contained'
              disabled={!hasCharacterChanges || saving}
              onClick={handleSaveCharacter}
              sx={{ mt: 2, bgcolor: '#6BCB77', '&:hover': { bgcolor: '#4CAF5A' } }}
            >
              {saving ? '저장 중…' : '캐릭터 변경 저장'}
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant='filled' sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
