import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';
import LikersDialog from '../components/ui/likers-dialog';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likersOpen, setLikersOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletePostOpen, setDeletePostOpen] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const viewedPostIdRef = useRef(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
    if (user) { checkLiked(); checkSaved(); }
  // fetchPost/fetchComments/checkLiked/checkSaved intentionally re-run when user resolves after loading;
  // view-count increment is handled separately below with its own once-per-post guard.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    if (!post || viewedPostIdRef.current === post.id) return;
    viewedPostIdRef.current = post.id;
    if (user && post.user_id === user.id) return;
    incrementViews();
  // Guarded by viewedPostIdRef so a single visit increments at most once per post id,
  // and the author's own view is excluded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, user]);

  async function fetchPost() {
    const { data } = await supabase
      .from('fitbuddy_posts')
      .select('*, fitbuddy_users(display_name, avatar_url, username, role), fitbuddy_workouts(workout_type, duration_minutes, calories_burned)')
      .eq('id', id)
      .maybeSingle();
    setPost(data);
    setLoading(false);
  }

  async function incrementViews() {
    const { data, error } = await supabase.rpc('fitbuddy_increment_views', { p_post_id: Number(id) });
    if (error) {
      console.error('[incrementViews] error:', error);
      return;
    }
    // RETURNS TABLE(incremented, views_count) → PostgREST가 배열로 반환하므로 첫 행만 사용.
    // incremented=false(이미 조회함/작성자 본인/비로그인)도 정상 결과이며, DB가 반환한 views_count를 그대로 반영한다(로컬 +1 계산 금지).
    const result = Array.isArray(data) ? data[0] : data;
    if (result && typeof result.views_count === 'number') {
      setPost((prev) => (prev ? { ...prev, views_count: result.views_count } : prev));
    }
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('fitbuddy_comments')
      .select('*, fitbuddy_users(display_name, avatar_url, role)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    setComments(data || []);
  }

  async function checkLiked() {
    const { data } = await supabase
      .from('fitbuddy_post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    setLiked(!!data);
  }

  async function toggleLike() {
    if (!user) return;
    if (liked) {
      await supabase.from('fitbuddy_post_likes').delete().eq('post_id', id).eq('user_id', user.id);
      setPost((p) => ({ ...p, likes_count: p.likes_count - 1 }));
    } else {
      await supabase.from('fitbuddy_post_likes').insert({ post_id: id, user_id: user.id });
      setPost((p) => ({ ...p, likes_count: p.likes_count + 1 }));
    }
    setLiked(!liked);
  }

  async function checkSaved() {
    const { data } = await supabase
      .from('fitbuddy_saved_posts')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    setSaved(!!data);
  }

  // 피드(feed-page.jsx)의 toggleSave와 동일한 fitbuddy_saved_posts 쿼리 패턴을 재사용.
  async function toggleSave() {
    if (!user) return;
    if (saved) {
      await supabase.from('fitbuddy_saved_posts').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      await supabase.from('fitbuddy_saved_posts').insert({ post_id: id, user_id: user.id });
    }
    setSaved(!saved);
  }

  async function handleShare() {
    const shareData = {
      title: post?.title || 'FitBuddy',
      text: post?.caption ? post.caption.slice(0, 100) : undefined,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // 사용자가 공유 시트를 취소한 경우(AbortError)는 정상 흐름이므로 조용히 무시한다.
        if (err?.name !== 'AbortError') console.error('[handleShare] error:', err);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSnack({ open: true, msg: '링크를 복사했습니다.', severity: 'success' });
    } catch (err) {
      console.error('[handleShare] clipboard error:', err);
    }
  }

  async function submitComment() {
    if (!comment.trim() || !user || commentLoading) return;
    setCommentLoading(true);
    try {
      await supabase.from('fitbuddy_comments').insert({ post_id: id, user_id: user.id, content: comment.trim() });
      setComment('');
      fetchComments();
    } finally {
      setCommentLoading(false);
    }
  }

  async function deletePost() {
    let query = supabase.from('fitbuddy_posts').delete().eq('id', id);
    if (!isAdmin) query = query.eq('user_id', user.id);
    const { error } = await query;
    if (error) {
      setSnack({ open: true, msg: '삭제 실패: ' + error.message, severity: 'error' });
      setDeletePostOpen(false);
      return;
    }
    navigate('/feed');
  }

  async function deleteComment(commentId) {
    let query = supabase.from('fitbuddy_comments').delete().eq('id', commentId);
    if (!isAdmin) query = query.eq('user_id', user.id);
    const { error } = await query;
    if (error) {
      setSnack({ open: true, msg: '삭제 실패: ' + error.message, severity: 'error' });
      setDeleteCommentTarget(null);
      return;
    }
    setDeleteCommentTarget(null);
    fetchComments();
  }

  const canDeletePost = user && (user.id === post?.user_id || isAdmin);
  const canEditPost = user && user.id === post?.user_id;

  if (loading) return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    </Layout>
  );

  if (!post) return (
    <Layout>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>게시글을 찾을 수 없습니다.</Typography>
        <Button onClick={() => navigate('/feed')}>피드로 돌아가기</Button>
      </Box>
    </Layout>
  );

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
          <Typography variant='h3' sx={{ fontWeight: 600, ml: 1 }}>게시글</Typography>
          {isAdmin && (
            <Chip label='관리자' size='small' color='error' sx={{ ml: 1 }} />
          )}
          {canEditPost && (
            <IconButton
              onClick={() => navigate('/create', { state: { mode: 'edit', postId: post.id } })}
              sx={{ ml: 'auto', color: 'text.secondary' }}
            >
              <EditIcon />
            </IconButton>
          )}
          {canDeletePost && (
            <IconButton onClick={() => setDeletePostOpen(true)} sx={{ ml: canEditPost ? 0 : 'auto', color: 'error.main' }}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        {/* 게시글 카드 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {post.fitbuddy_users?.display_name?.[0] || 'F'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant='h4' sx={{ fontWeight: 600 }}>
                    {post.fitbuddy_users?.display_name}
                  </Typography>
                  {post.fitbuddy_users?.role === 'admin' && (
                    <Chip label='관리자' size='small' color='error' sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {new Date(post.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Typography>
              </Box>
              {/* 조회수 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary' }}>
                <VisibilityIcon sx={{ fontSize: 14 }} />
                <Typography variant='caption'>{post.views_count || 0}</Typography>
              </Box>
            </Box>

            {post.title && (
              <Typography variant='h3' sx={{ fontWeight: 700, mb: 1 }}>{post.title}</Typography>
            )}
          </CardContent>

          {/* 이미지 */}
          {post.image_url && (
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component='img'
                image={post.image_url}
                alt={post.title}
                sx={{ maxHeight: 400, objectFit: 'cover' }}
              />
              {/* Unsplash 출처 표시 */}
              {post.image_source === 'unsplash' && post.unsplash_author && (
                <Box
                  sx={{
                    position: 'absolute', bottom: 6, right: 6,
                    bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                    borderRadius: 1, px: 1, py: 0.3,
                    display: 'flex', alignItems: 'center', gap: 0.5,
                  }}
                >
                  <Typography variant='caption'>
                    Photo by {post.unsplash_author} / Unsplash
                  </Typography>
                  <Tooltip title='작가 페이지 열기'>
                    <IconButton
                      size='small'
                      component='a'
                      href={post.unsplash_author_url}
                      target='_blank'
                      sx={{ color: 'white', p: 0 }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}

          <CardContent>
            {/* 운동 정보 */}
            {post.fitbuddy_workouts && (
              <Card sx={{ bgcolor: '#E8F5E9', mb: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>🏋️ 운동 기록</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimerIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant='body2'>{post.fitbuddy_workouts.duration_minutes}분</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalFireDepartmentIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      <Typography variant='body2'>{post.fitbuddy_workouts.calories_burned}kcal</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Typography variant='body1' sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>{post.caption}</Typography>

            {post.hashtags?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {post.hashtags.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} size='small' variant='outlined' color='secondary' />
                ))}
              </Box>
            )}

            {/* 액션 버튼 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={toggleLike}>
                {liked ? <FavoriteIcon sx={{ color: 'red' }} /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography
                variant='body2'
                onClick={() => setLikersOpen(true)}
                sx={{ cursor: 'pointer' }}
              >
                {post.likes_count || 0}
              </Typography>
              <IconButton><ChatBubbleOutlineIcon /></IconButton>
              <Typography variant='body2'>{post.comments_count || 0}</Typography>
              <Box sx={{ flex: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <VisibilityIcon sx={{ fontSize: 16 }} />
                <Typography variant='caption'>{post.views_count || 0}</Typography>
              </Box>
              <IconButton onClick={toggleSave}>
                {saved ? <BookmarkIcon sx={{ color: 'primary.main' }} /> : <BookmarkBorderIcon />}
              </IconButton>
              <IconButton onClick={handleShare}><ShareIcon /></IconButton>
            </Box>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <Typography variant='h4' sx={{ fontWeight: 600, mb: 1.5 }}>댓글 {comments.length}</Typography>

        {user && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder='댓글을 입력하세요...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              size='small'
              multiline
              maxRows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            />
            <IconButton onClick={submitComment} color='primary' disabled={commentLoading} sx={{ alignSelf: 'flex-end' }}>
              <SendIcon />
            </IconButton>
          </Box>
        )}

        {comments.map((c) => {
          const canDeleteComment = user && (user.id === c.user_id || isAdmin);
          return (
            <Box key={c.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.85rem' }}>
                  {c.fitbuddy_users?.display_name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {c.fitbuddy_users?.display_name}
                    </Typography>
                    {c.fitbuddy_users?.role === 'admin' && (
                      <Chip label='관리자' size='small' color='error' sx={{ height: 16, fontSize: '0.6rem' }} />
                    )}
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </Typography>
                    {canDeleteComment && (
                      <IconButton
                        size='small'
                        onClick={() => setDeleteCommentTarget(c.id)}
                        sx={{ ml: 'auto', color: 'error.light', p: 0.3 }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant='body2'>{c.content}</Typography>
                </Box>
              </Box>
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          );
        })}
      </Box>

      <LikersDialog open={likersOpen} onClose={() => setLikersOpen(false)} postId={id} />

      {/* 게시글 삭제 확인 다이얼로그 */}
      <Dialog open={deletePostOpen} onClose={() => setDeletePostOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🗑️</Typography>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>게시글을 삭제하시겠습니까?</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>이 작업은 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeletePostOpen(false)}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={deletePost}>삭제</Button>
        </DialogActions>
      </Dialog>

      {/* 댓글 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteCommentTarget} onClose={() => setDeleteCommentTarget(null)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🗑️</Typography>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>댓글을 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeleteCommentTarget(null)}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={() => deleteComment(deleteCommentTarget)}>삭제</Button>
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
