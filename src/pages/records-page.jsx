import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Fab from '@mui/material/Fab';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/use-auth';
import Layout from '../components/common/layout';

const MOODS = [
  { key: 'tired', emoji: '😴', label: '피곤', text: '피곤한 하루예요.' },
  { key: 'normal', emoji: '😐', label: '보통', text: '평범한 컨디션이에요.' },
  { key: 'good', emoji: '😊', label: '좋음', text: '오늘 컨디션이 좋아요.' },
  { key: 'great', emoji: '💪', label: '활기참', text: '에너지가 넘치는 날이에요.' },
];

const WORKOUT_TYPES = ['홈트', '스트레칭', '러닝', '헬스', '요가', '필라테스', '수영', '자전거', '등산', '기타'];
const INTENSITIES = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' },
];
const TAB_LIST = ['운동 기록', '운동 일기'];

export default function RecordsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState(location.state?.initialTab ?? 0);
  const [weekWorkouts, setWeekWorkouts] = useState([]);
  const [diaryLogs, setDiaryLogs] = useState([]);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [snack, setSnack] = useState(
    location.state?.saved
      ? { open: true, msg: '운동 기록이 저장되었습니다 💪', severity: 'success' }
      : { open: false, msg: '', severity: 'success' }
  );

  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryForm, setDiaryForm] = useState({ mood: '', content: '' });
  const [diaryLoading, setDiaryLoading] = useState(false);

  // 메뉴 & 수정/삭제 상태
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null); // { type: 'workout'|'diary', item }

  const [editWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [editWorkoutForm, setEditWorkoutForm] = useState({});
  const [editDiaryOpen, setEditDiaryOpen] = useState(false);
  const [editDiaryForm, setEditDiaryForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    await Promise.all([fetchWeekWorkouts(), fetchDiaryLogs(), fetchTodayWorkouts()]);
  }

  async function fetchWeekWorkouts() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const { data } = await supabase
        .from('fitbuddy_workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('workout_date', weekAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });
      setWeekWorkouts(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchDiaryLogs() {
    try {
      const { data } = await supabase
        .from('fitbuddy_daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);
      setDiaryLogs(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTodayWorkouts() {
    try {
      const { data } = await supabase
        .from('fitbuddy_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_date', today);
      setTodayWorkouts(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveDiary() {
    if (!diaryForm.mood && !diaryForm.content.trim()) return;
    setDiaryLoading(true);
    try {
      const upsertData = { user_id: user.id, log_date: today };
      if (diaryForm.mood) upsertData.mood_status = diaryForm.mood;
      if (diaryForm.content.trim()) upsertData.diary_content = diaryForm.content.trim();
      if (todayWorkouts.length > 0) {
        upsertData.auto_workout_summary = {
          count: todayWorkouts.length,
          duration: todayStats.duration,
          calories: todayStats.calories,
          types: [...new Set(todayWorkouts.map((w) => w.workout_type))],
        };
      }

      console.log('SAVE START:', upsertData);

      let { error } = await supabase
        .from('fitbuddy_daily_logs')
        .upsert(upsertData, { onConflict: 'user_id,log_date' });

      // auto_workout_summary 컬럼 없는 경우 fallback
      if (error && error.message?.includes('auto_workout_summary')) {
        delete upsertData.auto_workout_summary;
        const fallback = await supabase
          .from('fitbuddy_daily_logs')
          .upsert(upsertData, { onConflict: 'user_id,log_date' });
        error = fallback.error;
      }

      console.log('INSERT ERROR:', error);
      if (error) {
        console.error('SUPABASE ERROR:', error);
        alert('저장 실패: ' + error.message);
        setSnack({ open: true, msg: '저장 실패: ' + error.message, severity: 'error' });
      } else {
        console.log('일기 저장 성공');
        setSnack({ open: true, msg: '운동 일기가 저장되었습니다 📓', severity: 'success' });
        setDiaryOpen(false);
        setDiaryForm({ mood: '', content: '' });
        fetchDiaryLogs();
      }
    } catch (err) {
      console.error('예상 못한 오류:', err);
      alert('오류: ' + err.message);
      setSnack({ open: true, msg: '저장 중 오류가 발생했습니다.', severity: 'error' });
    } finally {
      setDiaryLoading(false);
    }
  }

  // ---- 메뉴 핸들러 ----
  function openMenu(e, type, item) {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuTarget({ type, item });
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function startEdit() {
    closeMenu();
    if (menuTarget.type === 'workout') {
      setEditWorkoutForm({
        workout_type: menuTarget.item.workout_type || '',
        duration_minutes: String(menuTarget.item.duration_minutes || ''),
        intensity: menuTarget.item.intensity || 'medium',
        calories_burned: String(menuTarget.item.calories_burned || ''),
      });
      setEditWorkoutOpen(true);
    } else {
      setEditDiaryForm({
        mood: menuTarget.item.mood_status || '',
        content: menuTarget.item.diary_content || '',
      });
      setEditDiaryOpen(true);
    }
  }

  function startDelete() {
    closeMenu();
    setDeleteOpen(true);
  }

  async function handleEditWorkout() {
    if (!menuTarget) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('fitbuddy_workouts')
        .update({
          workout_type: editWorkoutForm.workout_type,
          duration_minutes: Number(editWorkoutForm.duration_minutes),
          intensity: editWorkoutForm.intensity,
          calories_burned: Number(editWorkoutForm.calories_burned),
        })
        .eq('id', menuTarget.item.id)
        .eq('user_id', user.id);
      if (error) { alert('수정 실패: ' + error.message); return; }
      setSnack({ open: true, msg: '운동 기록이 수정되었습니다.', severity: 'success' });
      setEditWorkoutOpen(false);
      fetchWeekWorkouts();
      fetchTodayWorkouts();
    } catch (err) {
      alert('오류: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditDiary() {
    if (!menuTarget) return;
    setActionLoading(true);
    try {
      const updateData = {};
      if (editDiaryForm.mood) updateData.mood_status = editDiaryForm.mood;
      if (editDiaryForm.content !== undefined) updateData.diary_content = editDiaryForm.content;
      const { error } = await supabase
        .from('fitbuddy_daily_logs')
        .update(updateData)
        .eq('id', menuTarget.item.id)
        .eq('user_id', user.id);
      if (error) { alert('수정 실패: ' + error.message); return; }
      setSnack({ open: true, msg: '운동 일기가 수정되었습니다.', severity: 'success' });
      setEditDiaryOpen(false);
      fetchDiaryLogs();
    } catch (err) {
      alert('오류: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!menuTarget) return;
    setActionLoading(true);
    try {
      const table = menuTarget.type === 'workout' ? 'fitbuddy_workouts' : 'fitbuddy_daily_logs';
      const idField = menuTarget.type === 'workout' ? 'user_id' : 'user_id';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', menuTarget.item.id)
        .eq(idField, user.id);
      if (error) { alert('삭제 실패: ' + error.message); return; }
      setSnack({ open: true, msg: '삭제되었습니다.', severity: 'info' });
      setDeleteOpen(false);
      if (menuTarget.type === 'workout') { fetchWeekWorkouts(); fetchTodayWorkouts(); }
      else fetchDiaryLogs();
      setMenuTarget(null);
    } catch (err) {
      alert('오류: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function groupByDate(workouts) {
    const map = {};
    workouts.forEach((w) => {
      const date = w.workout_date;
      if (!map[date]) map[date] = [];
      map[date].push(w);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }

  const todayStats = todayWorkouts.reduce(
    (acc, w) => ({ duration: acc.duration + (w.duration_minutes || 0), calories: acc.calories + (w.calories_burned || 0) }),
    { duration: 0, calories: 0 }
  );

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant='h2' sx={{ fontWeight: 700, mb: 2 }}>기록관 📓</Typography>

        {/* 탭 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, borderBottom: '2px solid #EEE', pb: 1 }}>
          {TAB_LIST.map((t, i) => (
            <Button
              key={t}
              variant='text'
              onClick={() => setTab(i)}
              sx={{
                fontSize: '0.875rem', fontWeight: tab === i ? 700 : 400,
                color: tab === i ? '#5DA9E9' : 'text.secondary',
                borderBottom: tab === i ? '2px solid #5DA9E9' : '2px solid transparent',
                borderRadius: 0, pb: 0.5,
              }}
            >
              {t}
            </Button>
          ))}
        </Box>

        {/* 탭 0: 운동 기록 */}
        {tab === 0 && (
          <Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>최근 7일 운동 기록</Typography>
            {weekWorkouts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ fontSize: '3rem', mb: 1 }}>💪</Typography>
                <Typography color='text.secondary'>아직 운동 기록이 없습니다.</Typography>
                <Button variant='contained' onClick={() => navigate('/timer')} sx={{ mt: 2, bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
                  운동 시작하기
                </Button>
              </Box>
            ) : (
              groupByDate(weekWorkouts).map(([date, workouts]) => {
                const totalMin = workouts.reduce((s, w) => s + (w.duration_minutes || 0), 0);
                const totalCal = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
                const dateObj = new Date(date);
                const dayLabel = date === today ? '오늘' : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                return (
                  <Card key={date} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>{dayLabel}</Typography>
                        <Typography variant='caption' color='text.secondary'>{totalMin}분 · {totalCal}kcal</Typography>
                      </Box>
                      {workouts.map((w, i) => (
                        <Box key={w.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.8 }}>
                            <FitnessCenterIcon sx={{ fontSize: 16, color: '#6BCB77' }} />
                            <Typography variant='body2' sx={{ flex: 1 }}>{w.workout_type}</Typography>
                            <Typography variant='caption' color='text.secondary'>{w.duration_minutes}분 {w.calories_burned}kcal</Typography>
                            <IconButton size='small' onClick={(e) => openMenu(e, 'workout', w)} sx={{ p: 0.3 }}>
                              <MoreVertIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                          {i < workouts.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        )}

        {/* 탭 1: 운동 일기 */}
        {tab === 1 && (
          <Box>
            <Button
              variant='contained'
              fullWidth
              size='large'
              onClick={() => setDiaryOpen(true)}
              sx={{ mb: 2, bgcolor: '#5DA9E9', '&:hover': { bgcolor: '#4A96D8' } }}
            >
              ✍️ 운동 일기 쓰기
            </Button>

            {diaryLogs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ fontSize: '3rem', mb: 1 }}>📓</Typography>
                <Typography color='text.secondary'>아직 일기 기록이 없습니다.</Typography>
              </Box>
            ) : (
              diaryLogs.map((log) => {
                const mood = MOODS.find((m) => m.key === log.mood_status);
                const dateObj = new Date(log.log_date);
                const dayLabel = log.log_date === today
                  ? '오늘'
                  : `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]})`;
                return (
                  <Card key={log.id} sx={{ mb: 1.5 }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{mood?.emoji || '📓'}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Typography variant='body2' sx={{ fontWeight: 700 }}>{dayLabel}</Typography>
                            {mood && (
                              <Chip label={mood.text} size='small' sx={{ bgcolor: '#EDE7F6', color: '#6B4FC8', fontSize: '0.7rem' }} />
                            )}
                          </Box>
                          {log.diary_content ? (
                            <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                              {log.diary_content}
                            </Typography>
                          ) : (
                            <Typography variant='caption' color='text.secondary'>컨디션만 기록됨</Typography>
                          )}
                          {log.auto_workout_summary && (
                            <Box sx={{ mt: 0.8, px: 1, py: 0.5, bgcolor: '#E8F5E9', borderRadius: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <FitnessCenterIcon sx={{ fontSize: 12, color: '#4CAF50' }} />
                              <Typography variant='caption' sx={{ color: '#2E7D32', fontSize: '0.7rem' }}>
                                {log.auto_workout_summary.count}회 · {log.auto_workout_summary.duration}분 · {log.auto_workout_summary.calories}kcal
                                {log.auto_workout_summary.types?.length > 0 && ` (${log.auto_workout_summary.types.join(', ')})`}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <IconButton size='small' onClick={(e) => openMenu(e, 'diary', log)} sx={{ p: 0.3 }}>
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        )}
      </Box>

      {/* ⋯ 컨텍스트 메뉴 */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={startEdit}>✏️ 수정하기</MenuItem>
        <MenuItem onClick={startDelete} sx={{ color: 'error.main' }}>🗑️ 삭제하기</MenuItem>
      </Menu>

      {/* 운동 기록 수정 다이얼로그 */}
      <Dialog open={editWorkoutOpen} onClose={() => setEditWorkoutOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>운동 기록 수정</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>운동 종류</InputLabel>
            <Select value={editWorkoutForm.workout_type || ''} onChange={(e) => setEditWorkoutForm({ ...editWorkoutForm, workout_type: e.target.value })} label='운동 종류'>
              {WORKOUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size='small'>
            <InputLabel>강도</InputLabel>
            <Select value={editWorkoutForm.intensity || 'medium'} onChange={(e) => setEditWorkoutForm({ ...editWorkoutForm, intensity: e.target.value })} label='강도'>
              {INTENSITIES.map((i) => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label='운동 시간 (분)' type='number' value={editWorkoutForm.duration_minutes || ''} onChange={(e) => setEditWorkoutForm({ ...editWorkoutForm, duration_minutes: e.target.value })} fullWidth size='small' />
          <TextField label='소모 칼로리 (kcal)' type='number' value={editWorkoutForm.calories_burned || ''} onChange={(e) => setEditWorkoutForm({ ...editWorkoutForm, calories_burned: e.target.value })} fullWidth size='small' />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditWorkoutOpen(false)}>취소</Button>
          <Button variant='contained' onClick={handleEditWorkout} disabled={actionLoading} sx={{ bgcolor: '#5FCB77', '&:hover': { bgcolor: '#4DBB68' } }}>
            {actionLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 운동 일기 수정 다이얼로그 */}
      <Dialog open={editDiaryOpen} onClose={() => setEditDiaryOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>운동 일기 수정 ✍️</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1 }}>컨디션</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
              {MOODS.map((m) => (
                <Box
                  key={m.key}
                  onClick={() => setEditDiaryForm((prev) => ({ ...prev, mood: prev.mood === m.key ? '' : m.key }))}
                  sx={{
                    flex: 1, textAlign: 'center', py: 1, borderRadius: 2, cursor: 'pointer',
                    bgcolor: editDiaryForm.mood === m.key ? '#EDE7F6' : '#F5F5F5',
                    border: editDiaryForm.mood === m.key ? '2px solid #A084E8' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{m.emoji}</Typography>
                  <Typography variant='caption' sx={{ color: editDiaryForm.mood === m.key ? '#A084E8' : '#888', fontWeight: editDiaryForm.mood === m.key ? 700 : 400, fontSize: '0.7rem' }}>
                    {m.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <TextField
            multiline rows={4} fullWidth label='일기 내용'
            value={editDiaryForm.content || ''}
            onChange={(e) => setEditDiaryForm((prev) => ({ ...prev, content: e.target.value }))}
            size='small'
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDiaryOpen(false)}>취소</Button>
          <Button variant='contained' onClick={handleEditDiary} disabled={actionLoading} sx={{ bgcolor: '#5DA9E9', '&:hover': { bgcolor: '#4A96D8' } }}>
            {actionLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onClose={() => !actionLoading && setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🗑️</Typography>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>정말 삭제하시겠습니까?</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant='outlined' fullWidth onClick={() => setDeleteOpen(false)} disabled={actionLoading}>취소</Button>
          <Button variant='contained' fullWidth color='error' onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 운동 일기 작성 모달 */}
      <Dialog
        open={diaryOpen}
        onClose={() => { setDiaryOpen(false); setDiaryForm({ mood: '', content: '' }); }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>운동 일기 쓰기 ✍️</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {todayWorkouts.length > 0 ? (
            <Card sx={{ bgcolor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant='caption' sx={{ fontWeight: 700, color: '#4CAF5A', display: 'block', mb: 0.5 }}>
                  📎 오늘의 운동 자동 첨부
                </Typography>
                <Typography variant='body2' sx={{ color: '#2E7D32' }}>
                  {todayWorkouts.length}회 운동 · {todayStats.duration}분 · {todayStats.calories}kcal
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ bgcolor: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 2, px: 2, py: 1.5 }}>
              <Typography variant='caption' sx={{ color: '#F57F17' }}>
                ⚠️ 오늘 저장된 운동 기록이 없습니다.
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 700, mb: 1 }}>오늘의 컨디션</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
              {MOODS.map((m) => (
                <Box
                  key={m.key}
                  onClick={() => setDiaryForm((prev) => ({ ...prev, mood: prev.mood === m.key ? '' : m.key }))}
                  sx={{
                    flex: 1, textAlign: 'center', py: 1, borderRadius: 2, cursor: 'pointer',
                    bgcolor: diaryForm.mood === m.key ? '#EDE7F6' : '#F5F5F5',
                    border: diaryForm.mood === m.key ? '2px solid #A084E8' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{m.emoji}</Typography>
                  <Typography variant='caption' sx={{ color: diaryForm.mood === m.key ? '#A084E8' : '#888', fontWeight: diaryForm.mood === m.key ? 700 : 400, fontSize: '0.7rem' }}>
                    {m.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <TextField
            multiline rows={4} fullWidth label='일기 내용'
            placeholder='오늘의 운동은 어땠나요? 느낀 점, 목표 달성 여부 등을 자유롭게 기록해보세요.'
            value={diaryForm.content}
            onChange={(e) => setDiaryForm((prev) => ({ ...prev, content: e.target.value }))}
            size='small'
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDiaryOpen(false); setDiaryForm({ mood: '', content: '' }); }}>취소</Button>
          <Button
            variant='contained'
            onClick={saveDiary}
            disabled={diaryLoading || (!diaryForm.mood && !diaryForm.content.trim())}
            sx={{ bgcolor: '#5DA9E9', '&:hover': { bgcolor: '#4A96D8' } }}
          >
            {diaryLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {tab === 0 && (
        <Fab
          onClick={() => navigate('/timer')}
          sx={{
            position: 'fixed', bottom: 80, right: 16,
            bgcolor: '#5FCB77', color: 'white',
            '&:hover': { bgcolor: '#4DBB68' },
            boxShadow: '0 4px 16px rgba(95,203,119,0.4)',
          }}
        >
          <DirectionsRunIcon />
        </Fab>
      )}

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
