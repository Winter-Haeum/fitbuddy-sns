import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const HEALTH_INFO = {
  tired: { emoji: '😴', color: '#9E9E9E' },
  normal: { emoji: '😐', color: '#5DA9E9' },
  healthy: { emoji: '😊', color: '#6BCB77' },
  active: { emoji: '💪', color: '#A084E8' },
};

const GROWTH_STAGES = [
  { stage: 1, name: '새싹', emoji: '🌱', xpRequired: 0 },
  { stage: 2, name: '성장', emoji: '🌿', xpRequired: 100 },
  { stage: 3, name: '개화', emoji: '🌸', xpRequired: 300 },
  { stage: 4, name: '열매', emoji: '🌳', xpRequired: 700 },
  { stage: 5, name: '마스터', emoji: '🏆', xpRequired: 1500 },
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
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [equippedItemId, setEquippedItemId] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('fitbuddy_characters').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setCharacter(data));
  }, [user]);

  const healthInfo = HEALTH_INFO[character?.health_status || 'tired'];
  const currentStage = GROWTH_STAGES.find((s) => s.stage === (character?.growth_stage || 1)) || GROWTH_STAGES[0];
  const nextStage = GROWTH_STAGES[currentStage.stage] || null;
  const xpProgress = nextStage
    ? ((character?.experience || 0) - currentStage.xpRequired) / (nextStage.xpRequired - currentStage.xpRequired) * 100
    : 100;
  const points = character?.points || 0;

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>내 캐릭터 🎮</Typography>

        {/* 캐릭터 메인 카드 */}
        <Card sx={{ mb: 2, bgcolor: 'white', border: `2px solid ${healthInfo.color}66` }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{
              width: 120, height: 120, borderRadius: '50%',
              bgcolor: `${healthInfo.color}22`,
              border: `2px solid ${healthInfo.color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2, fontSize: '4rem',
              boxShadow: `0 0 20px ${healthInfo.color}44`,
            }}>
              {healthInfo.emoji}
            </Box>
            <Typography variant='h2' sx={{ fontWeight: 700, mb: 1 }}>
              {character?.character_name || '내 캐릭터'}
            </Typography>
            <Chip
              label={`${currentStage.emoji} ${currentStage.name} · Lv.${character?.level || 1}`}
              color='primary'
              sx={{ fontSize: '0.85rem', mb: 1 }}
            />
            <Box>
              <Chip
                label={`🪙 ${points} 포인트`}
                variant='outlined'
                sx={{ borderColor: '#FFB300', color: '#F57F17', fontWeight: 600 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* 경험치 바 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                경험치 ({character?.experience || 0} XP)
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {nextStage ? `다음: ${nextStage.emoji} ${nextStage.name} (${nextStage.xpRequired} XP)` : '최고 단계 달성!'}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={Math.min(xpProgress, 100)}
              sx={{ height: 12, borderRadius: 6, bgcolor: '#E8F5E9', '& .MuiLinearProgress-bar': { bgcolor: '#6BCB77' } }}
            />
          </CardContent>
        </Card>

        {/* 운동 아이템 */}
        <Card>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5 }}>운동 아이템</Typography>
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
                          <Chip
                            label='착용중'
                            size='small'
                            sx={{ bgcolor: '#A084E8', color: 'white', fontSize: '0.6rem', height: 18, mt: 0.3 }}
                          />
                        ) : unlocked ? (
                          <Typography variant='caption' sx={{ color: '#6BCB77', fontSize: '0.65rem', display: 'block' }}>
                            장착 가능
                          </Typography>
                        ) : (
                          <Typography variant='caption' sx={{ color: '#999', fontSize: '0.65rem', display: 'block' }}>
                            🪙 {item.price}
                          </Typography>
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
