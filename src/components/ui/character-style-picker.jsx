import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FitBuddyCharacter from './fitbuddy-character';

const STYLE_OPTIONS = [
  { value: 'semi', label: '세미' },
  { value: 'chibi', label: '치비' },
];
const VARIANT_OPTIONS = [1, 2, 3];

/**
 * CharacterStylePicker - 캐릭터 style(semi/chibi) + variant(1/2/3) 선택 UI. variant 3개는
 * 실제 base asset(FitBuddyCharacter에 workoutType/percentage/mood 없이 호출 — resolver
 * 5순위 base 우선순위)으로 미리보기를 보여준다.
 *
 * Props:
 * @param {string}   gender           - 'female'|'male' — 미리보기 asset 결정용, 이 컴포넌트는 수정하지 않음 [Required]
 * @param {string}   characterStyle   - 'semi'|'chibi' [Required]
 * @param {number}   characterVariant - 1|2|3 [Required]
 * @param {function} onStyleChange    - (style: string) => void [Required]
 * @param {function} onVariantChange  - (variant: number) => void [Required]
 * @param {number}   previewSize      - variant 미리보기 캐릭터 크기(px) [Optional, 기본값: 76]
 *
 * Example usage:
 * <CharacterStylePicker gender='female' characterStyle={style} characterVariant={variant}
 *   onStyleChange={setStyle} onVariantChange={setVariant} />
 */
function CharacterStylePicker({
  gender,
  characterStyle,
  characterVariant,
  onStyleChange,
  onVariantChange,
  previewSize = 76,
}) {
  return (
    <Box>
      <Typography variant='body2' sx={{ fontWeight: 700, mb: 0.8 }}>스타일</Typography>
      <ToggleButtonGroup
        exclusive
        value={characterStyle}
        onChange={(e, val) => { if (val) onStyleChange(val); }}
        size='small'
        sx={{ mb: 2, width: '100%' }}
      >
        {STYLE_OPTIONS.map((opt) => (
          <ToggleButton
            key={opt.value}
            value={opt.value}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontWeight: 700,
              '&.Mui-selected': { bgcolor: '#E8F5E9', color: '#2E7D32', borderColor: '#6BCB77' },
            }}
          >
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Typography variant='body2' sx={{ fontWeight: 700, mb: 0.8 }}>캐릭터</Typography>
      <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center' }}>
        {VARIANT_OPTIONS.map((v) => {
          const selected = characterVariant === v;
          return (
            <Box
              key={v}
              onClick={() => onVariantChange(v)}
              sx={{
                flex: 1,
                maxWidth: 110,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                py: 1,
                borderRadius: 3,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: selected ? '#6BCB77' : '#E0E0E0',
                bgcolor: selected ? '#E8F5E9' : '#FAFAFA',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
            >
              <FitBuddyCharacter
                size={previewSize}
                gender={gender}
                characterStyle={characterStyle}
                characterVariant={v}
              />
              <Typography
                variant='caption'
                sx={{ fontWeight: selected ? 700 : 400, color: selected ? '#2E7D32' : '#757575' }}
              >
                {v}번
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default CharacterStylePicker;
