import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

/**
 * FilterChipGroup - 가로 스크롤 가능한 필터 칩 그룹
 *
 * Props:
 * @param {Array}    options      - [{key, label}] 선택지 배열 [Required]
 * @param {string}   value        - 현재 선택된 key (null 이면 미선택) [Required]
 * @param {function} onChange     - (key) => void 선택 변경 콜백 [Required]
 * @param {string}   activeColor  - 선택된 칩 배경색 [Optional, 기본값: '#A084E8']
 * @param {number}   chipHeight   - 칩 높이(px) [Optional, 기본값: 28]
 * @param {object}   sx           - 컨테이너 추가 sx 스타일 [Optional]
 *
 * Example usage:
 * <FilterChipGroup
 *   options={[{key:'all', label:'전체'}, {key:'mine', label:'내 글'}]}
 *   value={filter}
 *   onChange={setFilter}
 *   activeColor="#5DA9E9"
 * />
 */
export default function FilterChipGroup({
  options,
  value,
  onChange,
  activeColor = '#A084E8',
  chipHeight = 28,
  sx = {},
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        ...sx,
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <Chip
            key={opt.key}
            label={opt.label}
            onClick={() => onChange(opt.key)}
            size='small'
            sx={{
              flexShrink: 0,
              height: chipHeight,
              fontSize: '0.8rem',
              bgcolor: isActive ? activeColor : 'transparent',
              color: isActive ? 'white' : '#666',
              border: `1.5px solid ${isActive ? activeColor : '#E0E0E0'}`,
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.18s',
              '&:hover': { borderColor: activeColor },
            }}
          />
        );
      })}
    </Box>
  );
}
