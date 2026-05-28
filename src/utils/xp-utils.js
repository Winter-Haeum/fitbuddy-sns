/** 레벨 N에 도달하는 데 필요한 누적 XP */
export function xpToReachLevel(n) {
  if (n <= 1) return 0;
  return (n - 1) * (100 + 25 * (n - 2));
}

/** 현재 레벨에서 다음 레벨까지 필요한 XP */
export function xpForNextLevel(level) {
  return 100 + (level - 1) * 50;
}

/** 총 XP에서 현재 레벨 계산 */
export function getLevelFromXP(xp) {
  let level = 1;
  while (xp >= xpToReachLevel(level + 1)) level++;
  return level;
}
