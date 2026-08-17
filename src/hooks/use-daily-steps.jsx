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
 * Health Connect가 하루 전체 걸음의 source of truth라는 점은 그대로 유지하면서, FitBuddy가
 * 실제로 foreground에 떠 있는 동안에는 네이티브 걸음 센서 기반 실시간 보정(live steps)이
 * Health Connect 반영 지연 없이 화면 숫자를 즉시 올려준다. 이중 카운트 방지/재조정은 전부
 * 네이티브(DailyStepsPlugin)에서 처리하고, 이 훅은 그 결과값(stepsUpdate 이벤트)만 그대로
 * 반영한다.
 *
 * 최초 마운트(= 앱 최초 실행/홈 진입) 시 1회 조회하고, 앱이 background→foreground로 복귀할 때
 * 다시 조회한다. background에서는 live 센서를 사용하지 않는다(배터리 소모 방지).
 *
 * @returns {{
 *   isNative: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   steps: number,
 *   availability: 'available'|'update_required'|'unavailable'|'step_tracking_unsupported'|null,
 *   permissionGranted: boolean,
 *   activityRecognitionGranted: boolean,
 *   refresh: () => Promise<void>,
 *   connect: () => Promise<void>,
 *   enableLiveSteps: () => Promise<void>,
 * }}
 */
export function useDailySteps() {
  const [state, setState] = useState({
    loading: isNative,
    error: null,
    steps: 0,
    availability: null,
    permissionGranted: false,
    // Health Connect READ_STEPS와 별개로, 실시간 센서 보정에 필요한 ACTIVITY_RECOGNITION
    // 권한 보유 여부. 이전 버전에서 이미 READ_STEPS만 허용해 둔 기존 사용자를 구분하는 데 쓴다.
    activityRecognitionGranted: false,
  });
  const requestSeq = useRef(0);
  const liveActiveRef = useRef(false); // 중복 시작 방지용(네이티브도 idempotent이지만 JS 쪽도 이중 호출을 막는다)

  // foreground 실시간 보정 세션 시작. Health Connect 권한/신체 활동 인식 권한/걸음 센서 중
  // 하나라도 없으면 네이티브가 started:false로 안전하게 응답할 뿐이며, 이 경우에도 이미
  // refresh()로 반영된 Health Connect 값은 그대로 유지된다.
  const startLive = useCallback(async () => {
    if (!isNative || liveActiveRef.current) return;
    liveActiveRef.current = true;
    try {
      const result = await DailySteps.startLiveSteps();
      if (result?.started && typeof result.steps === 'number') {
        setState((prev) => (prev.permissionGranted ? { ...prev, steps: result.steps } : prev));
      }
    } catch (err) {
      console.error('[useDailySteps] startLive error:', err);
    }
  }, []);

  const stopLive = useCallback(() => {
    if (!isNative || !liveActiveRef.current) return;
    liveActiveRef.current = false;
    DailySteps.stopLiveSteps().catch((err) => console.error('[useDailySteps] stopLive error:', err));
  }, []);

  const refresh = useCallback(async () => {
    if (!isNative) return;
    const seq = ++requestSeq.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { status } = await DailySteps.getAvailability();
      if (seq !== requestSeq.current) return;
      if (status !== 'available') {
        stopLive();
        setState({
          loading: false, error: null, steps: 0, availability: status,
          permissionGranted: false, activityRecognitionGranted: false,
        });
        return;
      }

      const { granted } = await DailySteps.hasPermission();
      if (seq !== requestSeq.current) return;
      if (!granted) {
        stopLive();
        setState({
          loading: false, error: null, steps: 0, availability: status,
          permissionGranted: false, activityRecognitionGranted: false,
        });
        return;
      }

      const { steps } = await DailySteps.getTodaySteps();
      if (seq !== requestSeq.current) return;
      // 팝업 없이 현재 권한 상태만 조회한다(READ_STEPS만 허용해 둔 기존 사용자를 여기서 감지).
      const { granted: arGranted } = await DailySteps.hasActivityRecognitionPermission();
      if (seq !== requestSeq.current) return;
      setState({
        loading: false, error: null, steps: steps || 0, availability: status,
        permissionGranted: true, activityRecognitionGranted: arGranted,
      });
      // foreground에서 권한이 확인될 때마다(최초 진입 포함) live 보정을 (재)시작한다. 이미
      // 시작돼 있거나 ACTIVITY_RECOGNITION이 없으면 내부 가드/네이티브 쪽에서 안전하게
      // 무시된다.
      startLive();
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error('[useDailySteps] refresh error:', err);
      setState((prev) => ({ ...prev, loading: false, error: err?.message || 'unknown_error' }));
    }
  }, [startLive, stopLive]);

  // "연결" 버튼 클릭(사용자 동작) 시에만 호출.
  // Health Connect READ_STEPS 허용 → 신체 활동 인식(ACTIVITY_RECOGNITION) 순서로 한 번에
  // 이어서 요청한다. 신체 활동 인식 권한이 거부되어도 실시간 표시만 못 쓸 뿐, Health
  // Connect 기반 오늘 걸음 기능 자체는 refresh()를 통해 계속 정상 동작한다.
  const connect = useCallback(async () => {
    if (!isNative) return;
    try {
      const { granted } = await DailySteps.requestPermission();
      if (!granted) {
        setState((prev) => ({ ...prev, permissionGranted: false }));
        return;
      }
      try {
        await DailySteps.requestActivityRecognitionPermission();
      } catch (err) {
        console.error('[useDailySteps] requestActivityRecognitionPermission error:', err);
      }
      await refresh();
    } catch (err) {
      console.error('[useDailySteps] connect error:', err);
      setState((prev) => ({ ...prev, error: err?.message || 'unknown_error' }));
    }
  }, [refresh]);

  // 이미 Health Connect(READ_STEPS)는 연결됐지만 ACTIVITY_RECOGNITION은 아직 없는 기존
  // 사용자용 진입점. 카드의 "실시간 걸음 보기 켜기" 링크를 탭했을 때만 호출되며, foreground
  // 진입마다 자동으로 뜨는 팝업이 아니다(요청 자체가 사용자 동작에 묶여 있음).
  const enableLiveSteps = useCallback(async () => {
    if (!isNative) return;
    try {
      const { granted } = await DailySteps.requestActivityRecognitionPermission();
      setState((prev) => (prev.permissionGranted ? { ...prev, activityRecognitionGranted: granted } : prev));
      if (granted) startLive();
    } catch (err) {
      console.error('[useDailySteps] enableLiveSteps error:', err);
    }
  }, [startLive]);

  // 최초 마운트(앱 최초 실행 또는 홈 화면 재진입) 시 조회
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 네이티브 live 보정 값 구독 — foreground 동안의 실시간 증가는 전부 이 이벤트로 들어온다.
  useEffect(() => {
    if (!isNative) return undefined;
    const listenerPromise = DailySteps.addListener('stepsUpdate', ({ steps }) => {
      setState((prev) => (prev.permissionGranted ? { ...prev, steps } : prev));
    });
    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);

  // background → foreground 복귀 시 Health Connect를 다시 조회(+ live 보정 재시작),
  // foreground → background 전환 시 live 센서를 즉시 해제한다(배터리 소모 방지).
  useEffect(() => {
    if (!isNative) return undefined;
    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) refresh();
      else stopLive();
    });
    return () => {
      listenerPromise.then((listener) => listener.remove());
      stopLive();
    };
  }, [refresh, stopLive]);

  return { ...state, isNative, refresh, connect, enableLiveSteps };
}
