import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const HEALTH_INFO = {
  tired: { emoji: '😴', label: '피곤함', color: '#9E9E9E', desc: '운동이 필요해요! 오늘 운동을 시작해보세요.' },
  normal: { emoji: '😐', label: '보통', color: '#5DA9E9', desc: '꾸준히 유지하고 있어요. 조금 더 힘내요!' },
  healthy: { emoji: '😊', label: '건강함', color: '#6BCB77', desc: '좋은 컨디션이에요! 이 상태를 유지해요.' },
  active: { emoji: '💪', label: '활기참', color: '#A084E8', desc: '최상의 컨디션! 정말 열심히 하고 있어요!' },
};

const GROWTH_STAGES = [
  { stage: 1, name: '새싹', emoji: '🌱', xpRequired: 0 },
  { stage: 2, name: '성장', emoji: '🌿', xpRequired: 100 },
  { stage: 3, name: '개화', emoji: '🌸', xpRequired: 300 },
  { stage: 4, name: '열매', emoji: '🌳', xpRequired: 700 },
  { stage: 5, name: '마스터', emoji: '🏆', xpRequired: 1500 },
];

const ITEMS = [
  { id: 1, name: '러닝화', emoji: '👟', unlock: 0 },
  { id: 2, name: '운동복', emoji: '👕', unlock: 100 },
  { id: 3, name: '헬멧', emoji: '⛑️', unlock: 300 },
  { id: 4, name: '트로피', emoji: '🏆', unlock: 700 },
];

export default function CharacterPage() {
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [workoutStats, setWorkoutStats] = useState({ total: 0, thisWeek: 0, streak: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from('fitbuddy_characters').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setCharacter(data));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    supabase.from('fitbuddy_workouts').select('workout_date, duration_minutes').eq('user_id', user.id)
      .then(({ data }) => {
        const all = data || [];
        const thisWeek = all.filter((w) => new Date(w.workout_date) >= weekAgo);
        setWorkoutStats({ total: all.length, thisWeek: thisWeek.length, streak: Math.min(thisWeek.length, 7) });
      });
  }, [user]);

  async function updateHealthStatus(status) {
    if (!character) return;
    const xpGain = { tired: 0, normal: 10, healthy: 30, active: 50 }[status] || 0;
    const newXp = (character.experience || 0) + xpGain;
    const nextStage = GROWTH_STAGES.findLast((s) => newXp >= s.xpRequired) || GROWTH_STAGES[0];

    await supabase.from('fitbuddy_characters').update({
      health_status: status,
      experience: newXp,
      growth_stage: nextStage.stage,
    }).eq('id', character.id);

    setCharacter((prev) => ({ ...prev, health_status: status, experience: newXp, growth_stage: nextStage.stage }));
  }

  const healthInfo = HEALTH_INFO[character?.health_status || 'tired'];
  const currentStage = GROWTH_STAGES.find((s) => s.stage === (character?.growth_stage || 1)) || GROWTH_STAGES[0];
  const nextStage = GROWTH_STAGES[currentStage.stage] || null;
  const xpProgress = nextStage
    ? ((character?.experience || 0) - currentStage.xpRequired) / (nextStage.xpRequired - currentStage.xpRequired) * 100
    : 100;

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>내 캐릭터 🎮</Typography>

        {/* 캐릭터 메인 카드 */}
        <Card sx={{ mb: 2, background: `linear-gradient(135deg, ${healthInfo.color}22, #fff)`, border: `2px solid ${healthInfo.color}44` }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{
              width: 120, height: 120, borderRadius: '50%',
              background: `linear-gradient(135deg, ${healthInfo.color}44, #FFE08244)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2, fontSize: '4rem',
              boxShadow: `0 0 20px ${healthInfo.color}44`,
              animation: character?.health_status === 'active' ? 'pulse 1s infinite' : 'none',
            }}>
              {healthInfo.emoji}
            </Box>
            <Typography variant='h2' sx={{ fontWeight: 700, mb: 0.5 }}>
              {character?.character_name || '내 캐릭터'}
            </Typography>
            <Chip label={`${currentStage.emoji} ${currentStage.name}`} color='primary' sx={{ mr: 0.5 }} />
            <Chip label={`Lv.${character?.level || 1}`} color='secondary' />
            <Typography variant='body2' sx={{ mt: 1.5, color: healthInfo.color, fontWeight: 500 }}>
              {healthInfo.desc}
            </Typography>
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
                {nextStage ? `다음 단계: ${nextStage.emoji} ${nextStage.name} (${nextStage.xpRequired} XP)` : '최고 단계 달성!'}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={Math.min(xpProgress, 100)}
              sx={{ height: 12, borderRadius: 6, bgcolor: '#E8F5E9', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6BCB77, #A084E8)' } }}
            />
          </CardContent>
        </Card>

        {/* 운동 통계 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#E8F5E9' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant='h2' sx={{ fontWeight: 700, color: '#4CAF5A' }}>{workoutStats.total}</Typography>
                <Typography variant='caption' color='text.secondary'>총 운동</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#E3F2FD' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant='h2' sx={{ fontWeight: 700, color: '#5DA9E9' }}>{workoutStats.thisWeek}</Typography>
                <Typography variant='caption' color='text.secondary'>이번 주</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Card sx={{ textAlign: 'center', bgcolor: '#FFF3E0' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant='h2' sx={{ fontWeight: 700, color: '#FF7043' }}>{workoutStats.streak}일</Typography>
                <Typography variant='caption' color='text.secondary'>연속 운동</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 건강 상태 변경 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5 }}>건강 상태 업데이트</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(HEALTH_INFO).map(([key, info]) => (
                <Button
                  key={key}
                  variant={character?.health_status === key ? 'contained' : 'outlined'}
                  size='small'
                  onClick={() => updateHealthStatus(key)}
                  sx={{ borderColor: info.color, color: character?.health_status === key ? 'white' : info.color, bgcolor: character?.health_status === key ? info.color : 'transparent' }}
                >
                  {info.emoji} {info.label}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* 성장 단계 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5 }}>성장 단계</Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
              {GROWTH_STAGES.map((s) => (
                <Card
                  key={s.stage}
                  sx={{
                    flexShrink: 0,
                    width: 80,
                    textAlign: 'center',
                    border: currentStage.stage === s.stage ? '2px solid #6BCB77' : '1px solid #e0e0e0',
                    bgcolor: (character?.experience || 0) >= s.xpRequired ? '#E8F5E9' : '#f5f5f5',
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1 }}>
                    <Typography sx={{ fontSize: '1.8rem' }}>{s.emoji}</Typography>
                    <Typography variant='caption' sx={{ fontWeight: 600 }}>{s.name}</Typography>
                    <Typography variant='caption' display='block' color='text.secondary'>{s.xpRequired}XP</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* 아이템 */}
        <Card>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5 }}>운동 아이템</Typography>
            <Grid container spacing={1}>
              {ITEMS.map((item) => {
                const unlocked = (character?.experience || 0) >= item.unlock;
                return (
                  <Grid size={{ xs: 3 }} key={item.id}>
                    <Card sx={{ textAlign: 'center', opacity: unlocked ? 1 : 0.4, bgcolor: unlocked ? '#E8F5E9' : '#f5f5f5' }}>
                      <CardContent sx={{ py: 1.5, px: 1 }}>
                        <Typography sx={{ fontSize: '1.8rem' }}>{item.emoji}</Typography>
                        <Typography variant='caption'>{item.name}</Typography>
                        {!unlocked && <Typography variant='caption' display='block' color='text.secondary'>{item.unlock}XP</Typography>}
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
