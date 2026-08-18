import { useState } from 'react';
import Box from '@mui/material/Box';
import { EXERCISE_ASSET_SLUG } from '../../constants/workout';

// 신규(semi/chibi/*)와 레거시(평면 파일) asset을 하나의 glob으로 함께 인식한다. `**`는 0개
// 이상의 하위 폴더에 매치되므로 `characters/female-100.webp` 같은 레거시 평면 경로와
// `characters/semi/base/....webp` 같은 신규 경로를 모두 이 한 맵으로 조회할 수 있다.
const allImgs = import.meta.glob('/src/assets/characters/**/*.webp', { eager: true, import: 'default' });

function legacyImg(filename) {
  return allImgs[`/src/assets/characters/${filename}`] || null;
}

// 신규 asset은 대부분 `이름.png.webp`(webp로 재변환된 png)이지만 chibi/exercise의 남성 1번
// 자전거 파일 하나만 `이름.webp` 단일 확장자로 존재한다(알려진 예외 — 이번 PR에서 파일명은
// 건드리지 않는다). 확장자를 문자열로 하드코딩하면 그 한 파일만 깨지므로, 두 형식을 순서대로
// 시도해 glob 맵에 실제로 존재하는 키를 찾는다.
function styledImg(style, category, stem) {
  const base = `/src/assets/characters/${style}/${category}/${stem}`;
  return allImgs[`${base}.png.webp`] || allImgs[`${base}.webp`] || null;
}

const VALID_STYLES = ['semi', 'chibi'];
const VALID_VARIANTS = [1, 2, 3];

function normalizeStyle(characterStyle) {
  return VALID_STYLES.includes(characterStyle) ? characterStyle : 'semi';
}

function normalizeVariant(characterVariant) {
  const n = Number(characterVariant);
  return VALID_VARIANTS.includes(n) ? n : 1;
}

function genderCode(gender) {
  return gender === 'male' ? 'm' : 'f';
}

/* mood 기반 이미지 (레거시 fallback 전용 — 아래 MOOD_TO_PROGRESS로 신규 asset을 우선 사용) */
const MOOD_MAP = {
  idle:        (g) => `${g}-20.webp`,
  active:      (g) => `${g}-active.webp`,
  running:     (g) => `${g}-running.webp`,
  celebrating: (g) => `${g}-100.webp`,
};

// mood 문자열 → 신규 progress 5단계 매핑(표시용). Home/Timer가 mood를 언제 idle/active/
// running/celebrating으로 판단하는지의 "의미"는 이번 PR에서 바꾸지 않는다 — 이미 정해진
// mood 값을 신규 asset 중 어떤 파일로 보여줄지만 정한다(다음 PR에서 진행률 정책 통일 예정).
const MOOD_TO_PROGRESS = { idle: '000', active: '025', running: '075', celebrating: '100' };

/* 운동 동작별 이미지 (pose variant 기반 — 하위 호환 전용). squat/pushup/stretch/lunge 같은
   "동작" 개념은 신규 semi/chibi asset(base/exercise/progress)에 대응 카테고리가 없어 대체할
   수 없다 — 그대로 레거시 평면 파일을 계속 참조한다. 현재 어떤 화면도 variant prop을 실제로
   넘기지 않아 이 경로는 사실상 미사용 상태이지만, 대체 asset이 없는 한 임의로 제거하지 않는다. */
const VARIANT_IMG = {
  female: {
    running: 'female-running.webp',
    squat:   'female-squat.webp',
    pushup:  'female-pushup.webp',
    stretch: 'female-stretch.webp',
    lunge:   'female-lunge.webp',
    workout: 'female-pushup.webp',
  },
  male: {
    running: 'male-running.webp',
    squat:   'male-squat.webp',
    pushup:  'male-pushup.webp',
    stretch: 'male-stretch.webp',
    lunge:   'male-squat.webp',
    workout: 'male-workout.webp',
  },
};

/* 운동 종류(한글)별 레거시 이미지 — 신규 exercise asset을 못 찾았을 때만 쓰는 2차 fallback. */
const WORKOUT_TYPE_IMG = {
  female: {
    '헬스': 'female-gym.webp',
    '스트레칭': 'female-stretching.webp',
    '러닝': 'female-jogging.webp',
    '홈트': 'female-home.webp',
    '요가': 'female-yoga.webp',
    '필라테스': 'female-pilates.webp',
    '수영': 'female-swim.webp',
    '자전거': 'female-cycling.webp',
    '등산': 'female-hiking.webp',
  },
  male: {
    '헬스': 'male-gym.webp',
    '스트레칭': 'male-stretching.webp',
    '러닝': 'male-jogging.webp',
    '홈트': 'male-home.webp',
    '요가': 'male-yoga.webp',
    '필라테스': 'male-pilates.webp',
    '수영': 'male-swim.webp',
    '자전거': 'male-cycling.webp',
    '등산': 'male-hiking.webp',
  },
};

// percentage(0~100)를 신규 asset의 5단계(000/025/050/075/100) 중 가장 가까운 표시용 파일로
// 스냅한다. 화면별 progress의 "의미"(무엇을 0~100으로 볼지)는 그대로 두고, 이미 정해진 숫자를
// 어떤 파일로 그릴지만 정하는 표시 레이어다.
function snapProgress(percentage) {
  const p = Math.max(0, Math.min(100, percentage));
  if (p >= 100) return '100';
  if (p >= 75) return '075';
  if (p >= 50) return '050';
  if (p >= 25) return '025';
  return '000';
}

// pose: 운동 자세(레거시 전용, squat/pushup/stretch/lunge/workout/running) — 기존 `variant`
// prop과 같은 개념이다. variantNum: 신규 캐릭터 번호(1/2/3, characterVariant 정규화 값) — 이름
// 충돌을 피하기 위해 selectImg 내부에서는 variantNum으로만 부른다.
function selectImg({ gender, style, variantNum, mood, percentage, pose, workoutType }) {
  const g = gender === 'male' ? 'male' : 'female';
  const gc = genderCode(gender);

  // 1순위: 운동 종류별 전용 이미지 — 신규 exercise asset 우선, 없으면 레거시로 fallback
  if (workoutType && EXERCISE_ASSET_SLUG[workoutType]) {
    const stem = `fitbuddy_${gc}0${variantNum}_${EXERCISE_ASSET_SLUG[workoutType]}`;
    const styled = styledImg(style, 'exercise', stem);
    if (styled) return styled;
  }
  if (workoutType && WORKOUT_TYPE_IMG[g]?.[workoutType]) {
    return legacyImg(WORKOUT_TYPE_IMG[g][workoutType]);
  }

  // 2순위: pose(운동 자세) — 대체 asset이 없는 레거시 전용 경로, 그대로 유지
  if (pose && VARIANT_IMG[g]?.[pose]) return legacyImg(VARIANT_IMG[g][pose]);

  // 3순위: 게이지 비율 — 신규 progress asset 우선, 없으면 레거시 20/50/80/100으로 fallback
  if (percentage != null) {
    const stage = snapProgress(percentage);
    const styled = styledImg(style, 'progress', `fitbuddy_${gc}0${variantNum}_progress_${stage}`);
    if (styled) return styled;
    const p = Math.max(0, Math.min(100, percentage));
    if (p >= 80) return legacyImg(`${g}-100.webp`);
    if (p >= 50) return legacyImg(`${g}-80.webp`);
    if (p >= 25) return legacyImg(`${g}-50.webp`);
    return legacyImg(`${g}-20.webp`);
  }

  // 4순위: mood — 신규 progress asset(호환 매핑) 우선, 없으면 레거시 mood 이미지로 fallback
  const moodKey = MOOD_MAP[mood] ? mood : 'active';
  const stage = MOOD_TO_PROGRESS[moodKey];
  const styled = styledImg(style, 'progress', `fitbuddy_${gc}0${variantNum}_progress_${stage}`);
  if (styled) return styled;
  return legacyImg(MOOD_MAP[moodKey](g));
}

function selectAnim(mood, percentage, variant, workoutType, clicked) {
  if (clicked) return 'fitbuddy-click 4s ease-in-out 1 both';
  if (workoutType) return 'none';
  if (variant === 'running' || mood === 'running') return 'fitbuddy-float 2s ease-in-out infinite';
  if (variant) return 'fitbuddy-float 2.5s ease-in-out infinite';
  if (mood === 'celebrating' || percentage >= 100) return 'fitbuddy-jump 0.55s ease-in-out infinite';
  if (mood === 'idle' || percentage === 0) return 'fitbuddy-float 3s ease-in-out infinite';
  return 'fitbuddy-breathe 2.5s ease-in-out infinite';
}

const CSS = `
  @keyframes fitbuddy-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes fitbuddy-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes fitbuddy-jump{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-15px) scale(1.07)}}
  @keyframes fitbuddy-click{0%{transform:scale(1)}10%{transform:scale(1.22)}22%{transform:scale(1)}34%{transform:scale(1.15)}46%{transform:scale(1)}58%{transform:scale(1.09)}70%{transform:scale(1)}82%{transform:scale(1.04)}92%,100%{transform:scale(1)}}
`;

/**
 * FitBuddyCharacter - 실제 캐릭터 이미지 기반 운동 캐릭터
 *
 * Props:
 * @param {number} size             - 너비(px) [Optional, 기본값: 64]
 * @param {string} gender           - 'female'|'male' [Optional, 기본값: 'female']
 * @param {string} characterStyle   - 'semi'|'chibi' — 유효하지 않으면 'semi'로 처리 [Optional, 기본값: 'semi']
 * @param {number} characterVariant - 1|2|3(캐릭터 번호) — 유효하지 않으면 1로 처리 [Optional, 기본값: 1]
 * @param {string} mood             - 'idle'|'active'|'running'|'celebrating' [Optional]
 * @param {number} percentage       - 0-100 게이지 비율 (mood보다 우선) [Optional]
 * @param {string} variant          - 'running'|'squat'|'pushup'|'stretch'|'lunge'|'workout' — 운동 자세(레거시 전용, characterVariant와는 다른 개념) [Optional]
 * @param {string} workoutType      - 한글 운동 종류 (variant보다 우선) [Optional]
 * @param {boolean} clickable       - 클릭 시 점프 애니메이션 [Optional, 기본값: false]
 */
function FitBuddyCharacter({
  size = 64,
  gender = 'female',
  characterStyle = 'semi',
  characterVariant = 1,
  mood = 'active',
  percentage,
  variant,
  workoutType,
  clickable = false,
}) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    if (!clickable || clicked) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 3000);
  }

  const style = normalizeStyle(characterStyle);
  const variantNum = normalizeVariant(characterVariant);
  const src = selectImg({ gender, style, variantNum, mood, percentage, pose: variant, workoutType });
  const anim = selectAnim(mood, percentage, variant, workoutType, clicked);

  return (
    <Box
      sx={{ display: 'inline-block', lineHeight: 0, cursor: clickable ? 'pointer' : 'default' }}
      onClick={handleClick}
    >
      <style>{CSS}</style>
      {src ? (
        <Box
          component='img'
          src={src}
          alt=''
          sx={{
            width: size,
            height: Math.round(size * 1.3),
            objectFit: 'contain',
            display: 'block',
            animation: anim,
          }}
        />
      ) : (
        <Box sx={{
          width: size,
          height: Math.round(size * 1.3),
          borderRadius: '50%',
          background: gender === 'female'
            ? 'linear-gradient(135deg,#FCE4EC,#F48FB1)'
            : 'linear-gradient(135deg,#E3F2FD,#64B5F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4,
          animation: anim,
        }}>
          {gender === 'female' ? '🧘‍♀️' : '🏃‍♂️'}
        </Box>
      )}
    </Box>
  );
}

export default FitBuddyCharacter;
