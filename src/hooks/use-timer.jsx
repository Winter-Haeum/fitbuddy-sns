import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from '../utils/supabase';
import { getLevelFromXP } from '../utils/xp-utils';
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

      const intensityXpBonus = { low: 1, medium: 3, high: 5 };
      let xpGain = 5;
      if (minutes >= 10) {
        xpGain += Math.floor(minutes / 10) * 2;
      } else {
        xpGain += 1;
      }
      xpGain += intensityXpBonus[intensity] || 3;
      xpGain = Math.min(xpGain, 40);

      const { data: charData } = await supabase
        .from('fitbuddy_characters')
        .select('experience, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (charData) {
        const newXp = (charData.experience || 0) + xpGain;
        const newLevel = getLevelFromXP(newXp);
        await supabase.from('fitbuddy_characters').update({
          experience: newXp,
          level: newLevel,
        }).eq('user_id', user.id);
      }

      setRunning(false);
      setResting(false);
      setRestRunning(false);
      setSaved(true);
      setSnack({
        open: true,
        msg: `운동 기록이 저장되었습니다. ${minutes}분 ${cal}kcal · +${xpGain}XP 💪`,
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
