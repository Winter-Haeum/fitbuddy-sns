import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const WORKOUT_TYPES = ['홈트', '러닝', '헬스', '요가', '필라테스', '수영', '자전거', '등산', '기타'];
const INTENSITIES = [{ value: 'low', label: '낮음' }, { value: 'medium', label: '보통' }, { value: 'high', label: '높음' }];

const CALORIES_PER_MINUTE = { low: 4, medium: 7, high: 10 };

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600',
];

export default function PostCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postType, setPostType] = useState('workout');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [workoutType, setWorkoutType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const calories = duration && intensity ? Math.round(Number(duration) * CALORIES_PER_MINUTE[intensity]) : 0;

  function addHashtag() {
    const tag = hashtagInput.trim().replace('#', '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput('');
  }

  async function handleSubmit() {
    if (!caption.trim()) { setError('내용을 입력해주세요.'); return; }
    if (!user) { setError('로그인이 필요합니다.'); return; }
    setLoading(true);
    setError('');

    try {
      let workoutId = null;

      if (postType === 'workout' && workoutType && duration) {
        const { data: workout } = await supabase
          .from('fitbuddy_workouts')
          .insert({
            user_id: user.id,
            workout_type: workoutType,
            duration_minutes: Number(duration),
            intensity,
            calories_burned: calories,
          })
          .select()
          .single();
        workoutId = workout?.id;
      }

      await supabase.from('fitbuddy_posts').insert({
        user_id: user.id,
        post_type: postType,
        title,
        caption,
        image_url: imageUrl,
        workout_id: workoutId,
        hashtags,
      });

      navigate('/feed');
    } catch (err) {
      setError('게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
          <Typography variant='h3' sx={{ fontWeight: 600, ml: 1 }}>게시글 작성</Typography>
          <Button
            variant='contained'
            size='small'
            onClick={handleSubmit}
            disabled={loading}
            sx={{ ml: 'auto', background: 'linear-gradient(90deg, #6BCB77, #5DA9E9)' }}
          >
            {loading ? '등록 중...' : '등록'}
          </Button>
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

        {/* 게시글 유형 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>게시글 유형</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[['workout', '🏋️ 운동'], ['diet', '🥗 식단'], ['free', '💬 자유']].map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  onClick={() => setPostType(value)}
                  color={postType === value ? 'primary' : 'default'}
                  variant={postType === value ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* 운동 정보 (운동 유형일 때만) */}
        {postType === 'workout' && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>운동 정보</Typography>
              <FormControl fullWidth size='small'>
                <InputLabel>운동 종류</InputLabel>
                <Select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} label='운동 종류'>
                  {WORKOUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label='운동 시간 (분)'
                  type='number'
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  size='small'
                  sx={{ flex: 1 }}
                />
                <FormControl size='small' sx={{ flex: 1 }}>
                  <InputLabel>강도</InputLabel>
                  <Select value={intensity} onChange={(e) => setIntensity(e.target.value)} label='강도'>
                    {INTENSITIES.map((i) => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              {calories > 0 && (
                <Typography variant='body2' color='primary.main' sx={{ fontWeight: 600 }}>
                  🔥 예상 소모 칼로리: {calories} kcal
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* 내용 */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label='제목 (선택사항)'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size='small'
            />
            <TextField
              label='내용을 입력하세요...'
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              fullWidth
              multiline
              rows={5}
              required
            />
          </CardContent>
        </Card>

        {/* 이미지 선택 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>이미지 선택</Typography>
              <IconButton size='small' onClick={() => setShowImagePicker(!showImagePicker)}>
                <ImageIcon />
              </IconButton>
            </Box>
            {imageUrl && (
              <Box
                component='img'
                src={imageUrl}
                alt='선택된 이미지'
                sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 2, mb: 1 }}
              />
            )}
            {showImagePicker && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {SAMPLE_IMAGES.map((url) => (
                  <Box
                    key={url}
                    component='img'
                    src={url}
                    alt='샘플'
                    onClick={() => { setImageUrl(url); setShowImagePicker(false); }}
                    sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: imageUrl === url ? '3px solid #6BCB77' : '3px solid transparent' }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 해시태그 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>해시태그</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                placeholder='#태그 입력'
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                size='small'
                sx={{ flex: 1 }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
              />
              <IconButton onClick={addHashtag} color='primary'><AddIcon /></IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {hashtags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size='small'
                  onDelete={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
                  color='secondary'
                  variant='outlined'
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}
