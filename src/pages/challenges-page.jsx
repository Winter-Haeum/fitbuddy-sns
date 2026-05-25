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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const CHALLENGE_TABS = ['기간 챌린지', '오늘 모임'];

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challengeTab, setChallengeTab] = useState(0);
  const [challenges, setChallenges] = useState([]);
  const [myJoined, setMyJoined] = useState(new Set());
  const [participants, setParticipants] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goal: '', days: 7, type: 'period' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChallenges();
    if (user) fetchMyJoined();
  }, [user]);

  async function fetchChallenges() {
    try {
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
    } catch (err) {
      console.error('챌린지 로드 오류:', err);
    }
  }

  async function fetchMyJoined() {
    try {
      const { data } = await supabase
        .from('fitbuddy_challenge_users')
        .select('challenge_id')
        .eq('user_id', user.id);
      setMyJoined(new Set((data || []).map((d) => d.challenge_id)));
    } catch (err) {
      console.error('참여 챌린지 로드 오류:', err);
    }
  }

  async function toggleJoin(challengeId) {
    if (!user) return;
    try {
      if (myJoined.has(challengeId)) {
        await supabase.from('fitbuddy_challenge_users').delete().eq('challenge_id', challengeId).eq('user_id', user.id);
        setMyJoined((prev) => { const s = new Set(prev); s.delete(challengeId); return s; });
        setParticipants((prev) => ({ ...prev, [challengeId]: (prev[challengeId] || 1) - 1 }));
      } else {
        await supabase.from('fitbuddy_challenge_users').insert({ challenge_id: challengeId, user_id: user.id, progress: 0 });
        setMyJoined((prev) => new Set(prev).add(challengeId));
        setParticipants((prev) => ({ ...prev, [challengeId]: (prev[challengeId] || 0) + 1 }));
      }
    } catch (err) {
      console.error('챌린지 참여 오류:', err);
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    console.log('SESSION:', session?.user?.id || 'MISSING');
    if (!session) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      if (form.type === 'today') {
        endDate.setHours(23, 59, 59);
      } else {
        endDate.setDate(endDate.getDate() + Number(form.days));
      }
      const payload = {
        title: form.title,
        description: form.description,
        goal: form.goal,
        start_date: todayStr,
        end_date: endDate.toISOString().split('T')[0],
        creator_id: session.user.id,
        challenge_type: form.type,
      };
      console.log('SAVE START:', payload);
      const { error: insertErr } = await supabase
        .from('fitbuddy_challenges')
        .insert(payload);
      console.log('INSERT ERROR:', insertErr);
      if (insertErr) {
        console.error('SUPABASE ERROR:', insertErr);
        alert('챌린지 생성 실패: ' + insertErr.message);
        setError('챌린지 생성에 실패했습니다: ' + insertErr.message);
        return;
      }
      console.log('챌린지 저장 성공');
      setOpen(false);
      setForm({ title: '', description: '', goal: '', days: 7, type: 'period' });
      fetchChallenges();
    } catch (err) {
      console.error('예상 못한 오류:', err);
      alert('오류: ' + err.message);
      setError('챌린지 생성 중 오류가 발생했습니다.');
    } finally {
      console.log('SAVE FINALLY');
      setLoading(false);
    }
  }

  function getDaysLeft(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  const filteredChallenges = challenges.filter((c) => {
    if (challengeTab === 0) return !c.challenge_type || c.challenge_type === 'period';
    return c.challenge_type === 'today';
  });

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>운동 챌린지 🎯</Typography>

        {/* 상단 배너 */}
        <Card sx={{ mb: 2, bgcolor: 'white', borderLeft: '4px solid #A084E8', boxShadow: '0 2px 10px rgba(160,132,232,0.12)' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '2.2rem' }}>🏆</Typography>
            <Box>
              <Typography variant='h3' sx={{ fontWeight: 700, color: '#6B4FC8' }}>함께 도전해요!</Typography>
              <Typography variant='body2' color='text.secondary'>챌린지에 참여하고 운동 습관을 만들어보세요</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* 내부 탭 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, borderBottom: '2px solid #EEE', pb: 1 }}>
          {CHALLENGE_TABS.map((t, i) => (
            <Button
              key={t}
              variant='text'
              onClick={() => setChallengeTab(i)}
              sx={{
                fontSize: '0.875rem', fontWeight: challengeTab === i ? 700 : 400,
                color: challengeTab === i ? '#A084E8' : 'text.secondary',
                borderBottom: challengeTab === i ? '2px solid #A084E8' : '2px solid transparent',
                borderRadius: 0, pb: 0.5,
              }}
            >
              {t}
            </Button>
          ))}
        </Box>

        {/* 챌린지 목록 */}
        {filteredChallenges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '3rem', mb: 1 }}>{challengeTab === 0 ? '🎯' : '🤝'}</Typography>
            <Typography color='text.secondary'>
              {challengeTab === 0 ? '기간 챌린지가 없습니다.' : '오늘 모임이 없습니다.'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>첫 번째 챌린지를 만들어보세요!</Typography>
          </Box>
        ) : (
          filteredChallenges.map((challenge) => {
            const daysLeft = getDaysLeft(challenge.end_date);
            const joined = myJoined.has(challenge.id);
            const count = participants[challenge.id] || 0;
            const totalDays = Math.ceil((new Date(challenge.end_date) - new Date(challenge.start_date)) / (1000 * 60 * 60 * 24));
            const progressVal = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 100;

            return (
              <Card
                key={challenge.id}
                sx={{
                  mb: 2,
                  border: joined ? '2px solid #A084E8' : '1px solid #e0e0e0',
                  boxShadow: joined ? '0 2px 12px rgba(160,132,232,0.18)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant='h3' sx={{ fontWeight: 600, flex: 1 }}>🏆 {challenge.title}</Typography>
                    {joined && <Chip label='참여중 ✓' size='small' sx={{ bgcolor: '#A084E8', color: 'white' }} />}
                  </Box>

                  {challenge.description && (
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                      {challenge.description}
                    </Typography>
                  )}

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
                      <Typography variant='caption' color={daysLeft <= 3 ? 'error.main' : 'text.secondary'}>
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

                  {challenge.challenge_type !== 'today' && (
                    <LinearProgress
                      variant='determinate'
                      value={progressVal}
                      sx={{ mb: 1.5, height: 6, borderRadius: 3, bgcolor: '#EDE7F6', '& .MuiLinearProgress-bar': { bgcolor: '#A084E8' } }}
                    />
                  )}

                  <Button
                    variant={joined ? 'outlined' : 'contained'}
                    fullWidth
                    size='small'
                    onClick={() => toggleJoin(challenge.id)}
                    disabled={daysLeft === 0}
                    sx={!joined ? { bgcolor: '#A084E8', '&:hover': { bgcolor: '#8B6FD4' } } : { borderColor: '#A084E8', color: '#A084E8' }}
                  >
                    {daysLeft === 0 ? '종료된 챌린지' : joined ? '챌린지 탈퇴' : '챌린지 참여하기'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      {/* FAB */}
      <Fab
        sx={{ position: 'fixed', bottom: 80, right: 16, bgcolor: '#A084E8', color: 'white', '&:hover': { bgcolor: '#8B6FD4' } }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 챌린지 생성 다이얼로그 */}
      <Dialog open={open} onClose={() => { setOpen(false); setError(''); }} fullWidth maxWidth='sm'>
        <DialogTitle>챌린지 만들기 🎯</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity='error'>{error}</Alert>}

          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>챌린지 유형</Typography>
            <ToggleButtonGroup
              value={form.type}
              exclusive
              onChange={(_, v) => { if (v) setForm({ ...form, type: v }); }}
              fullWidth
              size='small'
            >
              <ToggleButton value='period' sx={{ '&.Mui-selected': { bgcolor: '#EDE7F6', color: '#6B4FC8', borderColor: '#A084E8' } }}>
                🎯 기간 챌린지
              </ToggleButton>
              <ToggleButton value='today' sx={{ '&.Mui-selected': { bgcolor: '#E3F2FD', color: '#1565C0', borderColor: '#5DA9E9' } }}>
                🤝 오늘 모임
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField label='챌린지 이름' value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label='설명' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField label='목표 내용' value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} fullWidth />
          {form.type === 'period' && (
            <TextField
              label='진행 기간 (일)'
              type='number'
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
              fullWidth
              size='small'
              inputProps={{ min: 1, max: 90 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpen(false); setError(''); }}>취소</Button>
          <Button
            variant='contained'
            onClick={handleCreate}
            disabled={loading || !form.title.trim()}
            sx={{ bgcolor: '#A084E8', '&:hover': { bgcolor: '#8B6FD4' } }}
          >
            {loading ? '생성 중...' : '챌린지 생성'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
