/** 컨디션 상태 목록 */
export const MOODS = [
  { key: 'tired',  emoji: '😴', label: '피곤',  text: '피곤한 하루예요.' },
  { key: 'normal', emoji: '😐', label: '보통',  text: '평범한 컨디션이에요.' },
  { key: 'good',   emoji: '😊', label: '좋음',  text: '오늘 컨디션이 좋아요.' },
  { key: 'great',  emoji: '💪', label: '활기참', text: '에너지가 넘치는 날이에요.' },
];

/** 운동 종류 목록 */
export const WORKOUT_TYPES = [
  '홈트', '스트레칭', '러닝', '헬스', '요가',
  '필라테스', '수영', '자전거', '등산', '기타',
];

/** 운동 강도 목록 (cal: 분당 소모 칼로리 추정) */
export const INTENSITIES = [
  { value: 'low',    label: '낮음', cal: 4 },
  { value: 'medium', label: '보통', cal: 7 },
  { value: 'high',   label: '높음', cal: 10 },
];
