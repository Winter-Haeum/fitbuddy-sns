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
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const WORKOUT_TYPES = ['홈트', '러닝', '헬스', '요가', '필라테스', '수영', '자전거', '등산', '기타'];
const INTENSITIES = [
  { value: 'low', label: '낮음', cal: 4 },
  { value: 'medium', label: '보통', cal: 7 },
  { value: 'high', label: '높음', cal: 10 },
];

const CALORIES_PER_MINUTE = { low: 4, medium: 7, high: 10 };

/** Unsplash 큐레이션 피트니스 이미지 세트 */
const UNSPLASH_FITNESS_IMAGES = [
  { id: 'NK0A6ZjGXaE', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', author: 'Jonathan Borba', author_url: 'https://unsplash.com/@jonathanborba', category: '헬스' },
  { id: 'lrQPTQs7nQQ', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', author: 'Danielle Cerullo', author_url: 'https://unsplash.com/@daniellece', category: '헬스' },
  { id: 'WUehAgqO5hE', url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600', author: 'Anastase Maragos', author_url: 'https://unsplash.com/@anastasemaragos', category: '헬스' },
  { id: 'GORGkFLbhig', url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600', author: 'Arthur Edelmans', author_url: 'https://unsplash.com/@arthuredelmans', category: '헬스' },
  { id: 'q2Fyzn-KJOQ', url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600', author: 'Victor Freitas', author_url: 'https://unsplash.com/@victorfreitas', category: '헬스' },
  { id: 'rtn-YFJ4k48', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600', author: 'Karsten Winegeart', author_url: 'https://unsplash.com/@karstenwinegeart', category: '러닝' },
  { id: 'TWoL-QCZubY', url: 'https://images.unsplash.com/photo-1483721310020-03333cf5d539?w=600', author: 'Gabin Vallet', author_url: 'https://unsplash.com/@gabinvallet', category: '러닝' },
  { id: 'Nt3pXKVBaHM', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600', author: 'Fitsum Admasu', author_url: 'https://unsplash.com/@fitmasu', category: '러닝' },
  { id: '8NpOf6sRPHc', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600', author: 'Kelly Sikkema', author_url: 'https://unsplash.com/@kellysikkema', category: '요가' },
  { id: 'F2qh3yjz6Jk', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600', author: 'Jared Rice', author_url: 'https://unsplash.com/@jareddrice', category: '요가' },
  { id: 'FxU8KV7psMY', url: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600', author: 'Oksana Taran', author_url: 'https://unsplash.com/@oksanataran', category: '홈트' },
  { id: 'iy_MT2ifklc', url: 'https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=600', author: 'ŞULE MAKAROĞLU', author_url: 'https://unsplash.com/@sulemak', category: '홈트' },
];

const UNSPLASH_CATEGORIES = ['전체', '헬스', '러닝', '요가', '홈트'];

export default function PostCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [postType, setPostType] = useState('workout');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [workoutType, setWorkoutType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미지 관련 상태
  const [imageTab, setImageTab] = useState(0); // 0: Unsplash, 1: URL 직접입력
  const [selectedImage, setSelectedImage] = useState(null); // { url, source, id, author, author_url }
  const [unsplashCategory, setUnsplashCategory] = useState('전체');
  const [customUrl, setCustomUrl] = useState('');

  const calories = duration && intensity
    ? Math.round(Number(duration) * CALORIES_PER_MINUTE[intensity])
    : 0;

  const filteredImages = unsplashCategory === '전체'
    ? UNSPLASH_FITNESS_IMAGES
    : UNSPLASH_FITNESS_IMAGES.filter((img) => img.category === unsplashCategory);

  function selectUnsplashImage(img) {
    setSelectedImage({ url: img.url, source: 'unsplash', id: img.id, author: img.author, author_url: img.author_url });
  }

  function selectRandomUnsplash() {
    const pool = filteredImages;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    selectUnsplashImage(pick);
  }

  function applyCustomUrl() {
    if (customUrl.trim()) {
      setSelectedImage({ url: customUrl.trim(), source: 'upload', id: '', author: '', author_url: '' });
    }
  }

  function clearImage() {
    setSelectedImage(null);
    setCustomUrl('');
  }

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

    const postPayload = {
      user_id: user.id,
      post_type: postType,
      title,
      caption,
      image_url: selectedImage?.url || '',
      image_source: selectedImage?.source || 'upload',
      unsplash_image_id: selectedImage?.id || '',
      unsplash_author: selectedImage?.author || '',
      unsplash_author_url: selectedImage?.author_url || '',
      hashtags,
    };
    setLoading(true);
    setError('');
    console.log('SAVE START:', postPayload);

    try {
      let workoutId = null;

      if (postType === 'workout' && workoutType && duration) {
        const workoutPayload = {
          user_id: user.id,
          workout_type: workoutType,
          duration_minutes: Number(duration),
          intensity,
          calories_burned: calories,
          workout_date: new Date().toISOString().split('T')[0],
          workout_status: 'completed',
        };
        console.log('WORKOUT SAVE START:', workoutPayload);
        const { data: workoutData, error: workoutErr } = await supabase
          .from('fitbuddy_workouts')
          .insert(workoutPayload)
          .select('id')
          .single();
        console.log('INSERT ERROR (workout):', workoutErr);
        if (workoutErr) {
          console.error('SUPABASE ERROR (workout):', workoutErr);
        } else if (workoutData) {
          workoutId = workoutData.id;
        }
      }

      const finalPayload = { ...postPayload, workout_id: workoutId };
      const { error: postErr } = await supabase
        .from('fitbuddy_posts')
        .insert(finalPayload);
      console.log('INSERT ERROR (post):', postErr);
      if (postErr) {
        console.error('SUPABASE ERROR:', postErr);
        alert('게시글 저장 실패: ' + postErr.message);
        setError('게시글 저장에 실패했습니다: ' + postErr.message);
        return;
      }
      console.log('게시글 저장 성공');
      navigate('/feed');
    } catch (err) {
      console.error('예상 못한 오류:', err);
      alert('오류: ' + err.message);
      setError('게시글 작성에 실패했습니다.');
    } finally {
      console.log('SAVE FINALLY');
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
            sx={{ ml: 'auto', bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }}
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

        {/* 내용 입력 */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ImageIcon sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant='body2' sx={{ fontWeight: 600 }}>이미지 선택</Typography>
              {selectedImage && (
                <Button size='small' color='error' onClick={clearImage} sx={{ ml: 'auto' }}>
                  제거
                </Button>
              )}
            </Box>

            {/* 선택된 이미지 미리보기 */}
            {selectedImage && (
              <Box sx={{ mb: 2, position: 'relative' }}>
                <Box
                  component='img'
                  src={selectedImage.url}
                  alt='선택 이미지'
                  sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 2 }}
                />
                {selectedImage.source === 'unsplash' && selectedImage.author && (
                  <Box
                    sx={{
                      position: 'absolute', bottom: 6, right: 6,
                      bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                      borderRadius: 1, px: 1, py: 0.3, display: 'flex', alignItems: 'center', gap: 0.5,
                    }}
                  >
                    <Typography variant='caption'>Photo by {selectedImage.author} / Unsplash</Typography>
                    <Tooltip title='Unsplash에서 보기'>
                      <IconButton
                        size='small'
                        component='a'
                        href={selectedImage.author_url}
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

            {/* 탭: Unsplash / URL 직접입력 */}
            <Tabs
              value={imageTab}
              onChange={(_, v) => setImageTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}
            >
              <Tab label='Unsplash 이미지' sx={{ fontSize: '0.8rem', minHeight: 36 }} />
              <Tab label='URL 직접 입력' sx={{ fontSize: '0.8rem', minHeight: 36 }} />
            </Tabs>

            {/* Unsplash 피커 */}
            {imageTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, overflowX: 'auto', pb: 0.5 }}>
                  {UNSPLASH_CATEGORIES.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      size='small'
                      onClick={() => setUnsplashCategory(cat)}
                      color={unsplashCategory === cat ? 'primary' : 'default'}
                      variant={unsplashCategory === cat ? 'filled' : 'outlined'}
                      sx={{ flexShrink: 0 }}
                    />
                  ))}
                  <Button
                    size='small'
                    startIcon={<ShuffleIcon />}
                    onClick={selectRandomUnsplash}
                    variant='outlined'
                    color='secondary'
                    sx={{ flexShrink: 0, ml: 'auto' }}
                  >
                    랜덤
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {filteredImages.map((img) => (
                    <Box
                      key={img.id}
                      onClick={() => selectUnsplashImage(img)}
                      sx={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImage?.id === img.id ? '3px solid #6BCB77' : '3px solid transparent',
                        transition: 'border-color 0.2s',
                        '&:hover': { opacity: 0.85 },
                      }}
                    >
                      <Box
                        component='img'
                        src={img.url}
                        alt={img.category}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {selectedImage?.id === img.id && (
                        <Box sx={{
                          position: 'absolute', inset: 0,
                          bgcolor: 'rgba(107,203,119,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>✓</Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>

                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                  Photos from{' '}
                  <Box component='a' href='https://unsplash.com' target='_blank' sx={{ color: 'secondary.main' }}>
                    Unsplash
                  </Box>
                </Typography>
              </Box>
            )}

            {/* URL 직접 입력 */}
            {imageTab === 1 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder='이미지 URL 입력...'
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  size='small'
                  fullWidth
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCustomUrl(); } }}
                />
                <Button variant='outlined' onClick={applyCustomUrl} sx={{ flexShrink: 0 }}>적용</Button>
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
                placeholder='#태그 입력 후 Enter'
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
