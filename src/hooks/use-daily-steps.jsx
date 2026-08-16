import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import DailySteps from '../plugins/daily-steps';

/** 하루 걸음 목표(고정값). 목표 설정 UI/컬럼은 이번 버전에 없다. */
export const DAILY_STEP_GOAL = 10000;

// Android Capacitor 앱에서만 Health Connect를 사용할 수 있다. 웹/PWA에서는 DeviceMotionEvent 등으로
// 하루 종일 걸음을 가장하지 않고, 이 기능 자체를 숨긴다(use-daily-steps 사용처에서 isNative로 분기).
const isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/**
 * useDailySteps - Android Health Connect가 보유한 "오늘(로컬 자정~현재)" 누적 걸음 수를 읽어온다.
 *
 * FitBuddy는 걸음을 직접 측정/누적하지 않으며, 이미 기기에 쌓인 값을 그대로 읽어 보여줄 뿐이다.
 * 최초 마운트(= 앱 최초 실행/홈 진입) 시 1회 조회하고, 앱이 background→foreground로 복귀할 때
 * 다시 조회한다. 배터리 소모를 피하기 위해 별도의 폴링(setInterval)은 사용하지 않는다.
 *
 * @returns {{
 *   isNative: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   steps: number,
 *   availability: 'available'|'update_required'|'unavailable'|null,
 *   permissionGranted: boolean,
 *   refresh: () => Promise<void>,
 *   connect: () => Promise<void>,
 * }}
 */
export function useDailySteps() {
  const [state, setState] = useState({
    loading: isNative,
    error: null,
    steps: 0,
    availability: null,
    permissionGranted: false,
  });
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!isNative) return;
    const seq = ++requestSeq.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { status } = await DailySteps.getAvailability();
      if (seq !== requestSeq.current) return;
      if (status !== 'available') {
        setState({ loading: false, error: null, steps: 0, availability: status, permissionGranted: false });
        return;
      }

      const { granted } = await DailySteps.hasPermission();
      if (seq !== requestSeq.current) return;
      if (!granted) {
        setState({ loading: false, error: null, steps: 0, availability: status, permissionGranted: false });
        return;
      }

      const { steps } = await DailySteps.getTodaySteps();
      if (seq !== requestSeq.current) return;
      setState({ loading: false, error: null, steps: steps || 0, availability: status, permissionGranted: true });
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error('[useDailySteps] refresh error:', err);
      setState((prev) => ({ ...prev, loading: false, error: err?.message || 'unknown_error' }));
    }
  }, []);

  // "연결" 버튼 클릭(사용자 동작) 시에만 호출 — Health Connect READ_STEPS 권한 요청.
  const connect = useCallback(async () => {
    if (!isNative) return;
    try {
      const { granted } = await DailySteps.requestPermission();
      if (granted) {
        await refresh();
      } else {
        setState((prev) => ({ ...prev, permissionGranted: false }));
      }
    } catch (err) {
      console.error('[useDailySteps] connect error:', err);
      setState((prev) => ({ ...prev, error: err?.message || 'unknown_error' }));
    }
  }, [refresh]);

  // 최초 마운트(앱 최초 실행 또는 홈 화면 재진입) 시 조회
  useEffect(() => {
    refresh();
  }, [refresh]);

  // background → foreground 복귀 시 재조회
  useEffect(() => {
    if (!isNative) return undefined;
    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) refresh();
    });
    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [refresh]);

  return { ...state, isNative, refresh, connect };
}
