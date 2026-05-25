import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TodayIcon from '@mui/icons-material/Today';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, fetchProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, thisWeek: 0, todayCount: 0, streak: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchMyPosts();
    fetchSavedPosts();
    fetchStats();
    supabase.from('fitbuddy_characters').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setCharacter(data));
  }, [user]);

  async function fetchMyPosts() {
    try {
      const { data } = await supabase
        .from('fitbuddy_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } catch (err) { console.error(err); }
  }

  async function fetchSavedPosts() {
    try {
      const { data } = await supabase
        .from('fitbuddy_saved_posts')
        .select('*, fitbuddy_posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSavedPosts((data || []).map((d) => d.fitbuddy_posts).filter(Boolean));
    } catch (err) { console.error(err); }
  }

  async function fetchStats() {
    try {
      const { data } = await supabase
        .from('fitbuddy_workouts')
        .select('workout_date')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });
      const all = data || [];
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const uniqueDates = [...new Set(all.map((w) => w.workout_date))];
      const dateSet = new Set(uniqueDates);

      // 연속 운동 계산
      let streak = 0;
      const checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }

      setStats({
        totalWorkouts: all.length,
        thisWeek: uniqueDates.filter((d) => d >= weekAgoStr).length,
        todayCount: all.filter((w) => w.workout_date === today).length,
        streak,
      });
    } catch (err) { console.error(err); }
  }

  function openEdit() {
    setEditForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      height: profile?.height > 0 ? String(profile.height) : '',
      weight: profile?.weight > 0 ? String(profile.weight) : '',
      goal_weight: profile?.goal_weight > 0 ? String(profile.goal_weight) : '',
      workout_goal: profile?.workout_goal || '',
    });
    setEditOpen(true);
  }

  async function saveProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('SESSION:', session?.user?.id || 'MISSING');
    if (!session) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }
    const payload = {
      display_name: editForm.display_name,
      bio: editForm.bio,
      height: editForm.height ? Number(editForm.height) : 0,
      weight: editForm.weight ? Number(editForm.weight) : 0,
      goal_weight: editForm.goal_weight ? Number(editForm.goal_weight) : 0,
      workout_goal: editForm.workout_goal,
    };
    console.log('SAVE START:', payload);
    setLoading(true);
    setSaveError('');
    try {
      const { error } = await supabase
        .from('fitbuddy_users')
        .update(payload)
        .eq('id', session.user.id);
      console.log('INSERT ERROR:', error);
      if (error) {
        console.error('SUPABASE ERROR:', error);
        alert('저장 실패: ' + error.message);
        setSaveError('저장에 실패했습니다: ' + error.message);
        return;
      }
      console.log('저장 성공');
      await fetchProfile(session.user.id);
      setEditOpen(false);
      setSnack({ open: true, msg: '프로필이 저장되었습니다!', severity: 'success' });
    } catch (err) {
      console.error('예상 못한 오류:', err);
      alert('오류: ' + err.message);
      setSaveError('저장 중 오류가 발생했습니다.');
    } finally {
      console.log('SAVE FINALLY');
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // CASCADE가 설정되었으므로 fitbuddy_users 삭제 시 관련 데이터 자동 삭제
      const { error: postsErr } = await supabase.from('fitbuddy_posts').delete().eq('user_id', user.id);
      if (postsErr) console.error('posts delete:', postsErr);

      const { error: charErr } = await supabase.from('fitbuddy_characters').delete().eq('user_id', user.id);
      if (charErr) console.error('characters delete:', charErr);

      const { error: userErr } = await supabase.from('fitbuddy_users').delete().eq('id', user.id);
      if (userErr) {
        console.error('users delete:', userErr);
        setDeleteError('데이터 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('회원 탈퇴 오류:', err);
      setDeleteError('탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const displayPosts = tab === 'posts' ? posts : savedPosts;

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 프로필 헤더 */}
        <Card sx={{ mb: 2, bgcolor: '#EAF7EE', border: '1.5px solid #B2DFC0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#5FCB77', fontSize: '2rem', border: '3px solid white', boxShadow: '0 2px 8px rgba(95,203,119,0.3)' }}>
                {profile?.display_name?.[0] || 'F'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h2' sx={{ fontWeight: 700, color: '#1B5E20' }}>
                  {profile?.display_name || '사용자'}
                </Typography>
                <Typography variant='body2' sx={{ color: '#388E3C', mb: 0.5 }}>@{profile?.username}</Typography>
                {profile?.bio && <Typography variant='body2' color='text.secondary'>{profile.bio}</Typography>}
              </Box>
              <Button
                variant='outlined' size='small' startIcon={<EditIcon />} onClick={openEdit}
                sx={{ borderColor: '#6BCB77', color: '#388E3C', '&:hover': { borderColor: '#4DBB68', bgcolor: '#F1F8E9' } }}
              >
                수정
              </Button>
            </Box>
            {(profile?.height > 0 || profile?.weight > 0 || profile?.workout_goal) && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                {profile?.height > 0 && <Chip label={`키: ${profile.height}cm`} size='small' sx={{ bgcolor: '#C8E6C9', color: '#2E7D32' }} />}
                {profile?.weight > 0 && <Chip label={`몸무게: ${profile.weight}kg`} size='small' sx={{ bgcolor: '#C8E6C9', color: '#2E7D32' }} />}
                {profile?.goal_weight > 0 && <Chip label={`목표: ${profile.goal_weight}kg`} size='small' sx={{ bgcolor: '#C8E6C9', color: '#2E7D32' }} />}
                {profile?.workout_goal && profile.workout_goal.split(',').filter(Boolean).map((g) => (
                  <Chip key={g} label={g.trim()} size='small' sx={{ bgcolor: '#E8F5E9', color: '#388E3C' }} />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 캐릭터 + 운동 통계 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/character')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '2.5rem' }}>
                  {character?.health_status === 'active' ? '💪' : character?.health_status === 'healthy' ? '😊' : character?.health_status === 'normal' ? '😐' : '😴'}
                </Typography>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 600 }}>{character?.character_name || '내 캐릭터'}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label={`Lv.${character?.level || 1}`} size='small' color='primary' />
                    <Chip label={`${character?.experience || 0} XP`} size='small' variant='outlined' />
                  </Box>
                </Box>
                <Button variant='outlined' size='small' sx={{ ml: 'auto' }}>캐릭터 보기</Button>
              </CardContent>
            </Card>
          </Grid>

          {/* 운동 통계 4개 */}
          {[
            { icon: <FitnessCenterIcon />, value: stats.totalWorkouts, unit: '회', label: '총 운동', color: '#E8F5E9', iconColor: '#6BCB77' },
            { icon: <CalendarTodayIcon />, value: stats.thisWeek, unit: '회', label: '이번 주', color: '#E3F2FD', iconColor: '#5DA9E9' },
            { icon: <TodayIcon />, value: stats.todayCount, unit: '회', label: '오늘', color: '#F3E8FF', iconColor: '#A084E8' },
            { icon: <WhatshotIcon />, value: stats.streak, unit: '일', label: '연속 운동', color: '#FFF3E0', iconColor: '#FF7043' },
          ].map((item) => (
            <Grid size={{ xs: 3 }} key={item.label}>
              <Card sx={{ textAlign: 'center', bgcolor: item.color }}>
                <CardContent sx={{ py: 1.5, px: 0.5 }}>
                  <Box sx={{ color: item.iconColor }}>{item.icon}</Box>
                  <Typography variant='h4' sx={{ fontWeight: 700, color: item.iconColor, fontSize: '1.1rem' }}>
                    {item.value}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.65rem' }}>{item.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 탭 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={tab === 'posts' ? 'contained' : 'outlined'} onClick={() => setTab('posts')}
            sx={{ flex: 1, ...(tab === 'posts' && { bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }) }}
          >
            내 게시글 ({posts.length})
          </Button>
          <Button
            variant={tab === 'saved' ? 'contained' : 'outlined'} onClick={() => setTab('saved')}
            sx={{ flex: 1, ...(tab === 'saved' && { bgcolor: '#A084E8', '&:hover': { bgcolor: '#8B6FD4' } }) }}
          >
            저장한 글 ({savedPosts.length})
          </Button>
        </Box>

        {/* 게시글 그리드 */}
        {displayPosts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color='text.secondary'>
              {tab === 'posts' ? '아직 작성한 게시글이 없습니다.' : '저장한 게시글이 없습니다.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1}>
            {displayPosts.map((post) => (
              <Grid size={{ xs: 4 }} key={post.id}>
                <Box
                  onClick={() => navigate(`/post/${post.id}`)}
                  sx={{ aspectRatio: '1', borderRadius: 2, overflow: 'hidden', cursor: 'pointer', bgcolor: '#e0e0e0', position: 'relative' }}
                >
                  {post.image_url ? (
                    <Box component='img' src={post.image_url} alt={post.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#E8F5E9' }}>
                      <FitnessCenterIcon sx={{ color: '#6BCB77', fontSize: 28 }} />
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <Divider sx={{ my: 3 }} />
        <Button variant='outlined' fullWidth color='error' startIcon={<LogoutIcon />} onClick={handleSignOut} sx={{ mb: 1.5 }}>
          로그아웃
        </Button>
        <Button
          variant='text' fullWidth startIcon={<DeleteForeverIcon />} onClick={() => { setDeleteError(''); setDeleteOpen(true); }}
          sx={{ color: '#BDBDBD', fontSize: '0.8rem' }}
        >
          회원 탈퇴
        </Button>
      </Box>

      {/* 탈퇴 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <WarningAmberIcon sx={{ fontSize: 48, color: '#FF7043', mb: 1 }} />
          <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>정말 탈퇴하시겠습니까?</Typography>
          <Typography variant='body2' color='text.secondary'>
            탈퇴 시 게시글, 캐릭터, 프로필 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </Typography>
          {deleteError && <Alert severity='error' sx={{ mt: 2, textAlign: 'left' }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
            취소
          </Button>
          <Button variant='contained' fullWidth color='error' onClick={handleDeleteAccount} disabled={deleteLoading}>
            {deleteLoading ? '처리 중...' : '탈퇴하기'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => !loading && setEditOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {saveError && <Alert severity='error'>{saveError}</Alert>}
          <TextField
            label='닉네임'
            value={editForm.display_name || ''}
            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
            fullWidth
            inputProps={{ maxLength: 20 }}
          />
          <TextField
            label='자기소개'
            value={editForm.bio || ''}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            fullWidth multiline rows={2}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label='키 (cm)' type='number' value={editForm.height || ''} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} fullWidth size='small' />
            <TextField label='몸무게 (kg)' type='number' value={editForm.weight || ''} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} fullWidth size='small' />
            <TextField label='목표 (kg)' type='number' value={editForm.goal_weight || ''} onChange={(e) => setEditForm({ ...editForm, goal_weight: e.target.value })} fullWidth size='small' />
          </Box>
          <TextField
            label='운동 목표'
            value={editForm.workout_goal || ''}
            onChange={(e) => setEditForm({ ...editForm, workout_goal: e.target.value })}
            fullWidth size='small'
            helperText='예: 다이어트, 근력 증가'
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={loading}>취소</Button>
          <Button variant='contained' onClick={saveProfile} disabled={loading} sx={{ bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
