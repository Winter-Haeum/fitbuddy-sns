import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import { getLocalToday } from '../utils/date-utils';
import Layout from '../components/common/layout';

const MEAL_TYPES = [
  { value: 'breakfast', label: '아침 🌅' },
  { value: 'lunch', label: '점심 ☀️' },
  { value: 'dinner', label: '저녁 🌙' },
  { value: 'snack', label: '간식 🍎' },
];

const SAMPLE_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
];

// created_at(UTC timestamptz)을 기기 로컬 날짜(YYYY-MM-DD)로 변환해 오늘 여부를 판단한다.
// 문자열 startsWith 비교는 UTC로 반환되는 created_at과 로컬 날짜 형식이 어긋나므로 사용하지 않는다.
function isLocalToday(isoString, todayLocal) {
  if (!isoString) return false;
  const d = new Date(isoString);
  const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return localDateStr === todayLocal;
}

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ meal_type: 'breakfast', content: '', image_url: '', calories: '' });
  const [showImgPicker, setShowImgPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchMeals(); }, []);

  async function fetchMeals() {
    const { data } = await supabase
      .from('fitbuddy_meals')
      .select('*, fitbuddy_users(display_name)')
      .order('created_at', { ascending: false })
      .limit(30);
    setMeals(data || []);
  }

  async function handleAdd() {
    if (!form.content.trim()) return;
    setLoading(true);
    const payload = {
      user_id: user.id,
      meal_type: form.meal_type,
      content: form.content,
      image_url: form.image_url,
      calories: Number(form.calories) || 0,
    };
    setError('');
    try {
      const { error: insertErr } = await supabase
        .from('fitbuddy_meals')
        .insert(payload);
      if (insertErr) {
        setError('저장에 실패했습니다.');
        return;
      }
      setOpen(false);
      setForm({ meal_type: 'breakfast', content: '', image_url: '', calories: '' });
      fetchMeals();
    } catch {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const todayLocal = getLocalToday();
  const todayCalories = meals
    .filter((m) => m.user_id === user?.id && isLocalToday(m.created_at, todayLocal))
    .reduce((sum, m) => sum + (m.calories || 0), 0);

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>식단 공유 🥗</Typography>

        {/* 오늘 칼로리 요약 */}
        <Card sx={{ mb: 2, bgcolor: '#FF7043', color: 'white' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalFireDepartmentIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant='body2' sx={{ opacity: 0.85 }}>오늘 총 섭취 칼로리</Typography>
              <Typography variant='h2' sx={{ fontWeight: 700 }}>{todayCalories} kcal</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* 식단 목록 */}
        {meals.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <RestaurantIcon sx={{ fontSize: 60, color: '#e0e0e0' }} />
            <Typography color='text.secondary'>아직 식단 기록이 없습니다</Typography>
            <Typography variant='body2' color='text.secondary'>첫 번째 식단을 공유해보세요!</Typography>
          </Box>
        ) : (
          meals.map((meal) => {
            const mealLabel = MEAL_TYPES.find((t) => t.value === meal.meal_type)?.label || meal.meal_type;
            return (
              <Card key={meal.id} sx={{ mb: 2 }}>
                {meal.image_url && (
                  <CardMedia component='img' image={meal.image_url} alt='식단' sx={{ height: 200, objectFit: 'cover' }} />
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={mealLabel} size='small' color='warning' />
                    <Typography variant='caption' color='text.secondary'>
                      {meal.fitbuddy_users?.display_name} · {new Date(meal.created_at).toLocaleDateString('ko-KR')}
                    </Typography>
                    {meal.calories > 0 && (
                      <Chip
                        icon={<LocalFireDepartmentIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${meal.calories}kcal`}
                        size='small'
                        variant='outlined'
                        color='error'
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                  <Typography variant='body2'>{meal.content}</Typography>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      {/* FAB — bottom:80은 Android 15+ edge-to-edge에서 system navigation bar를 고려하지
          못했다. env(safe-area-inset-bottom)만큼 더 띄운다(Home/Feed/Records/Challenges와 동일). */}
      <Fab
        color='primary'
        sx={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', right: 16, bgcolor: '#FF7043', '&:hover': { bgcolor: '#E55C2F' } }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 식단 추가 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>식단 기록 추가 🥗</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity='error'>{error}</Alert>}
          <FormControl fullWidth size='small'>
            <InputLabel>식사 유형</InputLabel>
            <Select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} label='식사 유형'>
              {MEAL_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label='식단 내용'
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label='칼로리 (kcal)'
            type='number'
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            fullWidth
            size='small'
          />
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>이미지 선택</Typography>
            <Button variant='outlined' size='small' onClick={() => setShowImgPicker(!showImgPicker)}>
              이미지 선택
            </Button>
            {form.image_url && (
              <Box component='img' src={form.image_url} alt='선택 이미지' sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 2, mt: 1 }} />
            )}
            {showImgPicker && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mt: 1 }}>
                {SAMPLE_FOOD_IMAGES.map((url) => (
                  <Box
                    key={url}
                    component='img'
                    src={url}
                    alt='식단'
                    onClick={() => { setForm({ ...form, image_url: url }); setShowImgPicker(false); }}
                    sx={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: form.image_url === url ? '3px solid #6BCB77' : '3px solid transparent' }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant='contained' onClick={handleAdd} disabled={loading} sx={{ bgcolor: '#FF7043', '&:hover': { bgcolor: '#E55C2F' } }}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
