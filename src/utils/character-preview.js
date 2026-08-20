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

// 위 getBasePreviewScale의 scale(1.3)은 transform-origin:'bottom center'로 걸린다 — 박스
// 아래쪽을 고정점 삼아 커지므로, 위쪽이 아래쪽보다 훨씬 많이 위로 밀려 올라간다. chibi
// female 1번은 원본이 정사각형이라 다른 조합보다 세로 여백 자체가 훨씬 작았던 탓에, 이
// 여백이 scale로 확대되면서 "캐릭터 변경" 선택 카드의 둥근 상단 테두리를 실제로 넘어간다
// (다른 11개 조합은 세로 여백이 이미 충분해 같은 scale에서도 넘지 않는다). "캐릭터 변경"
// 카드 76×98.8(size=76 기준) 박스에서 chibi 2/3번의 "카드 상단→머리 위 여백"을 실측하면
// 약 10px인데, chibi 1번은 scale(1.3)만 걸면 이 여백이 음수(카드 밖으로 넘음)가 된다.
// alpha 채널 실측(1번 위쪽 투명 여백 11.1%, 렌더 높이 대비)을 바탕으로 2/3번과 같은 여백이
// 되는 지점을 역산하면 박스 높이(size*1.3)의 약 15.2% — 이 비율만큼 스케일된 캐릭터 전체를
// 아래로 더 옮기면 상단 여백이 2/3번과 비슷해지고, 발과 "1번" 라벨 사이 여백도 여전히
// 양수로 남는다(겹치지 않음). "캐릭터 변경" 선택 카드(1/2/3 preview) 전용 보정이라 다른
// 화면(Profile 요약 카드 등)에는 적용하지 않는다.
const CHIBI_FEMALE_VARIANT1_SELECT_CARD_OFFSET_FRACTION = 0.152;

/**
 * getBaseVariantSelectCardOffsetY - "캐릭터 변경" 선택 카드(1/2/3 preview)에서만 쓰는 세로
 * 보정. getBasePreviewScale과 같은 조합(chibi/female/1)에서만 0이 아닌 값을 반환한다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @param {number} charBoxHeight    - FitBuddyCharacter 박스 높이(size*1.3)
 * @returns {number} translateY에 바로 쓸 수 있는 아래쪽 이동량(px)
 */
export function getBaseVariantSelectCardOffsetY(gender, characterStyle, characterVariant, charBoxHeight) {
  if (characterStyle === 'chibi' && gender === 'female' && Number(characterVariant) === 1) {
    return Math.round(charBoxHeight * CHIBI_FEMALE_VARIANT1_SELECT_CARD_OFFSET_FRACTION);
  }
  return 0;
}
