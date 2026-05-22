import Box from '@mui/material/Box';

/**
 * FitBuddyCharacter - 브랜드 SVG 러닝 캐릭터
 *
 * Props:
 * @param {string|number} size - SVG 렌더링 너비(px) [Optional, 기본값: 64]
 *
 * Example usage:
 * <FitBuddyCharacter size={72} />
 */
function FitBuddyCharacter({ size = 64 }) {
  return (
    <Box
      sx={{
        display: 'inline-block',
        lineHeight: 0,
        '@keyframes runBounce': {
          '0%, 100%': { transform: 'translateY(0px) rotate(-3deg)' },
          '50%': { transform: 'translateY(-9px) rotate(3deg)' },
        },
        '&:hover': {
          animation: 'runBounce 0.42s ease-in-out infinite',
        },
        cursor: 'default',
      }}
    >
      <svg
        width={size}
        height={Math.round(size * 1.2)}
        viewBox='0 0 64 76'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        {/* 머리 */}
        <circle cx='32' cy='11' r='10' fill='#6BCB77' />
        {/* 눈 */}
        <circle cx='28.5' cy='10' r='1.6' fill='white' />
        <circle cx='35.5' cy='10' r='1.6' fill='white' />
        {/* 눈썹 */}
        <path d='M27 7.5 Q28.5 6.5 30 7.5' stroke='white' strokeWidth='1.2' strokeLinecap='round' fill='none' />
        <path d='M34 7.5 Q35.5 6.5 37 7.5' stroke='white' strokeWidth='1.2' strokeLinecap='round' fill='none' />
        {/* 웃음 */}
        <path d='M28 15 Q32 18.5 36 15' stroke='white' strokeWidth='1.5' strokeLinecap='round' fill='none' />
        {/* 목 */}
        <rect x='29' y='21' width='6' height='4' rx='2' fill='#6BCB77' />
        {/* 몸통 (티셔츠) */}
        <rect x='23' y='25' width='18' height='13' rx='5' fill='#5DADEC' />
        {/* 왼팔 (앞으로) */}
        <line x1='23' y1='29' x2='11' y2='21' stroke='#5DADEC' strokeWidth='5' strokeLinecap='round' />
        {/* 오른팔 (뒤로) */}
        <line x1='41' y1='29' x2='53' y2='37' stroke='#5DADEC' strokeWidth='5' strokeLinecap='round' />
        {/* 반바지 */}
        <rect x='24' y='38' width='16' height='8' rx='3' fill='#388E3C' />
        {/* 왼쪽 다리 (앞으로) */}
        <path d='M30 46 Q24 57 18 63' stroke='#6BCB77' strokeWidth='5' strokeLinecap='round' fill='none' />
        {/* 오른쪽 다리 (뒤로) */}
        <path d='M34 46 Q41 56 47 52' stroke='#6BCB77' strokeWidth='5' strokeLinecap='round' fill='none' />
        {/* 왼쪽 신발 */}
        <ellipse cx='18' cy='63' rx='5.5' ry='3' fill='#FF7043' />
        {/* 오른쪽 신발 */}
        <ellipse cx='47' cy='52' rx='5.5' ry='3' fill='#FF7043' />
      </svg>
    </Box>
  );
}

export default FitBuddyCharacter;
