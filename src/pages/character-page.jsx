import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';

const XP_STAGES = [
  { stage: 1, name: '새싹', xpRequired: 0, color: '#6BCB77' },
  { stage: 2, name: '성장', xpRequired: 100, color: '#5DA9E9' },
  { stage: 3, name: '개화', xpRequired: 300, color: '#FF7043' },
  { stage: 4, name: '열매', xpRequired: 700, color: '#A084E8' },
  { stage: 5, name: '마스터', xpRequired: 1500, color: '#FFB300' },
];

const ITEMS = [
  { id: 1, name: '러닝화', emoji: '👟', price: 0 },
  { id: 2, name: '운동복', emoji: '👕', price: 50 },
  { id: 3, name: '스마트워치', emoji: '⌚', price: 100 },
  { id: 4, name: '물병', emoji: '🍶', price: 150 },
  { id: 5, name: '요가매트', emoji: '🧘', price: 200 },
  { id: 6, name: '덤벨', emoji: '🏋️', price: 300 },
  { id: 7, name: '프로틴', emoji: '🥛', price: 400 },
  { id: 8, name: '헤드셋', emoji: '🎧', price: 500 },
  { id: 9, name: '황금러닝화', emoji: '🥇', price: 800 },
  { id: 10, name: '트로피배지', emoji: '🏆', price: 1000 },
];

export default function CharacterPage() {
  const { user, profile } = useAuth();
  const [character, setCharacter] = useState(null);
  const [equippedItemId, setEquippedItemId] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('fitbuddy_characters').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setCharacter(data); });
  }, [user]);

  const xp = character?.experience || 0;
  const points = character?.points || 0;
  const level = character?.level || 1;

  const currentStage = [...XP_STAGES].reverse().find((s) => xp >= s.xpRequired) || XP_STAGES[0];
  const nextStage = XP_STAGES.find((s) => s.stage === currentStage.stage + 1);
  const xpInStage = xp - currentStage.xpRequired;
  const xpNeeded = nextStage ? nextStage.xpRequired - currentStage.xpRequired : 1;
  const xpPct = nextStage ? Math.min((xpInStage / xpNeeded) * 100, 100) : 100;
  const circumference = 2 * Math.PI * 52;
  const filledArc = (xpPct / 100) * circumference;

  const gender = profile?.gender || 'female';
  const stageColor = currentStage.color;

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>내 캐릭터 🎮</Typography>

        {/* 캐릭터 메인 카드 */}
        <Card sx={{ mb: 2, background: `linear-gradient(135deg, ${stageColor}18 0%, white 60%)`, border: `1.5px solid ${stageColor}44` }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            {/* 원형 XP 게이지 + 캐릭터 */}
            <Box sx={{ position: 'relative', width: 180, height: 180, mx: 'auto', mb: 1.5 }}>
              <svg width='180' height='180' viewBox='0 0 120 120'>
                <circle cx='60' cy='60' r='52' fill='none' stroke={`${stageColor}30`} strokeWidth='7' />
                <circle
                  cx='60' cy='60' r='52'
                  fill='none'
                  stroke={stageColor}
                  strokeWidth='7'
                  strokeLinecap='round'
                  strokeDasharray={`${filledArc} ${circumference}`}
                  transform='rotate(-90 60 60)'
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FitBuddyCharacter size={110} gender={gender} />
              </Box>
            </Box>

            <Typography variant='h2' sx={{ fontWeight: 700, mb: 0.5 }}>
              {character?.character_name || '내 캐릭터'}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
              <Chip label={`Lv.${level}`} sx={{ bgcolor: stageColor, color: 'white', fontWeight: 700 }} />
              <Chip label={`${currentStage.name}`} variant='outlined' sx={{ borderColor: stageColor, color: stageColor, fontWeight: 600 }} />
            </Box>

            <Chip
              label={`🪙 ${points} 포인트`}
              variant='outlined'
              sx={{ borderColor: '#FFB300', color: '#F57F17', fontWeight: 600 }}
            />
          </CardContent>
        </Card>

        {/* 경험치 정보 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>경험치</Typography>
              <Typography variant='body2' color='text.secondary'>
                {xp} XP {nextStage ? `/ ${nextStage.xpRequired} XP` : '(최고 단계)'}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: `${stageColor}20`, borderRadius: 3, height: 12, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: stageColor, width: `${xpPct}%`, height: '100%', borderRadius: 3, transition: 'width 0.5s ease' }} />
            </Box>
            {nextStage && (
              <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                다음 단계까지 {nextStage.xpRequired - xp} XP 남음
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* 포인트 획득 방법 */}
        <Card sx={{ mb: 2, bgcolor: '#FFFDE7', border: '1px solid #FFF9C4' }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 0.8, color: '#F57F17' }}>🪙 포인트 획득 방법</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
              {[
                ['운동 완료 (낮은 강도)', '+5pt'],
                ['운동 완료 (보통 강도)', '+10pt'],
                ['운동 완료 (높은 강도)', '+15pt'],
                ['XP', '운동 시간(분) = XP'],
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='caption' color='text.secondary'>{label}</Typography>
                  <Typography variant='caption' sx={{ fontWeight: 700, color: '#F57F17' }}>{val}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* 운동 아이템 */}
        <Card>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1.5 }}>운동 아이템</Typography>
            <Grid container spacing={1}>
              {ITEMS.map((item) => {
                const unlocked = points >= item.price;
                const equipped = equippedItemId === item.id;
                return (
                  <Grid size={{ xs: 3 }} key={item.id}>
                    <Card
                      sx={{
                        textAlign: 'center',
                        opacity: unlocked ? 1 : 0.45,
                        bgcolor: equipped ? '#EDE7F6' : unlocked ? '#F0FFF4' : '#f5f5f5',
                        border: equipped ? '2px solid #A084E8' : '1px solid transparent',
                        cursor: unlocked ? 'pointer' : 'default',
                      }}
                      onClick={() => { if (unlocked) setEquippedItemId(equipped ? null : item.id); }}
                    >
                      <CardContent sx={{ py: 1.5, px: 0.5 }}>
                        <Typography sx={{ fontSize: '1.8rem' }}>{item.emoji}</Typography>
                        <Typography variant='caption' sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
                          {item.name}
                        </Typography>
                        {equipped ? (
                          <Chip label='착용중' size='small' sx={{ bgcolor: '#A084E8', color: 'white', fontSize: '0.6rem', height: 18, mt: 0.3 }} />
                        ) : unlocked ? (
                          <Typography variant='caption' sx={{ color: '#6BCB77', fontSize: '0.65rem', display: 'block' }}>장착 가능</Typography>
                        ) : (
                          <Typography variant='caption' sx={{ color: '#999', fontSize: '0.65rem', display: 'block' }}>🪙 {item.price}</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}
