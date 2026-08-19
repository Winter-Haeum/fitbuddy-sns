// chibi female 1번 base asset(fitbuddy_f01_base.png.webp)만 원본 캔버스가 1254×1254(정사각형)로
// 저장돼 있다 — 다른 base/exercise/progress asset 전부(다른 11개 base 포함)는 표준 1024×1536
// (세로 2:3)이다. FitBuddyCharacter는 항상 width:size, height:size*1.3(가로:세로 1:1.3) 박스에
// object-fit:contain으로 그리므로, 표준 캔버스(가로:세로 비율 0.667 < 박스 비율 0.769)는 세로가
// 박스를 100% 채우지만, 정사각형(비율 1.0 > 0.769)인 f01 base는 대신 가로가 기준이 되어
// 세로는 박스의 1/1.3(≈77%)만 채운다 — 이게 "치비 1번만 유독 작아 보인다"의 정확한 원인이다.
// asset 자체는 건드리지 않고, 이 한 조합의 미리보기에만 1/(1/1.3)=1.3배 표시 보정을 준다(1.3은
// 임의 값이 아니라 박스 자체의 가로세로 비율에서 그대로 나온 값 — 다른 11개 조합과 시각적
// 높이가 비슷해진다).
const CHIBI_FEMALE_VARIANT1_BASE_PREVIEW_SCALE = 1.3;

/**
 * getBasePreviewScale - base 단계(=워크아웃/포즈/percentage/mood 없이 호출) 미리보기에서만
 * 의미 있는 표시 보정 배율을 반환한다. 위 캔버스 불일치를 겪는 조합(chibi/female/1)에서만
 * 1이 아닌 값을 반환하고, 나머지 11개 조합은 항상 1(보정 없음)이다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @returns {number} transform: scale()에 바로 쓸 수 있는 배율
 */
export function getBasePreviewScale(gender, characterStyle, characterVariant) {
  if (characterStyle === 'chibi' && gender === 'female' && Number(characterVariant) === 1) {
    return CHIBI_FEMALE_VARIANT1_BASE_PREVIEW_SCALE;
  }
  return 1;
}
