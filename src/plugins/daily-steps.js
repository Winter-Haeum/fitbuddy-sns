import { registerPlugin } from '@capacitor/core';

/**
 * DailySteps - Android Health Connect의 오늘 누적 걸음 수를 읽는 네이티브 bridge.
 *
 * 네이티브 구현: android/app/src/main/java/io/github/winterhaeum/fitbuddy/DailyStepsPlugin.kt
 * 웹/PWA에는 대응하는 구현이 없으므로 반드시 Capacitor.isNativePlatform() 확인 후 호출한다
 * (src/hooks/use-daily-steps.jsx 참고).
 */
const DailySteps = registerPlugin('DailySteps');

export default DailySteps;
