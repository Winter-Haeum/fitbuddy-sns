import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [myJoined, setMyJoined] = useState(new Set());
  const [participants, setParticipants] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goal: '', days: 7 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChallenges();
    if (user) fetchMyJoined();
  }, [user]);

  async function fetchChallenges() {
    const { data } = await supabase
      .from('fitbuddy_challenges')
      .select('*')
      .order('created_at', { ascending: false });
    setChallenges(data || []);

    const counts = {};
    await Promise.all(
      (data || []).map(async (c) => {
        const { count } = await supabase
          .from('fitbuddy_challenge_users')
          .select('id', { count: 'exact', head: true })
          .eq('challenge_id', c.id);
        counts[c.id] = count || 0;
      })
    );
    setParticipants(counts);
  }

  async function fetchMyJoined() {
    const { data } = await supabase
      .from('fitbuddy_challenge_users')
      .select('challenge_id')
      .eq('user_id', user.id);
    setMyJoined(new Set((data || []).map((d) => d.challenge_id)));
  }

  async function toggleJoin(challengeId) {
    if (!user) return;
    if (myJoined.has(challengeId)) {
      await supabase.from('fitbuddy_challenge_users').delete().eq('challenge_id', challengeId).eq('user_id', user.id);
      setMyJoined((prev) => { const s = new Set(prev); s.delete(challengeId); return s; });
      setParticipants((prev) => ({ ...prev, [challengeId]: (prev[challengeId] || 1) - 1 }));
    } else {
      await supabase.from('fitbuddy_challenge_users').insert({ challenge_id: challengeId, user_id: user.id, progress: 0 });
      setMyJoined((prev) => new Set(prev).add(challengeId));
      setParticipants((prev) => ({ ...prev, [challengeId]: (prev[challengeId] || 0) + 1 }));
    }
  }

  async function handleCreate() {
    if (!form.title.trim() || !user) return;
    setLoading(true);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(form.days));
    await supabase.from('fitbuddy_challenges').insert({
      title: form.title,
      description: form.description,
      goal: form.goal,
      start_date: new Date().toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });
    setLoading(false);
    setOpen(false);
    setForm({ title: '', description: '', goal: '', days: 7 });
    fetchChallenges();
  }

  function getDaysLeft(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>운동 챌린지 🏆</Typography>

        {/* 상단 배너 */}
        <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #A084E8, #5DA9E9)', color: 'white' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEventsIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant='h3' sx={{ fontWeight: 700 }}>함께 도전해요!</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>챌린지에 참여하고 운동 습관을 만들어보세요</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* 챌린지 목록 */}
        {challenges.map((challenge) => {
          const daysLeft = getDaysLeft(challenge.end_date);
          const joined = myJoined.has(challenge.id);
          const count = participants[challenge.id] || 0;
          const progressVal = Math.max(0, 100 - (daysLeft / 30 * 100));

          return (
            <Card key={challenge.id} sx={{ mb: 2, border: joined ? '2px solid #6BCB77' : '1px solid #e0e0e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant='h3' sx={{ fontWeight: 600, flex: 1 }}>{challenge.title}</Typography>
                  {joined && <Chip label='참여중 ✓' size='small' color='primary' />}
                </Box>

                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                  {challenge.description}
                </Typography>

                {challenge.goal && (
                  <Chip label={`🎯 ${challenge.goal}`} size='small' variant='outlined' color='secondary' sx={{ mb: 1.5 }} />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant='caption' color='text.secondary'>{count}명 참여</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant='caption' color='text.secondary'>
                      {daysLeft > 0 ? `${daysLeft}일 남음` : '종료'}
                    </Typography>
                  </Box>
                </Box>

                {count > 0 && (
                  <AvatarGroup max={5} sx={{ mb: 1.5, justifyContent: 'flex-start' }}>
                    {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                      <Avatar key={i} sx={{ width: 28, height: 28, bgcolor: ['#6BCB77', '#5DA9E9', '#A084E8', '#FFE082', '#FF7043'][i % 5] }}>
                        {String.fromCharCode(65 + i)}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                )}

                <LinearProgress
                  variant='determinate'
                  value={progressVal}
                  sx={{ mb: 1.5, height: 6, borderRadius: 3, bgcolor: '#E8F5E9', '& .MuiLinearProgress-bar': { bgcolor: '#6BCB77' } }}
                />

                <Button
                  variant={joined ? 'outlined' : 'contained'}
                  fullWidth
                  size='small'
                  onClick={() => toggleJoin(challenge.id)}
                  disabled={daysLeft === 0}
                  sx={!joined ? { background: 'linear-gradient(90deg, #A084E8, #5DA9E9)' } : {}}
                >
                  {daysLeft === 0 ? '종료된 챌린지' : joined ? '챌린지 탈퇴' : '챌린지 참여하기'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* FAB */}
      <Fab
        sx={{ position: 'fixed', bottom: 80, right: 16, background: 'linear-gradient(135deg, #A084E8, #5DA9E9)', color: 'white' }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 챌린지 생성 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>챌린지 만들기 🏆</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label='챌린지 이름' value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label='설명' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField label='목표 내용' value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} fullWidth />
          <TextField label='진행 기간 (일)' type='number' value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} fullWidth size='small' />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant='contained' onClick={handleCreate} disabled={loading} sx={{ background: 'linear-gradient(90deg, #A084E8, #5DA9E9)' }}>
            {loading ? '생성 중...' : '챌린지 생성'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
