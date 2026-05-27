import Box from '@mui/material/Box';

function renderEyes(mood) {
  switch (mood) {
    case 'idle':
      return (
        <>
          <path d='M39,34 Q43,38 47,34' stroke='#1C1C3A' strokeWidth='2.5' fill='none' strokeLinecap='round' />
          <path d='M53,34 Q57,38 61,34' stroke='#1C1C3A' strokeWidth='2.5' fill='none' strokeLinecap='round' />
          <text x='64' y='27' fontSize='7' fill='#A084E8' opacity='0.75' fontFamily='sans-serif'>z</text>
          <text x='70' y='21' fontSize='5' fill='#A084E8' opacity='0.55' fontFamily='sans-serif'>z</text>
        </>
      );
    case 'running':
      return (
        <>
          <circle cx='43' cy='35' r='4' fill='#1C1C3A' />
          <circle cx='57' cy='35' r='4' fill='#1C1C3A' />
          <circle cx='44.5' cy='33.5' r='1.5' fill='white' />
          <circle cx='58.5' cy='33.5' r='1.5' fill='white' />
          <path d='M39,29 Q43,27 47,29' stroke='#2C1810' strokeWidth='1.8' fill='none' strokeLinecap='round' />
          <path d='M53,29 Q57,27 61,29' stroke='#2C1810' strokeWidth='1.8' fill='none' strokeLinecap='round' />
        </>
      );
    case 'celebrating':
      return (
        <>
          <path d='M38,36 Q43,29 48,36' stroke='#1C1C3A' strokeWidth='2.8' fill='none' strokeLinecap='round' />
          <path d='M52,36 Q57,29 62,36' stroke='#1C1C3A' strokeWidth='2.8' fill='none' strokeLinecap='round' />
          <circle cx='66' cy='26' r='2' fill='#FFB300' opacity='0.9' />
          <circle cx='34' cy='26' r='1.5' fill='#FF7043' opacity='0.8' />
        </>
      );
    default:
      return (
        <>
          <circle cx='43' cy='34' r='5' fill='#1C1C3A' />
          <circle cx='57' cy='34' r='5' fill='#1C1C3A' />
          <circle cx='44.5' cy='32.5' r='1.8' fill='white' />
          <circle cx='58.5' cy='32.5' r='1.8' fill='white' />
        </>
      );
  }
}

function renderMouth(mood) {
  switch (mood) {
    case 'idle':
      return <path d='M47,47 Q50,48.5 53,47' stroke='#CC7755' strokeWidth='1.5' fill='none' strokeLinecap='round' />;
    case 'running':
      return <path d='M44,46 Q50,53 56,46' stroke='#CC7755' strokeWidth='1.5' fill='none' strokeLinecap='round' />;
    case 'celebrating':
      return (
        <>
          <path d='M42,45 Q50,55 58,45' stroke='#CC7755' strokeWidth='1.5' fill='none' strokeLinecap='round' />
          <ellipse cx='50' cy='50' rx='5' ry='3' fill='#CC9977' opacity='0.25' />
        </>
      );
    default:
      return <path d='M45,46 Q50,51 55,46' stroke='#CC7755' strokeWidth='1.5' fill='none' strokeLinecap='round' />;
  }
}

function renderArms(mood, color) {
  switch (mood) {
    case 'idle':
      return (
        <>
          <path d='M30,72 Q22,82 20,97' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='20' cy='100' r='6' fill='#FFE0C8' />
          <path d='M70,72 Q78,82 77,97' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='77' cy='100' r='6' fill='#FFE0C8' />
        </>
      );
    case 'running':
      return (
        <>
          <path d='M30,70 Q16,63 14,50' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='14' cy='47' r='6' fill='#FFE0C8' />
          <path d='M70,70 Q82,76 82,91' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='82' cy='94' r='6' fill='#FFE0C8' />
        </>
      );
    case 'celebrating':
      return (
        <>
          <path d='M30,68 Q16,52 13,36' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='13' cy='33' r='6' fill='#FFE0C8' />
          <path d='M70,68 Q84,52 87,36' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='87' cy='33' r='6' fill='#FFE0C8' />
        </>
      );
    default:
      return (
        <>
          <path d='M30,70 Q18,78 17,93' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='17' cy='96' r='6' fill='#FFE0C8' />
          <path d='M70,70 Q82,60 85,45' stroke={color} strokeWidth='11' strokeLinecap='round' fill='none' />
          <circle cx='85' cy='41' r='7' fill='#FFE0C8' />
        </>
      );
  }
}

function FemaleSVG({ size, mood }) {
  const color = '#3D5A8A';
  const darker = '#2A4070';
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
      {renderEyes(mood)}
      {/* Cheeks */}
      <ellipse cx='36' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.5' />
      <ellipse cx='64' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.5' />
      {/* Mouth */}
      {renderMouth(mood)}
      {/* Neck */}
      <rect x='44' y='57' width='12' height='7' fill='#FFE0C8' />
      {/* Body hoodie (navy blue) */}
      <rect x='30' y='62' width='40' height='33' rx='9' fill={color} />
      <path d='M46,64 L44,73' stroke={darker} strokeWidth='1.2' strokeLinecap='round' />
      <path d='M54,64 L56,73' stroke={darker} strokeWidth='1.2' strokeLinecap='round' />
      <rect x='37' y='83' width='26' height='10' rx='4' fill={darker} />
      {/* Arms */}
      {renderArms(mood, color)}
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

function MaleSVG({ size, mood }) {
  const color = '#D4532A';
  const darker = '#B04020';
  return (
    <svg width={size} height={Math.round(size * 1.3)} viewBox='0 0 100 130' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* Hair (short spiky) */}
      <ellipse cx='50' cy='31' rx='22' ry='17' fill='#2C1810' />
      <path d='M36,24 Q40,8 50,9 Q60,8 64,24 Q58,14 50,14 Q42,14 36,24Z' fill='#2C1810' />
      {/* Head */}
      <circle cx='50' cy='36' r='22' fill='#FFE0C8' />
      {/* Hair sides */}
      <path d='M28,30 Q27,40 29,48' stroke='#2C1810' strokeWidth='6' strokeLinecap='round' fill='none' />
      <path d='M72,30 Q73,40 71,48' stroke='#2C1810' strokeWidth='6' strokeLinecap='round' fill='none' />
      {/* Eyes */}
      {renderEyes(mood)}
      {/* Cheeks */}
      <ellipse cx='36' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.4' />
      <ellipse cx='64' cy='42' rx='5' ry='3' fill='#FF9999' opacity='0.4' />
      {/* Mouth */}
      {renderMouth(mood)}
      {/* Neck */}
      <rect x='44' y='57' width='12' height='7' fill='#FFE0C8' />
      {/* Body hoodie (orange) */}
      <rect x='30' y='62' width='40' height='33' rx='9' fill={color} />
      <path d='M46,64 L44,73' stroke={darker} strokeWidth='1.2' strokeLinecap='round' />
      <path d='M54,64 L56,73' stroke={darker} strokeWidth='1.2' strokeLinecap='round' />
      <rect x='37' y='83' width='26' height='10' rx='4' fill={darker} />
      {/* Arms */}
      {renderArms(mood, color)}
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
 * @param {string} mood - 'idle' | 'active' | 'running' | 'celebrating' [Optional, 기본값: 'active']
 *
 * Example usage:
 * <FitBuddyCharacter size={80} gender='male' mood='running' />
 */
function FitBuddyCharacter({ size = 64, gender = 'female', mood = 'active' }) {
  return (
    <Box sx={{ display: 'inline-block', lineHeight: 0 }}>
      {gender === 'male' ? <MaleSVG size={size} mood={mood} /> : <FemaleSVG size={size} mood={mood} />}
    </Box>
  );
}

export default FitBuddyCharacter;
