import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
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
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TimerIcon from '@mui/icons-material/Timer';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, fetchProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalMinutes: 0, totalCalories: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(false);
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
    const { data } = await supabase
      .from('fitbuddy_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
  }

  async function fetchSavedPosts() {
    const { data } = await supabase
      .from('fitbuddy_saved_posts')
      .select('*, fitbuddy_posts(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSavedPosts((data || []).map((d) => d.fitbuddy_posts).filter(Boolean));
  }

  async function fetchStats() {
    const { data } = await supabase
      .from('fitbuddy_workouts')
      .select('duration_minutes, calories_burned')
      .eq('user_id', user.id);
    const all = data || [];
    setStats({
      totalWorkouts: all.length,
      totalMinutes: all.reduce((s, w) => s + (w.duration_minutes || 0), 0),
      totalCalories: all.reduce((s, w) => s + (w.calories_burned || 0), 0),
    });
  }

  function openEdit() {
    setEditForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      height: profile?.height || '',
      weight: profile?.weight || '',
      goal_weight: profile?.goal_weight || '',
    });
    setEditOpen(true);
  }

  async function saveProfile() {
    setLoading(true);
    await supabase.from('fitbuddy_users').update(editForm).eq('id', user.id);
    await fetchProfile(user.id);
    setLoading(false);
    setEditOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const healthEmoji = { tired: '😴', normal: '😐', healthy: '😊', active: '💪' };

  const displayPosts = tab === 'posts' ? posts : savedPosts;

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 프로필 헤더 */}
        <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #6BCB77 0%, #5DA9E9 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.3)', fontSize: '2rem', border: '3px solid white' }}
              >
                {profile?.display_name?.[0] || 'F'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h2' sx={{ fontWeight: 700, color: 'white' }}>
                  {profile?.display_name || '사용자'}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9, mb: 0.5 }}>@{profile?.username}</Typography>
                {profile?.bio && (
                  <Typography variant='body2' sx={{ opacity: 0.85 }}>{profile.bio}</Typography>
                )}
              </Box>
              <Button
                variant='outlined'
                size='small'
                startIcon={<EditIcon />}
                onClick={openEdit}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}
              >
                수정
              </Button>
            </Box>

            {/* 신체 정보 */}
            {(profile?.height || profile?.weight) && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                {profile?.height && <Chip label={`키: ${profile.height}cm`} size='small' sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
                {profile?.weight && <Chip label={`몸무게: ${profile.weight}kg`} size='small' sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
                {profile?.goal_weight && <Chip label={`목표: ${profile.goal_weight}kg`} size='small' sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 캐릭터 상태 + 운동 통계 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/character')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '2.5rem' }}>
                  {healthEmoji[character?.health_status || 'tired']}
                </Typography>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 600 }}>
                    {character?.character_name || '내 캐릭터'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label={`Lv.${character?.level || 1}`} size='small' color='primary' />
                    <Chip label={`${character?.experience || 0} XP`} size='small' variant='outlined' />
                  </Box>
                </Box>
                <Button variant='outlined' size='small' sx={{ ml: 'auto' }}>캐릭터 보기</Button>
              </CardContent>
            </Card>
          </Grid>
          {[
            { icon: <FitnessCenterIcon />, value: stats.totalWorkouts, unit: '회', label: '총 운동', color: '#E8F5E9', iconColor: '#6BCB77' },
            { icon: <TimerIcon />, value: stats.totalMinutes, unit: '분', label: '운동 시간', color: '#E3F2FD', iconColor: '#5DA9E9' },
            { icon: <LocalFireDepartmentIcon />, value: stats.totalCalories, unit: 'kcal', label: '소모 칼로리', color: '#FFF3E0', iconColor: '#FF7043' },
          ].map((item) => (
            <Grid size={{ xs: 4 }} key={item.label}>
              <Card sx={{ textAlign: 'center', bgcolor: item.color }}>
                <CardContent sx={{ py: 1.5, px: 1 }}>
                  <Box sx={{ color: item.iconColor }}>{item.icon}</Box>
                  <Typography variant='h4' sx={{ fontWeight: 700, color: item.iconColor }}>
                    {item.value.toLocaleString()}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>{item.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 탭 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={tab === 'posts' ? 'contained' : 'outlined'}
            onClick={() => setTab('posts')}
            sx={{ flex: 1, ...(tab === 'posts' && { background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }) }}
          >
            내 게시글 ({posts.length})
          </Button>
          <Button
            variant={tab === 'saved' ? 'contained' : 'outlined'}
            onClick={() => setTab('saved')}
            sx={{ flex: 1, ...(tab === 'saved' && { background: 'linear-gradient(90deg, #A084E8, #5DA9E9)' }) }}
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

        {/* 로그아웃 */}
        <Button
          variant='outlined'
          fullWidth
          color='error'
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
        >
          로그아웃
        </Button>
      </Box>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label='닉네임' value={editForm.display_name || ''} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} fullWidth />
          <TextField label='자기소개' value={editForm.bio || ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} fullWidth multiline rows={2} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label='키 (cm)' type='number' value={editForm.height || ''} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} fullWidth size='small' />
            <TextField label='몸무게 (kg)' type='number' value={editForm.weight || ''} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} fullWidth size='small' />
            <TextField label='목표 (kg)' type='number' value={editForm.goal_weight || ''} onChange={(e) => setEditForm({ ...editForm, goal_weight: e.target.value })} fullWidth size='small' />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>취소</Button>
          <Button variant='contained' onClick={saveProfile} disabled={loading} sx={{ background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
