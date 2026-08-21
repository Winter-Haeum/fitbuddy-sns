import { useState, useEffect, useCallback, useRef } from 'react';
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
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import FilterChipGroup from '../components/ui/filter-chip-group';
import LikersDialog from '../components/ui/likers-dialog';
import FadeInBox from '../components/ui/fade-in-box';

const CATEGORIES = ['전체', '운동', '식단', '자유'];
const PAGE_SIZE = 10;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState('전체');
  const [search, setSearch] = useState('');
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [likersPostId, setLikersPostId] = useState(null);
  const sentinelRef = useRef(null);

  const [feedFilter, setFeedFilter] = useState(() => {
    if (location.state?.feedFilter) return location.state.feedFilter;
    return location.state?.myPostsOnly ? 'mine' : 'all';
  });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPost, setMenuPost] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // 현재 필터/카테고리/검색어 기준으로 [from, to] 구간의 게시글만 서버에서 조회한다.
  const fetchPage = useCallback(async (from, to) => {
    if (feedFilter === 'saved') {
      const { data } = await supabase
        .from('fitbuddy_saved_posts')
        .select('fitbuddy_posts(*, fitbuddy_users(display_name, avatar_url, username))')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      return (data || []).map((d) => d.fitbuddy_posts).filter(Boolean);
    }

    let query = supabase
      .from('fitbuddy_posts')
      .select('*, fitbuddy_users(display_name, avatar_url, username)')
      .order('created_at', { ascending: false });

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

    const { data } = await query.range(from, to);
    return data || [];
  }, [feedFilter, category, search, user]);

  // 필터/카테고리/검색어가 바뀌면 첫 페이지부터 다시 조회한다(기존 목록 전체 교체).
  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPage(0, PAGE_SIZE - 1);
      setPosts(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // loadFirstPage is memoized with useCallback; this effect intentionally reloads when filters change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  // 다음 페이지를 서버에서 조회해 기존 목록 뒤에 이어 붙인다. 이미 로드된 id는 중복 추가하지 않는다.
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = posts.length;
      const rows = await fetchPage(from, from + PAGE_SIZE - 1);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...rows.filter((p) => !existingIds.has(p.id))];
      });
      setHasMore(rows.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, posts, fetchPage]);

  // 무한 스크롤: sentinel이 보이면 서버에서 다음 페이지를 조회한다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
    if (!menuPost) return;
    navigate('/create', { state: { mode: 'edit', postId: menuPost.id } });
  }

  function startDelete() {
    closeMenu();
    setDeleteOpen(true);
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
          {/* 페이지 제목이 "작게" 설정에서도 화면을 과도하게 차지한다는 피드백에 따라
              records-page.jsx/challenges-page.jsx와 동일하게 h2(1.5rem 기준)에서
              h3(1.25rem 기준)로 낮췄다 — body/caption 대비 제목 위계는 유지된다. */}
          <Typography variant='h3' sx={{ fontWeight: 700 }}>피드 🏋️</Typography>
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
            <Typography color='text.secondary'>
              {search.trim()
                ? '검색 결과가 없습니다'
                : category !== '전체'
                ? '해당 카테고리의 게시글이 없습니다'
                : feedFilter === 'saved'
                ? '저장한 글이 없습니다'
                : feedFilter === 'mine'
                ? '작성한 게시글이 없습니다'
                : '아직 게시글이 없습니다'}
            </Typography>
            {!search.trim() && category === '전체' && feedFilter === 'all' && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                첫 번째 운동 기록을 공유해보세요!
              </Typography>
            )}
          </Box>
        ) : (
          <>
            {posts.map((post, idx) => (
              <FadeInBox key={post.id} delay={Math.min(idx, 4) * 60}>
                <Card
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s ease, transform 0.1s ease',
                    '&:hover': { boxShadow: '0 2px 10px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
                  }}
                >
                  <CardContent sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {post.fitbuddy_users?.display_name?.[0] || 'F'}
                      </Avatar>
                      {/* 작성자 이름이 게시글 제목과 같은 h4를 써서 피드에서 제목보다 먼저
                          눈에 띄던 지점 — body1로 한 단계 낮춰 "제목/본문 > 작성자명" 위계로
                          정리했다(식별은 가능하되 더는 콘텐츠와 경쟁하지 않도록). */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
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
                    <Typography
                      variant='caption'
                      onClick={() => setLikersPostId(post.id)}
                      sx={{ mr: 1, cursor: 'pointer' }}
                    >
                      {post.likes_count || 0}
                    </Typography>
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
              </FadeInBox>
            ))}
            {hasMore && (
              <Box ref={sentinelRef} sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>불러오는 중...</Typography>
              </Box>
            )}
            {!hasMore && posts.length > 0 && (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>모든 게시글을 불러왔습니다</Typography>
              </Box>
            )}
          </>
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

      <LikersDialog
        open={!!likersPostId}
        onClose={() => setLikersPostId(null)}
        postId={likersPostId}
      />
    </Layout>
  );
}
