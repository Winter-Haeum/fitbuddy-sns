import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import FilterChipGroup from '../components/ui/filter-chip-group';

const CATEGORIES = ['전체', '운동', '식단', '자유'];

const FEED_FILTER_OPTIONS = [
  { key: 'all', label: '전체 피드' },
  { key: 'mine', label: '내 게시글' },
  { key: 'saved', label: '저장한 글' },
];

export default function FeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('전체');
  const [search, setSearch] = useState('');
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  const [feedFilter, setFeedFilter] = useState(() => location.state?.myPostsOnly ? 'mine' : 'all');

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPost, setMenuPost] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', caption: '' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (feedFilter === 'saved') {
        const { data } = await supabase
          .from('fitbuddy_saved_posts')
          .select('fitbuddy_posts(*, fitbuddy_users(display_name, avatar_url, username))')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(30);
        setPosts((data || []).map((d) => d.fitbuddy_posts).filter(Boolean));
        return;
      }

      let query = supabase
        .from('fitbuddy_posts')
        .select('*, fitbuddy_users(display_name, avatar_url, username)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (feedFilter === 'mine' && user) {
        query = query.eq('user_id', user.id);
      }
      if (category !== '전체') {
        const typeMap = { '운동': 'workout', '식단': 'diet', '자유': 'free' };
        query = query.eq('post_type', typeMap[category]);
      }
      if (search) {
        query = query.ilike('caption', `%${search}%`);
      }

      const { data } = await query;
      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  }, [feedFilter, category, search, user]);

  // fetchPosts is memoized with useCallback; this effect intentionally loads posts when filters change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!user) return;
    supabase.from('fitbuddy_post_likes').select('post_id').eq('user_id', user.id)
      .then(({ data }) => setLikedIds(new Set((data || []).map((d) => d.post_id))));
    supabase.from('fitbuddy_saved_posts').select('post_id').eq('user_id', user.id)
      .then(({ data }) => setSavedIds(new Set((data || []).map((d) => d.post_id))));
  }, [user]);

  async function toggleLike(postId) {
    if (!user) return;
    const liked = likedIds.has(postId);
    if (liked) {
      await supabase.from('fitbuddy_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedIds((prev) => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from('fitbuddy_post_likes').insert({ post_id: postId, user_id: user.id });
      setLikedIds((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  }

  async function toggleSave(postId) {
    if (!user) return;
    const saved = savedIds.has(postId);
    if (saved) {
      await supabase.from('fitbuddy_saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
      setSavedIds((prev) => { const s = new Set(prev); s.delete(postId); return s; });
    } else {
      await supabase.from('fitbuddy_saved_posts').insert({ post_id: postId, user_id: user.id });
      setSavedIds((prev) => new Set(prev).add(postId));
    }
  }

  function openMenu(e, post) {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuPost(post);
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function startEdit() {
    closeMenu();
    setEditForm({ title: menuPost.title || '', caption: menuPost.caption || '' });
    setEditOpen(true);
  }

  function startDelete() {
    closeMenu();
    setDeleteOpen(true);
  }

  async function handleEditPost() {
    if (!menuPost) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('fitbuddy_posts')
        .update({ title: editForm.title, caption: editForm.caption })
        .eq('id', menuPost.id)
        .eq('user_id', user.id);
      if (error) { setSnack({ open: true, msg: '수정에 실패했습니다.', severity: 'error' }); return; }
      setSnack({ open: true, msg: '게시글이 수정되었습니다.', severity: 'success' });
      setEditOpen(false);
      fetchPosts();
    } catch {
      setSnack({ open: true, msg: '오류가 발생했습니다.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeletePost() {
    if (!menuPost) return;
    setActionLoading(true);
    try {
      let query = supabase.from('fitbuddy_posts').delete().eq('id', menuPost.id);
      if (!isAdmin) query = query.eq('user_id', user.id);
      const { error } = await query;
      if (error) { setSnack({ open: true, msg: '삭제에 실패했습니다.', severity: 'error' }); return; }
      setSnack({ open: true, msg: '게시글이 삭제되었습니다.', severity: 'info' });
      setDeleteOpen(false);
      setPosts((prev) => prev.filter((p) => p.id !== menuPost.id));
      setMenuPost(null);
    } catch {
      setSnack({ open: true, msg: '오류가 발생했습니다.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  const typeLabel = { workout: '운동', diet: '식단', free: '자유' };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} size='small' sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='h2' sx={{ fontWeight: 700 }}>피드 🏋️</Typography>
        </Box>

        {/* 검색 */}
        <TextField
          fullWidth
          placeholder='게시글 검색...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size='small'
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment> } }}
        />

        {/* 피드 필터 - 전체 / 내 게시글 / 저장한 글 */}
        <FilterChipGroup
          options={FEED_FILTER_OPTIONS}
          value={feedFilter}
          onChange={setFeedFilter}
          sx={{ mb: 2 }}
        />

        {/* 카테고리 필터 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 0.5 }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              onClick={() => setCategory(c)}
              color={category === c ? 'primary' : 'default'}
              variant={category === c ? 'filled' : 'outlined'}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>

        {/* 게시글 목록 */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Skeleton variant='circular' width={40} height={40} />
                  <Box sx={{ flex: 1 }}><Skeleton width='60%' /><Skeleton width='40%' /></Box>
                </Box>
                <Skeleton variant='rectangular' height={200} sx={{ borderRadius: 2 }} />
              </CardContent>
            </Card>
          ))
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '3rem' }}>🏋️</Typography>
            <Typography color='text.secondary'>아직 게시글이 없습니다</Typography>
            <Typography variant='body2' color='text.secondary'>첫 번째 운동 기록을 공유해보세요!</Typography>
          </Box>
        ) : (
          posts.map((post) => (
            <Card key={post.id} sx={{ mb: 2, cursor: 'pointer' }}>
              <CardContent sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {post.fitbuddy_users?.display_name?.[0] || 'F'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h4' sx={{ fontWeight: 600 }}>
                      {post.fitbuddy_users?.display_name || '사용자'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </Typography>
                  </Box>
                  <Chip label={typeLabel[post.post_type] || post.post_type} size='small' color='primary' variant='outlined' />
                  {(post.user_id === user?.id || isAdmin) && (
                    <IconButton size='small' onClick={(e) => openMenu(e, post)} sx={{ p: 0.3 }}>
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>

                {post.title && (
                  <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>{post.title}</Typography>
                )}
              </CardContent>

              {post.image_url && (
                <CardMedia
                  component='img'
                  image={post.image_url}
                  alt={post.title}
                  sx={{ maxHeight: 300, objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => navigate(`/post/${post.id}`)}
                />
              )}

              <CardContent sx={{ pt: 1, pb: 0 }} onClick={() => navigate(`/post/${post.id}`)}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  {post.caption?.length > 80 ? post.caption.slice(0, 80) + '...' : post.caption}
                </Typography>
                {post.hashtags?.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {post.hashtags.map((tag) => (
                      <Typography key={tag} variant='caption' sx={{ color: 'secondary.main' }}>#{tag}</Typography>
                    ))}
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ px: 2, py: 1 }}>
                <IconButton size='small' onClick={() => toggleLike(post.id)}>
                  {likedIds.has(post.id)
                    ? <FavoriteIcon sx={{ color: 'red', fontSize: 20 }} />
                    : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
                </IconButton>
                <Typography variant='caption' sx={{ mr: 1 }}>{post.likes_count || 0}</Typography>
                <IconButton size='small' onClick={() => navigate(`/post/${post.id}`)}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant='caption' sx={{ mr: 1 }}>{post.comments_count || 0}</Typography>
                <VisibilityIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant='caption' sx={{ ml: 0.5 }}>{post.views_count || 0}</Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton size='small' onClick={() => toggleSave(post.id)}>
                  {savedIds.has(post.id)
                    ? <BookmarkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    : <BookmarkBorderIcon sx={{ fontSize: 20 }} />}
                </IconButton>
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      {/* 컨텍스트 메뉴 */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {menuPost?.user_id === user?.id && (
          <MenuItem onClick={startEdit}>✏️ 수정하기</MenuItem>
        )}
        {(menuPost?.user_id === user?.id || isAdmin) && (
          <MenuItem onClick={startDelete} sx={{ color: 'error.main' }}>🗑️ 삭제하기</MenuItem>
        )}
      </Menu>

      {/* 게시글 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>게시글 수정</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label='제목' value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} fullWidth size='small' />
          <TextField label='내용' value={editForm.caption} onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })} fullWidth multiline rows={4} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>취소</Button>
          <Button variant='contained' onClick={handleEditPost} disabled={actionLoading} sx={{ bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
            {actionLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onClose={() => !actionLoading && setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🗑️</Typography>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>정말 삭제하시겠습니까?</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>이 작업은 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeleteOpen(false)} disabled={actionLoading}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={handleDeletePost} disabled={actionLoading}>
            {actionLoading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>{snack.msg}</Alert>
      </Snackbar>

      {/* FAB */}
      <Fab
        color='primary'
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => navigate('/create')}
      >
        <AddIcon />
      </Fab>
    </Layout>
  );
}
