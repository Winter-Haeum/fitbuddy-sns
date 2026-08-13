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
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import { getDaysLeft } from '../utils/date-utils';
import FadeInBox from '../components/ui/fade-in-box';
import FilterChipGroup from '../components/ui/filter-chip-group';

const CHALLENGE_TABS = ['기간 챌린지', '오늘 모임'];

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행중' },
  { key: 'ended', label: '종료' },
];

const SAMPLE_PERIOD = [
  { id: 'sp1', title: '30일 매일 운동 챌린지', description: '하루 30분 이상 꾸준히 운동하는 습관을 만들어봐요!', goal: '매일 30분 이상 운동', daysLeft: 30, count: 128 },
  { id: 'sp2', title: '아침 기상 스트레칭', description: '기상 후 10분 스트레칭으로 상쾌한 하루를 시작해요.', goal: '아침 10분 스트레칭', daysLeft: 14, count: 72 },
  { id: 'sp3', title: '주 3회 헬스장 가기', description: '이번 달 꾸준히 헬스장에 다니는 습관을 만들어봐요.', goal: '주 3회 헬스장 방문', daysLeft: 21, count: 43 },
];
const SAMPLE_TODAY = [
  { id: 'st1', title: '오늘 저녁 같이 뛰어요 🏃', description: '퇴근 후 공원에서 30분 가볍게 달려봐요. 누구나 환영!', goal: '30분 러닝', count: 12 },
  { id: 'st2', title: '오늘의 홈트 챌린지 💪', description: '집에서 20분 전신 홈트! 초보자도 OK, 같이 해봐요.', goal: '20분 홈트 완료', count: 34 },
  { id: 'st3', title: '오후 요가 함께해요 🧘', description: '오후 6시 온라인 요가 세션. 화상으로 같이 스트레칭해요.', goal: '30분 요가 완료', count: 8 },
];

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challengeTab, setChallengeTab] = useState(0);
  const [challenges, setChallenges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [myJoined, setMyJoined] = useState(new Set());
  const [participants, setParticipants] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goal: '', days: 7, type: 'period' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuChallenge, setMenuChallenge] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    fetchChallenges();
    if (user) fetchMyJoined();
  // fetchMyJoined must run on page load; useCallback refactor caused a new set-state-in-effect lint error.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchChallenges() {
    try {
      const { data } = await supabase
        .from('fitbuddy_challenges')
        .select('id, title, description, goal, start_date, end_date, creator_id, challenge_type')
        .order('created_at', { ascending: false });

      // 제목·설명이 비어있거나 너무 짧은 테스트 데이터 제외
      const validData = (data || []).filter(
        (c) => c.title?.trim().length > 1 && c.description?.trim().length > 1 && c.creator_id
      );
      setChallenges(validData);

      // N+1 → 단일 쿼리로 전체 참여자 수 한 번에 조회
      if (validData.length > 0) {
        const ids = validData.map((c) => c.id);
        const { data: memberRows } = await supabase
          .from('fitbuddy_challenge_users')
          .select('challenge_id')
          .in('challenge_id', ids);
        const counts = {};
        (memberRows || []).forEach(({ challenge_id }) => {
          counts[challenge_id] = (counts[challenge_id] || 0) + 1;
        });
        setParticipants(counts);
      }
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
        creator_id: user.id,
        challenge_type: form.type,
      };
      const { error: insertErr } = await supabase
        .from('fitbuddy_challenges')
        .insert(payload);
      if (insertErr) {
        console.error('SUPABASE ERROR:', insertErr);
        setError('챌린지 생성에 실패했습니다: ' + insertErr.message);
        return;
      }
      setOpen(false);
      setForm({ title: '', description: '', goal: '', days: 7, type: 'period' });
      fetchChallenges();
    } catch (err) {
      console.error('예상 못한 오류:', err);
      setError('챌린지 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function openMenu(e, challenge) {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuChallenge(challenge);
  }

  function closeMenu() { setMenuAnchor(null); }

  function startEdit() {
    closeMenu();
    setEditForm({ title: menuChallenge.title || '', description: menuChallenge.description || '', goal: menuChallenge.goal || '' });
    setEditOpen(true);
  }

  function startDelete() { closeMenu(); setDeleteOpen(true); }

  async function handleEditChallenge() {
    if (!menuChallenge) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('fitbuddy_challenges')
        .update({ title: editForm.title, description: editForm.description, goal: editForm.goal })
        .eq('id', menuChallenge.id)
        .eq('creator_id', user.id);
      if (error) { setSnack({ open: true, msg: '수정에 실패했습니다.', severity: 'error' }); return; }
      setSnack({ open: true, msg: '챌린지가 수정되었습니다.', severity: 'success' });
      setEditOpen(false);
      fetchChallenges();
    } catch { setSnack({ open: true, msg: '오류가 발생했습니다.', severity: 'error' }); }
    finally { setActionLoading(false); }
  }

  async function handleDeleteChallenge() {
    if (!menuChallenge) return;
    setActionLoading(true);
    try {
      await supabase.from('fitbuddy_challenge_users').delete().eq('challenge_id', menuChallenge.id);
      const { error } = await supabase.from('fitbuddy_challenges').delete().eq('id', menuChallenge.id).eq('creator_id', user.id);
      if (error) { setSnack({ open: true, msg: '삭제에 실패했습니다.', severity: 'error' }); return; }
      setSnack({ open: true, msg: '챌린지가 삭제되었습니다.', severity: 'info' });
      setDeleteOpen(false);
      setChallenges((prev) => prev.filter((c) => c.id !== menuChallenge.id));
      setMenuChallenge(null);
    } catch { setSnack({ open: true, msg: '오류가 발생했습니다.', severity: 'error' }); }
    finally { setActionLoading(false); }
  }

  const tabChallenges = challenges.filter((c) => {
    if (challengeTab === 0) return !c.challenge_type || c.challenge_type === 'period';
    return c.challenge_type === 'today';
  });

  const filteredChallenges = tabChallenges.filter((c) => {
    // getDaysLeft는 0 이상만 반환하므로, 종료 여부는 0 도달로 판단(기존 '종료된 챌린지' 버튼 비활성 기준과 동일)
    const daysLeft = getDaysLeft(c.end_date);
    const statusMatch =
      statusFilter === 'all' ? true : statusFilter === 'active' ? daysLeft > 0 : daysLeft === 0;

    const q = searchQuery.trim().toLowerCase();
    const searchMatch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.goal?.toLowerCase().includes(q);

    return statusMatch && searchMatch;
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

        {/* 검색창 */}
        <TextField
          fullWidth
          size='small'
          placeholder='챌린지 검색...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* 상태 필터 */}
        <FilterChipGroup
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          sx={{ mb: 2 }}
        />

        {/* 챌린지 목록 */}
        {tabChallenges.length === 0 ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant='body2' sx={{ fontWeight: 600, color: '#9E9E9E' }}>
                {challengeTab === 0 ? '🎯 예시 챌린지' : '🤝 예시 모임'}
              </Typography>
              <Chip label='예시' size='small' sx={{ bgcolor: '#F5F5F5', color: '#9E9E9E', fontSize: '0.68rem', height: 20 }} />
            </Box>
            {(challengeTab === 0 ? SAMPLE_PERIOD : SAMPLE_TODAY).map((s) => (
              <Card key={s.id} sx={{ mb: 2, border: '1px solid #EEEEEE', boxShadow: 'none', opacity: 0.82 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant='h3' sx={{ fontWeight: 600, flex: 1 }}>🏆 {s.title}</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>{s.description}</Typography>
                  {s.goal && <Chip label={`🎯 ${s.goal}`} size='small' variant='outlined' color='secondary' sx={{ mb: 1.5 }} />}
                  <Box sx={{ display: 'flex', gap: 2, mb: challengeTab === 0 ? 1.5 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant='caption' color='text.secondary'>{s.count}명 참여</Typography>
                    </Box>
                    {challengeTab === 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant='caption' color='text.secondary'>{s.daysLeft}일 남음</Typography>
                      </Box>
                    )}
                  </Box>
                  {challengeTab === 0 && (
                    <LinearProgress
                      variant='determinate'
                      value={0}
                      sx={{ height: 6, borderRadius: 3, bgcolor: '#EDE7F6', '& .MuiLinearProgress-bar': { bgcolor: '#A084E8' } }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            <Box sx={{ textAlign: 'center', py: 2, borderTop: '1px dashed #E0E0E0', mt: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                + 버튼을 눌러 첫 번째 챌린지를 만들어보세요!
              </Typography>
            </Box>
          </Box>
        ) : filteredChallenges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontSize: '2.2rem', mb: 1 }}>🔍</Typography>
            <Typography color='text.secondary'>검색/필터 조건에 맞는 챌린지가 없습니다</Typography>
          </Box>
        ) : (
          filteredChallenges.map((challenge, idx) => {
            const daysLeft = getDaysLeft(challenge.end_date);
            const joined = myJoined.has(challenge.id);
            const count = participants[challenge.id] || 0;
            const totalDays = Math.ceil((new Date(challenge.end_date) - new Date(challenge.start_date)) / (1000 * 60 * 60 * 24));
            const progressVal = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 100;

            return (
              <FadeInBox key={challenge.id} delay={Math.min(idx, 4) * 60}>
                <Card
                  sx={{
                    mb: 2.5,
                    border: joined ? '2px solid #A084E8' : '1px solid #e0e0e0',
                    boxShadow: joined ? '0 2px 12px rgba(160,132,232,0.18)' : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent sx={{ px: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant='h3' sx={{ fontWeight: 600, flex: 1 }}>🏆 {challenge.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {joined && <Chip label='참여중 ✓' size='small' sx={{ bgcolor: '#A084E8', color: 'white' }} />}
                        {challenge.creator_id === user?.id && (
                          <IconButton size='small' onClick={(e) => openMenu(e, challenge)} sx={{ p: 0.3 }}>
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                      </Box>
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
              </FadeInBox>
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
              slotProps={{ htmlInput: { min: 1, max: 90 } }}
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

      {/* 컨텍스트 메뉴 */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={startEdit}>✏️ 수정하기</MenuItem>
        <MenuItem onClick={startDelete} sx={{ color: 'error.main' }}>🗑️ 삭제하기</MenuItem>
      </Menu>

      {/* 챌린지 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>챌린지 수정 🎯</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label='챌린지 이름' value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} fullWidth />
          <TextField label='설명' value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField label='목표 내용' value={editForm.goal || ''} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>취소</Button>
          <Button variant='contained' onClick={handleEditChallenge} disabled={actionLoading} sx={{ bgcolor: '#A084E8', '&:hover': { bgcolor: '#8B6FD4' } }}>
            {actionLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onClose={() => !actionLoading && setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🗑️</Typography>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>정말 삭제하시겠습니까?</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>챌린지와 모든 참여 기록이 삭제됩니다.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeleteOpen(false)} disabled={actionLoading}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={handleDeleteChallenge} disabled={actionLoading}>
            {actionLoading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>{snack.msg}</Alert>
      </Snackbar>
    </Layout>
  );
}
