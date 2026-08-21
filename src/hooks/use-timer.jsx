import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from '../utils/supabase';
import { getLocalToday } from '../utils/date-utils';
import { useAuth } from './use-auth';
import { WORKOUT_TYPES, INTENSITIES } from '../constants/workout';

export { WORKOUT_TYPES, INTENSITIES };

// formatTime is shared by timer UI components; keeping it here avoids timer import churn for now.
// eslint-disable-next-line react-refresh/only-export-components
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getStatus(running, resting, restRunning, saved, seconds, currentRestSeconds) {
  if (saved) return 'completed';
  if (resting && restRunning) return 'resting';
  if (resting && !restRunning && currentRestSeconds > 0) return 'rest_paused';
  if (resting && !restRunning) return 'rest_waiting';
  if (running) return 'running';
  if (seconds > 0) return 'paused';
  return 'idle';
}

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { user } = useAuth();

  const [workoutType, setWorkoutType] = useState('헬스');
  const [intensity, setIntensity] = useState('medium');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [resting, setResting] = useState(false);
  const [restRunning, setRestRunning] = useState(false);
  const [currentRestSeconds, setCurrentRestSeconds] = useState(0);
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const intervalRef = useRef(null);
  const restRef = useRef(null);

  const status = getStatus(running, resting, restRunning, saved, seconds, currentRestSeconds);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (restRunning) {
      restRef.current = setInterval(() => {
        setCurrentRestSeconds((s) => s + 1);
        setTotalRestSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(restRef.current);
    }
    return () => clearInterval(restRef.current);
  }, [restRunning]);

  function handleStartPause() {
    if (saved) return;
    if (resting) {
      setRestRunning((prev) => !prev);
    } else {
      setRunning((prev) => !prev);
    }
  }

  function handleRest() {
    if (seconds === 0 || saved) return;
    if (resting) {
      setRestRunning(false);
      setResting(false);
      setCurrentRestSeconds(0);
      setRunning(false);
    } else {
      setRunning(false);
      setResting(true);
      setRestRunning(false);
      setCurrentRestSeconds(0);
    }
  }

  function handleReset() {
    setRunning(false);
    setResting(false);
    setRestRunning(false);
    setSeconds(0);
    setCurrentRestSeconds(0);
    setTotalRestSeconds(0);
    setSaved(false);
  }

  async function handleSave(onComplete) {
    if (!user || seconds === 0 || saved) return;
    setSaving(true);
    const minutes = Math.ceil(seconds / 60);
    const intensityObj = INTENSITIES.find((i) => i.value === intensity);
    const cal = Math.round(minutes * (intensityObj?.cal || 7));
    const today = getLocalToday();

    const payload = {
      user_id: user.id,
      workout_type: workoutType,
      duration_minutes: minutes,
      intensity,
      calories_burned: cal,
      // 운동 세션별 걸음 측정(DeviceMotionEvent)은 더 이상 사용하지 않는다("오늘의 걸음"은
      // 이제 홈 화면에서 Android Health Connect 기반으로 별도 표시된다). steps 컬럼 자체는
      // 기존 데이터 호환을 위해 남겨두되, 항상 0으로 저장한다.
      steps: 0,
      workout_date: today,
      workout_seconds: seconds,
      rest_seconds: totalRestSeconds,
      workout_status: 'completed',
    };

    try {
      const { error } = await supabase.from('fitbuddy_workouts').insert(payload);
      if (error) {
        setSnack({ open: true, msg: '저장 실패: ' + error.message, severity: 'error' });
        return;
      }

      // XP는 클라이언트가 액수를 정하지 않는다 — 서버(RPC)가 오늘 실제 운동 기록을 다시
      // 조회해서 지급 자격/액수를 계산한다. 동일 날짜에 여러 번 호출돼도(중복 저장, 재접속)
      // ledger unique 제약 덕분에 이미 지급된 몫은 다시 더해지지 않는다(idempotent).
      let xpDelta = 0;
      try {
        const { data: syncResult, error: syncErr } = await supabase.rpc('fitbuddy_sync_daily_xp', { p_date: today });
        if (syncErr) throw syncErr;
        xpDelta = syncResult?.total_delta || 0;
      } catch (syncErr) {
        console.error('XP 동기화 오류:', syncErr);
      }

      setRunning(false);
      setResting(false);
      setRestRunning(false);
      setSaved(true);
      setSnack({
        open: true,
        msg: `운동 기록이 저장되었습니다. ${minutes}분 ${cal}kcal${xpDelta > 0 ? ` · +${xpDelta}XP 💪` : ''}`,
        severity: 'success',
      });

      if (onComplete) onComplete();
      // 저장 완료 2.5초 후 자동 초기화 (내비게이션 후 깔끔하게 리셋)
      setTimeout(() => {
        setRunning(false);
        setResting(false);
        setRestRunning(false);
        setSeconds(0);
        setCurrentRestSeconds(0);
        setTotalRestSeconds(0);
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error('운동 저장 오류:', err);
      setSnack({ open: true, msg: '저장에 실패했습니다.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // idle 또는 completed가 아닌 상태 = 미니플레이어 표시 대상
  const isActive = !['idle', 'completed'].includes(status);

  return (
    <TimerContext.Provider value={{
      workoutType, setWorkoutType,
      intensity, setIntensity,
      seconds, running, resting, restRunning,
      currentRestSeconds, totalRestSeconds,
      saved, saving, snack, setSnack,
      status, isActive,
      handleStartPause, handleRest, handleReset, handleSave,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

// useTimer stays with TimerProvider/TimerContext to keep the timer state flow stable.
// eslint-disable-next-line react-refresh/only-export-components
export function useTimer() {
  return useContext(TimerContext);
}
