import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FitBuddyCharacter from './fitbuddy-character';
import { getBasePreviewScale, getBaseVariantSelectCardOffsetY } from '../../utils/character-preview';

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
          const previewScale = getBasePreviewScale(gender, characterStyle, v);
          const previewOffsetY = getBaseVariantSelectCardOffsetY(gender, characterStyle, v, previewSize * 1.3);
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
                // 1/2/3 세 카드가 공유하는 "미리보기~라벨" 간격 — chibi female 1번을 Android
                // 실기기 기준으로 맞추려면 아래로 더 옮겨야 하는데(getBaseVariantSelectCardOffsetY
                // 참고), 기존 4px 간격으로는 그만큼 옮긴 신발이 "1번" 라벨과 겹친다. 세 카드
                // 모두 같은 gap을 쓰므로 2/3번의 실제 위치는 그대로 유지되면서(카드 높이·라벨
                // 위치는 셋 다 동일), f01만 넓어진 여유 공간을 써서 라벨과 안전하게 떨어진다.
                gap: 1.5,
                py: 1,
                borderRadius: 3,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: selected ? '#6BCB77' : '#E0E0E0',
                bgcolor: selected ? '#E8F5E9' : '#FAFAFA',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
            >
              {/* previewOffsetY는 별도 바깥 wrapper에서 순수 translateY(최종 화면 px)로 적용한다
                  — scale과 같은 transform에 translateY를 같이 넣으면 이동량 자체가 scale
                  배율만큼 같이 늘어나 버려서 의도한 px만큼 못 옮긴다. */}
              <Box sx={previewOffsetY ? { transform: `translateY(${previewOffsetY}px)` } : undefined}>
                <Box sx={previewScale !== 1 ? { transform: `scale(${previewScale})`, transformOrigin: 'bottom center' } : undefined}>
                  <FitBuddyCharacter
                    size={previewSize}
                    gender={gender}
                    characterStyle={characterStyle}
                    characterVariant={v}
                  />
                </Box>
              </Box>
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
