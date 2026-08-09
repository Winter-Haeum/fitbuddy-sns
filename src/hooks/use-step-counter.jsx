import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 스마트폰 가속도계(DeviceMotionEvent)를 이용한 걸음 수 측정 훅
 *
 * 동작 원리:
 *  - 가속도 벡터의 크기(magnitude) = √(x² + y² + z²)
 *  - 정지 시 ≈ 9.8 m/s² (중력), 걷기 시 ≈ 7~13 m/s² 사이 진동
 *  - 지수 이동평균으로 노이즈 제거 후 임계값 상향 돌파 = 1걸음
 *
 * 한계:
 *  - 앱이 화면에 열려있는 동안만 측정 가능 (백그라운드 X)
 *  - iOS 13+ 는 사용자가 명시적으로 허용해야 함
 *  - 보행 패턴에 따라 ±10~20% 오차 존재
 */

const STEP_THRESHOLD = 11.5;   // 걸음 감지 임계값 (m/s²)
const MIN_STEP_INTERVAL = 280; // 최소 걸음 간격 (ms) — 초당 최대 ~3.5걸음
const SMOOTH_FACTOR = 0.82;    // 지수 이동평균 계수 (0~1, 클수록 더 많이 평균냄)

/**
 * @param {boolean} isActive - true이면 걸음 수 측정 시작
 * @returns {{ steps, isSupported, permissionState, requestPermission, resetSteps }}
 */
export function useStepCounter(isActive = false) {
  const [steps, setSteps] = useState(0);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'DeviceMotionEvent' in window);
  // 'unknown' | 'granted' | 'denied' | 'not-required'
  const [permissionState, setPermissionState] = useState(() => (
    isSupported && typeof DeviceMotionEvent.requestPermission !== 'function' ? 'not-required' : 'unknown'
  ));

  const smoothMag = useRef(9.8);
  const prevSmooth = useRef(null);
  const lastStepTime = useRef(0);

  const handleMotion = useCallback((event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const raw = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

    // 지수 이동평균으로 노이즈 완화
    smoothMag.current = SMOOTH_FACTOR * smoothMag.current + (1 - SMOOTH_FACTOR) * raw;

    const now = Date.now();
    const prev = prevSmooth.current;

    if (prev !== null) {
      // 임계값 상향 돌파 + 최소 간격 충족 → 걸음 카운트
      if (prev < STEP_THRESHOLD &&
          smoothMag.current >= STEP_THRESHOLD &&
          now - lastStepTime.current > MIN_STEP_INTERVAL) {
        setSteps((s) => s + 1);
        lastStepTime.current = now;
      }
    }

    prevSmooth.current = smoothMag.current;
  }, []);

  // 측정 시작/정지
  useEffect(() => {
    const canListen = isActive &&
      (permissionState === 'granted' || permissionState === 'not-required');

    if (!canListen) return;

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isActive, permissionState, handleMotion]);

  /**
   * iOS 13+ 권한 요청 (사용자 버튼 클릭 이벤트 내에서 호출해야 함)
   * @returns {Promise<boolean>}
   */
  async function requestPermission() {
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        const granted = result === 'granted';
        setPermissionState(granted ? 'granted' : 'denied');
        return granted;
      } catch {
        setPermissionState('denied');
        return false;
      }
    }
    // Android / 데스크톱
    setPermissionState('not-required');
    return true;
  }

  function resetSteps() {
    setSteps(0);
    prevSmooth.current = null;
    lastStepTime.current = 0;
    smoothMag.current = 9.8;
  }

  return { steps, isSupported, permissionState, requestPermission, resetSteps };
}
