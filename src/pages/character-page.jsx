import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import FitBuddyCharacter from '../components/ui/fitbuddy-character';
import { getLevelFromXP, xpToReachLevel, xpForNextLevel } from '../utils/xp-utils';

const XP_RULES = [
  ['운동 완료 1회', '+5 XP'],
  ['운동 시간 10분당', '+2 XP'],
  ['10분 미만 운동', '+1 XP'],
  ['낮은 강도 보너스', '+1 XP'],
  ['보통 강도 보너스', '+3 XP'],
  ['높은 강도 보너스', '+5 XP'],
  ['운동 일기 작성', '+3 XP (하루 1회)'],
  ['하루 목표 달성', '+10 XP (하루 1회)'],
  ['3일 연속 운동', '+5 XP'],
  ['7일 연속 운동', '+15 XP'],
  ['14일 연속 운동', '+30 XP'],
];

export default function CharacterPage() {
  const { user, profile } = useAuth();
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
  const nickName = profile?.display_name || '내 캐릭터';

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>내 캐릭터 🎮</Typography>

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
                <FitBuddyCharacter size={110} gender={gender} percentage={Math.round(xpPct)} />
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
        <Card sx={{ bgcolor: '#F1F8E9', border: '1px solid #C8E6C9' }}>
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
      </Box>
    </Layout>
  );
}
