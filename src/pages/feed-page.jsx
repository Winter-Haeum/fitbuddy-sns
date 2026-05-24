import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const CATEGORIES = ['전체', '운동', '식단', '자유'];

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('전체');
  const [search, setSearch] = useState('');
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('fitbuddy_posts')
        .select('*, fitbuddy_users(display_name, avatar_url, username)')
        .order('created_at', { ascending: false })
        .limit(30);

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
  }, [category, search]);

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

  const typeLabel = { workout: '운동', diet: '식단', free: '자유' };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
          InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment> }}
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
