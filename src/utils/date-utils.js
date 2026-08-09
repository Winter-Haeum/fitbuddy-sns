/**
 * 기기 로컬 날짜 기준 YYYY-MM-DD 반환 (UTC가 아닌 로컬 시간)
 * 한국(UTC+9) 환경에서 자정 이후 정확한 날짜를 보장합니다.
 */
export function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 챌린지 종료 날짜까지 남은 일수 계산 (로컬 시간 기준)
 * @param {string} endDate - 'YYYY-MM-DD' 형식
 * @returns {number} 남은 일수 (0 이상)
 */
export function getDaysLeft(endDate) {
  const end = new Date((endDate || '') + 'T23:59:59');
  const now = new Date();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}
