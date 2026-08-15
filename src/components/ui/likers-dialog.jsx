import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { supabase } from '../../utils/supabase';

/**
 * LikersDialog - 게시글에 좋아요를 누른 사용자 목록 모달
 *
 * Props:
 * @param {boolean} open - 모달 열림 여부 [Required]
 * @param {function} onClose - 모달 닫기 콜백 [Required]
 * @param {string|number} postId - 좋아요 목록을 조회할 게시글 id [Required]
 *
 * Example usage:
 * <LikersDialog open={likersOpen} onClose={() => setLikersOpen(false)} postId={id} />
 */
export default function LikersDialog({ open, onClose, postId }) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;

    async function fetchLikers() {
      setLoading(true);
      setError(false);
      try {
        const { data, error: fetchError } = await supabase
          .from('fitbuddy_post_likes')
          .select('user_id, fitbuddy_users(display_name, username, avatar_url)')
          .eq('post_id', postId);
        if (cancelled) return;
        if (fetchError) {
          setError(true);
          setLikers([]);
          return;
        }
        setLikers((data || []).filter((row) => row.fitbuddy_users));
      } catch {
        if (!cancelled) {
          setError(true);
          setLikers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLikers();
    return () => { cancelled = true; };
  }, [open, postId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>좋아요 누른 사람</DialogTitle>
      <DialogContent sx={{ minHeight: 120 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Typography color='text.secondary' sx={{ textAlign: 'center', py: 3 }}>
            목록을 불러오지 못했습니다.
          </Typography>
        ) : likers.length === 0 ? (
          <Typography color='text.secondary' sx={{ textAlign: 'center', py: 3 }}>
            아직 좋아요가 없습니다.
          </Typography>
        ) : (
          <List disablePadding>
            {likers.map((row) => (
              <ListItem key={row.user_id} disableGutters>
                <ListItemAvatar>
                  <Avatar src={row.fitbuddy_users.avatar_url} sx={{ bgcolor: 'primary.main' }}>
                    {row.fitbuddy_users.display_name?.[0] || 'F'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={row.fitbuddy_users.display_name || '사용자'}
                  secondary={row.fitbuddy_users.username ? `@${row.fitbuddy_users.username}` : null}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
