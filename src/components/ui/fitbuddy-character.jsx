import Box from '@mui/material/Box';

function FemaleSVG({ size }) {
  return (
    <svg width={size} height={Math.round(size * 1.3)} viewBox='0 0 100 130' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* Hair back */}
      <ellipse cx='50' cy='34' rx='24' ry='26' fill='#2C1810' />
      {/* Head */}
      <circle cx='50' cy='36' r='22' fill='#FFE0C8' />
      {/* Hair top */}
      <path d='M28,28 Q30,10 50,9 Q70,10 72,28 Q65,17 50,16 Q35,17 28,28Z' fill='#2C1810' />
      {/* Hair left side */}
      <path d='M28,28 Q22,38 23,52 Q26,53 29,48 Q28,38 32,32Z' fill='#2C1810' />
      {/* Hair right side */}
      <path d='M72,28 Q78,38 77,52 Q74,53 71,48 Q72,38 68,32Z' fill='#2C1810' />
      {/* Eyes */}
      <circle cx='43' cy='34' r='5' fill='#1C1C3A' />
      <circle cx='57' cy='34' r='5' fill='#1C1C3A' />
      <circle cx='44.5' cy='32.5' r='1.8' fill='white' />
      <circle cx='58.5' cy='32.5' r='1.8' fill='white' />
      {/* Cheeks */}
      <ellipse cx='36' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.5' />
      <ellipse cx='64' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.5' />
      {/* Mouth */}
      <path d='M45,46 Q50,51 55,46' stroke='#CC7755' strokeWidth='1.5' fill='none' strokeLinecap='round' />
      {/* Neck */}
      <rect x='44' y='57' width='12' height='7' fill='#FFE0C8' />
      {/* Body hoodie (navy blue) */}
      <rect x='30' y='62' width='40' height='33' rx='9' fill='#3D5A8A' />
      <path d='M46,64 L44,73' stroke='#2A4070' strokeWidth='1.2' strokeLinecap='round' />
      <path d='M54,64 L56,73' stroke='#2A4070' strokeWidth='1.2' strokeLinecap='round' />
      <rect x='37' y='83' width='26' height='10' rx='4' fill='#2A4070' />
      {/* Left arm */}
      <path d='M30,70 Q18,78 17,93' stroke='#3D5A8A' strokeWidth='11' strokeLinecap='round' fill='none' />
      <circle cx='17' cy='96' r='6' fill='#FFE0C8' />
      {/* Right arm (waving) */}
      <path d='M70,70 Q82,60 85,45' stroke='#3D5A8A' strokeWidth='11' strokeLinecap='round' fill='none' />
      <circle cx='85' cy='41' r='7' fill='#FFE0C8' />
      {/* Pants (olive) */}
      <rect x='31' y='93' width='17' height='28' rx='5' fill='#4A5240' />
      <rect x='52' y='93' width='17' height='28' rx='5' fill='#4A5240' />
      {/* Shoes */}
      <ellipse cx='40' cy='123' rx='11' ry='6' fill='#5C3D1E' />
      <ellipse cx='60' cy='123' rx='11' ry='6' fill='#5C3D1E' />
      <ellipse cx='37' cy='121' rx='5.5' ry='3.5' fill='#7A5230' />
      <ellipse cx='57' cy='121' rx='5.5' ry='3.5' fill='#7A5230' />
    </svg>
  );
}

function MaleSVG({ size }) {
  return (
    <svg width={size} height={Math.round(size * 1.3)} viewBox='0 0 100 130' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* Hair (short, slightly spiky) */}
      <ellipse cx='50' cy='31' rx='22' ry='17' fill='#2C1810' />
      <path d='M36,24 Q40,8 50,9 Q60,8 64,24 Q58,14 50,14 Q42,14 36,24Z' fill='#2C1810' />
      {/* Head */}
      <circle cx='50' cy='36' r='22' fill='#FFE0C8' />
      {/* Hair sides */}
      <path d='M28,30 Q27,40 29,48' stroke='#2C1810' strokeWidth='6' strokeLinecap='round' fill='none' />
      <path d='M72,30 Q73,40 71,48' stroke='#2C1810' strokeWidth='6' strokeLinecap='round' fill='none' />
      {/* Eyes */}
      <circle cx='43' cy='34' r='5' fill='#1C1C3A' />
      <circle cx='57' cy='34' r='5' fill='#1C1C3A' />
      <circle cx='44.5' cy='32.5' r='1.8' fill='white' />
      <circle cx='58.5' cy='32.5' r='1.8' fill='white' />
      {/* Cheeks */}
      <ellipse cx='36' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.4' />
      <ellipse cx='64' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.4' />
      {/* Mouth */}
      <path d='M45,46 Q50,51 55,46' stroke='#CC7755' strokeWidth='1.5' fill='none' strokeLinecap='round' />
      {/* Neck */}
      <rect x='44' y='57' width='12' height='7' fill='#FFE0C8' />
      {/* Body hoodie (orange/red) */}
      <rect x='30' y='62' width='40' height='33' rx='9' fill='#D4532A' />
      <path d='M46,64 L44,73' stroke='#B04020' strokeWidth='1.2' strokeLinecap='round' />
      <path d='M54,64 L56,73' stroke='#B04020' strokeWidth='1.2' strokeLinecap='round' />
      <rect x='37' y='83' width='26' height='10' rx='4' fill='#B04020' />
      {/* Left arm */}
      <path d='M30,70 Q18,78 17,93' stroke='#D4532A' strokeWidth='11' strokeLinecap='round' fill='none' />
      <circle cx='17' cy='96' r='6' fill='#FFE0C8' />
      {/* Right arm (waving) */}
      <path d='M70,70 Q82,60 85,45' stroke='#D4532A' strokeWidth='11' strokeLinecap='round' fill='none' />
      <circle cx='85' cy='41' r='7' fill='#FFE0C8' />
      {/* Pants (dark blue) */}
      <rect x='31' y='93' width='17' height='28' rx='5' fill='#2A3A5C' />
      <rect x='52' y='93' width='17' height='28' rx='5' fill='#2A3A5C' />
      {/* Shoes */}
      <ellipse cx='40' cy='123' rx='11' ry='6' fill='#5C3D1E' />
      <ellipse cx='60' cy='123' rx='11' ry='6' fill='#5C3D1E' />
      <ellipse cx='37' cy='121' rx='5.5' ry='3.5' fill='#7A5230' />
      <ellipse cx='57' cy='121' rx='5.5' ry='3.5' fill='#7A5230' />
    </svg>
  );
}

/**
 * FitBuddyCharacter - 치비 스타일 운동 캐릭터 (여성/남성)
 *
 * Props:
 * @param {number} size - 캐릭터 너비(px) [Optional, 기본값: 64]
 * @param {string} gender - 'female' | 'male' [Optional, 기본값: 'female']
 *
 * Example usage:
 * <FitBuddyCharacter size={80} gender="male" />
 */
function FitBuddyCharacter({ size = 64, gender = 'female' }) {
  return (
    <Box sx={{ display: 'inline-block', lineHeight: 0 }}>
      {gender === 'male' ? <MaleSVG size={size} /> : <FemaleSVG size={size} />}
    </Box>
  );
}

export default FitBuddyCharacter;
