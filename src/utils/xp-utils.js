// 레벨 L에서 L+1로 올라가는 데 필요한 XP. 초반은 빠르고 레벨이 오를수록 점점 어려워지는
// 곡선(10 + 5*(L-1) + (L-1)^2)을 5 XP 단위로 반올림해서 사용한다 — DB의
// fitbuddy_required_xp_for_level()과 반드시 같은 공식을 유지해야 서버가 계산한 level과
// 클라이언트 표시가 어긋나지 않는다.
export function requiredXpForLevel(level) {
  const l = Number(level);
  if (!Number.isFinite(l) || l < 1) return 0;
  const raw = 10 + 5 * (l - 1) + (l - 1) ** 2;
  return Math.round(raw / 5) * 5;
}

// 레벨 1에서 주어진 level까지 도달하는 데 필요한 누적 총 XP. level<=1이면 0.
export function xpToReachLevel(level) {
  const target = Number.isFinite(Number(level)) ? Math.max(1, Math.floor(Number(level))) : 1;
  let cumulative = 0;
  for (let l = 1; l < target; l++) cumulative += requiredXpForLevel(l);
  return cumulative;
}

// 누적 total XP로부터 현재 레벨을 계산한다. requiredXpForLevel이 항상 양수이므로(레벨이
// 오를수록 계속 증가) 유한한 xp에 대해 항상 종료된다 — 별도 MAX_LEVEL 없이도 무한루프 없음.
export function getLevelFromXP(totalXp) {
  const xp = Number.isFinite(totalXp) && totalXp > 0 ? totalXp : 0;
  let level = 1;
  let cumulative = 0;
  while (true) {
    const need = requiredXpForLevel(level);
    if (need <= 0 || cumulative + need > xp) break;
    cumulative += need;
    level += 1;
  }
  return level;
}

// 캐릭터 페이지 등에서 바로 쓸 수 있는 현재 레벨 진행 상태 묶음.
// @param {number} totalXp - fitbuddy_characters.experience(누적 total XP)
// @returns {{ level: number, xpInLevel: number, xpNeeded: number, pct: number }}
export function getXpProgress(totalXp) {
  const xp = Number.isFinite(totalXp) && totalXp > 0 ? totalXp : 0;
  const level = getLevelFromXP(xp);
  const xpCurrentLevelStart = xpToReachLevel(level);
  const xpNeeded = requiredXpForLevel(level);
  const xpInLevel = Math.max(0, xp - xpCurrentLevelStart);
  const pct = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;
  return { level, xpInLevel, xpNeeded, pct };
}
