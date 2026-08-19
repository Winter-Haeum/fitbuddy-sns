/** 컨디션 상태 목록 */
export const MOODS = [
  { key: 'tired',  emoji: '😴', label: '피곤',  text: '피곤한 하루예요.' },
  { key: 'normal', emoji: '😐', label: '보통',  text: '평범한 컨디션이에요.' },
  { key: 'good',   emoji: '😊', label: '좋음',  text: '오늘 컨디션이 좋아요.' },
  { key: 'great',  emoji: '💪', label: '활기참', text: '에너지가 넘치는 날이에요.' },
];

/** 운동 종류 목록 — 캐릭터 asset(semi/chibi exercise 폴더)과 1:1 대응하는 10종. 기록/타이머/
 * 글쓰기 화면의 운동 종류 선택과 관심 운동 선택이 모두 이 배열 하나를 참조한다(화면마다 각자
 * 다른 목록을 반복 정의하지 않는다). 기존 '기타'는 신규 asset에 대응 항목이 없어 '줄넘기'로
 * 교체했다 — 과거에 '기타'로 저장된 기록 데이터는 건드리지 않으며, FitBuddyCharacter는 매핑
 * 안 되는 값이 들어와도 안전하게 fallback한다. */
export const WORKOUT_TYPES = [
  '홈트', '스트레칭', '러닝', '헬스', '요가',
  '필라테스', '수영', '자전거', '등산', '줄넘기',
];

/** WORKOUT_TYPES 한글 라벨 → 캐릭터 asset 파일명 slug (semi/chibi exercise 폴더 기준).
 * FitBuddyCharacter 전용 — 다른 화면에서 이 값을 저장/전송하지 않는다. */
export const EXERCISE_ASSET_SLUG = {
  '홈트': 'home_training',
  '스트레칭': 'stretching',
  '러닝': 'running',
  '헬스': 'gym',
  '요가': 'yoga',
  '필라테스': 'pilates',
  '수영': 'swimming',
  '자전거': 'cycling',
  '등산': 'hiking',
  '줄넘기': 'jump_rope',
};

/** 운동 강도 목록 (cal: 분당 소모 칼로리 추정) */
export const INTENSITIES = [
  { value: 'low',    label: '낮음', cal: 4 },
  { value: 'medium', label: '보통', cal: 7 },
  { value: 'high',   label: '높음', cal: 10 },
];
