import { useState } from 'react';
import Box from '@mui/material/Box';

const allImgs = import.meta.glob('/src/assets/characters/*.webp', { eager: true, import: 'default' });

function img(filename) {
  return allImgs[`/src/assets/characters/${filename}`] || null;
}

/* mood 기반 이미지 */
const MOOD_MAP = {
  idle:        (g) => `${g}-20.webp`,
  active:      (g) => `${g}-active.webp`,
  running:     (g) => `${g}-running.webp`,
  celebrating: (g) => `${g}-100.webp`,
};

/* 운동 동작별 이미지 (variant 기반 — 하위 호환) */
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

/* 운동 종류(한국어)별 전용 이미지 */
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

function selectImg(gender, mood, percentage, variant, workoutType) {
  const g = gender === 'male' ? 'male' : 'female';

  // 1순위: 운동 종류별 전용 이미지
  if (workoutType && WORKOUT_TYPE_IMG[g]?.[workoutType]) {
    return img(WORKOUT_TYPE_IMG[g][workoutType]);
  }

  // 2순위: variant 기반 이미지
  if (variant && VARIANT_IMG[g]?.[variant]) return img(VARIANT_IMG[g][variant]);

  // 3순위: 게이지 비율 기반
  if (percentage != null) {
    const p = Math.max(0, Math.min(100, percentage));
    if (p >= 80) return img(`${g}-100.webp`);
    if (p >= 50) return img(`${g}-80.webp`);
    if (p >= 25) return img(`${g}-50.webp`);
    return img(`${g}-20.webp`);
  }

  // 4순위: mood 기반
  const fn = MOOD_MAP[mood] || MOOD_MAP.active;
  return img(fn(g));
}

function selectAnim(mood, percentage, variant, workoutType, clicked) {
  // 클릭 시: 운동 종류에 맞는 3초 애니메이션
  if (clicked) {
    if (workoutType === '러닝' || workoutType === '자전거' || workoutType === '수영') {
      return 'fitbuddy-run 0.4s ease-in-out 7'; // ~2.8s
    }
    return 'fitbuddy-jump 0.6s ease-in-out 5'; // ~3s
  }
  // workoutType이 있으면 정지 (터치 전까지 움직이지 않음)
  if (workoutType) return 'none';
  // variant 기반 (타이머 외 사용처)
  if (variant === 'running' || mood === 'running') return 'fitbuddy-run 0.45s ease-in-out infinite alternate';
  if (variant) return 'fitbuddy-run 0.55s ease-in-out infinite alternate';
  if (mood === 'celebrating' || percentage >= 100) return 'fitbuddy-jump 0.55s ease-in-out infinite';
  if (mood === 'idle' || percentage === 0) return 'fitbuddy-float 3s ease-in-out infinite';
  return 'fitbuddy-breathe 2.5s ease-in-out infinite';
}

const CSS = `
  @keyframes fitbuddy-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes fitbuddy-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes fitbuddy-run{0%{transform:rotate(-5deg) translateX(-4px)}100%{transform:rotate(5deg) translateX(4px)}}
  @keyframes fitbuddy-jump{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-15px) scale(1.07)}}
`;

/**
 * FitBuddyCharacter - 실제 캐릭터 이미지 기반 운동 캐릭터
 *
 * Props:
 * @param {number} size         - 너비(px) [Optional, 기본값: 64]
 * @param {string} gender       - 'female'|'male' [Optional, 기본값: 'female']
 * @param {string} mood         - 'idle'|'active'|'running'|'celebrating' [Optional]
 * @param {number} percentage   - 0-100 게이지 비율 (mood보다 우선) [Optional]
 * @param {string} variant      - 'running'|'squat'|'pushup'|'stretch'|'lunge'|'workout' [Optional]
 * @param {string} workoutType  - 한국어 운동 종류 (variant보다 우선) [Optional]
 * @param {boolean} clickable   - 클릭 시 점프 애니메이션 [Optional, 기본값: false]
 */
function FitBuddyCharacter({ size = 64, gender = 'female', mood = 'active', percentage, variant, workoutType, clickable = false }) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    if (!clickable || clicked) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 3000);
  }

  const src = selectImg(gender, mood, percentage, variant, workoutType);
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
