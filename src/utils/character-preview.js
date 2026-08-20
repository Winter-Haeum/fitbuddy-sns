// base(=워크아웃/포즈/percentage/mood 없이 렌더) 미리보기용 표시 정규화. chibi female 1번
// (fitbuddy_f01_base.png.webp)만 원본 캔버스가 정사각형(1254×1254)이라 — 다른 base asset은
// 전부 1024×1536 — object-fit:contain 결과가 chibi female 2/3과 다르게 나온다. 이 문제 하나를
// 위해 scale/select-card offset/Profile offset 세 값을 각각 손으로 조정한 상수로 따로 관리하던
// 것을, "chibi female 그룹 안에서 variant 1을 variant 2/3 평균에 맞춘다"는 계산 하나로
// 대체했다. 대상은 명시적으로 chibi+female만이다 — semi female/semi male/chibi male은 이
// 문제가 없고(2026-08-20 실측: 세 그룹 모두 variant 1이 이미 2/3과 사실상 같은 높이·바닥선),
// 이번 정규화를 다른 그룹까지 확장하면 지금 정상인 캐릭터의 표시가 이유 없이 바뀐다 — 그래서
// getBasePreviewScale 등 아래 공개 함수들은 여전히 "chibi && female && variant===1"일 때만
// 이 계산을 쓰고, 그 외에는 전부 무보정(1 / 0)을 그대로 반환한다.
const CHIBI_FEMALE_ALPHA_BOUNDS = {
  1: { W: 1254, H: 1254, top: 0.0080, bottom: 0.9793 },
  2: { W: 1024, H: 1536, top: 0.0052, bottom: 1 },
  3: { W: 1024, H: 1536, top: 0.0078, bottom: 0.9635 },
};

// FitBuddyCharacter는 항상 width:boxWidth, height:boxHeight(=size*1.3) 박스에 object-fit:
// contain으로 그린다 — 이 함수는 그 렌더링 결과 안에서 "실제 불투명 콘텐츠"의 높이(px)와,
// 콘텐츠 아래쪽 끝이 박스 bottom에서 얼마나 떨어져 있는지(px)를 계산한다. asset의 원본 비율
// (bounds.W/H)이 박스 비율과 다르면(chibi female 1번처럼 정사각형이면) object-fit이 세로가
// 아니라 가로를 기준으로 맞추는 것까지 여기서 함께 처리된다.
function renderedContentGeometry(bounds, boxWidth, boxHeight) {
  const naturalAspect = bounds.W / bounds.H;
  const boxAspect = boxWidth / boxHeight;
  const renderHeight = naturalAspect < boxAspect ? boxHeight : boxWidth / naturalAspect;
  const letterboxTop = (boxHeight - renderHeight) / 2;
  return {
    contentHeight: (bounds.bottom - bounds.top) * renderHeight,
    contentBottomFromBoxBottom: boxHeight - (letterboxTop + bounds.bottom * renderHeight),
  };
}

// chibi female 1번의 alpha 기반 계산값(picker 기준 box 76×98.8에서 약 15px)은 데스크톱
// Chromium 실측이다 — Android 실기기에서는 그 값으로도 여전히 신발이 2/3보다 위에 있다는
// 보고를 두 차례 받았고, 그때 실기기 기준으로 맞춘 값이 22px 부근이었다. WebView와 데스크톱
// Chromium의 webp/transform 렌더링 차이로 보이며, 원인 자체를 더 파고들기보다는 계산값 위에
// 실기기에서 확인된 차이만큼만 별도 보정을 얹는다 — "다시 경험적 상수 하나 추가"가 아니라
// "계산값 + 알려진 렌더링 엔진 차이"로 명확히 분리해 관리한다. Profile 카드는 같은 계산값
// (박스 크기만 다름, 110×143 → 약 22px)이 이미 실기기에서 정상이라고 확인됐으므로 이 보정을
// 더하지 않는다 — "캐릭터 변경" 선택 카드에서만 필요하다.
const PICKER_ANDROID_WEBVIEW_COMPENSATION_FRACTION = 0.07;

/**
 * getChibiFemaleVariant1Normalization - chibi female 1번 base asset이 chibi female 2/3
 * 평균과 같은 시각적 높이·같은 신발 바닥선에 오도록 만드는 데 필요한 scale과 translateY(px)를
 * 계산한다. chibi female 전용 — 다른 gender/style은 호출부에서 아예 이 함수를 부르지 않는다.
 *
 * @param {number} boxWidth  - FitBuddyCharacter size(px)
 * @param {number} boxHeight - size*1.3(px)
 * @returns {{ scale: number, translateY: number }} scale은 transform:scale()에, translateY는
 *   (scale과 별도 레이어로) translateY()/margin-bottom에 바로 쓸 수 있다.
 */
function getChibiFemaleVariant1Normalization(boxWidth, boxHeight) {
  const geo1 = renderedContentGeometry(CHIBI_FEMALE_ALPHA_BOUNDS[1], boxWidth, boxHeight);
  const geo2 = renderedContentGeometry(CHIBI_FEMALE_ALPHA_BOUNDS[2], boxWidth, boxHeight);
  const geo3 = renderedContentGeometry(CHIBI_FEMALE_ALPHA_BOUNDS[3], boxWidth, boxHeight);

  const targetHeight = (geo2.contentHeight + geo3.contentHeight) / 2;
  const targetBottomGap = (geo2.contentBottomFromBoxBottom + geo3.contentBottomFromBoxBottom) / 2;

  const scale = geo1.contentHeight > 0 ? targetHeight / geo1.contentHeight : 1;
  // scale은 transform-origin:'bottom center'로 걸리므로, box-bottom 기준 거리도 같은 배율로
  // 함께 늘어난다 — 그만큼을 반영해야 translateY가 정확해진다.
  const scaledBottomFromBoxBottom = geo1.contentBottomFromBoxBottom * scale;
  const translateY = scaledBottomFromBoxBottom - targetBottomGap;

  return { scale: Math.round(scale * 1000) / 1000, translateY };
}

function isChibiFemaleVariant1(gender, characterStyle, characterVariant) {
  return characterStyle === 'chibi' && gender === 'female' && Number(characterVariant) === 1;
}

/**
 * getBasePreviewScale - base 단계(=워크아웃/포즈/percentage/mood 없이 호출) 미리보기에서 쓰는
 * 표시 보정 배율. chibi+female+variant1에서만 1이 아닌 값을 반환하고, 그 외 모든 조합
 * (semi female/semi male/chibi male 포함, variant 2/3 포함)은 항상 1(보정 없음)이다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @returns {number} transform: scale()에 바로 쓸 수 있는 배율
 */
export function getBasePreviewScale(gender, characterStyle, characterVariant) {
  if (!isChibiFemaleVariant1(gender, characterStyle, characterVariant)) return 1;
  // scale은 박스의 가로세로 "비율"에만 의존하고 절대 px 크기와는 무관하므로(렌더 결과가 항상
  // 같은 비율로 함께 커지고 작아짐) 임의의 기준 박스로 계산해도 결과가 같다.
  return getChibiFemaleVariant1Normalization(100, 130).scale;
}

/**
 * getBaseVariantSelectCardOffsetY - "캐릭터 변경" 선택 카드(1/2/3 preview)에서만 쓰는 세로
 * 보정. chibi+female+variant1에서만 0이 아닌 값을 반환하고, 그 외 모든 조합은 항상 0이다.
 * 계산값에 PICKER_ANDROID_WEBVIEW_COMPENSATION_FRACTION을 더해 실기기에서 확인된 렌더링
 * 차이를 반영한다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @param {number} charBoxHeight    - FitBuddyCharacter 박스 높이(size*1.3)
 * @returns {number} translateY에 바로 쓸 수 있는 아래쪽 이동량(px)
 */
export function getBaseVariantSelectCardOffsetY(gender, characterStyle, characterVariant, charBoxHeight) {
  if (!isChibiFemaleVariant1(gender, characterStyle, characterVariant)) return 0;
  const { translateY } = getChibiFemaleVariant1Normalization(charBoxHeight / 1.3, charBoxHeight);
  const androidCompensation = charBoxHeight * PICKER_ANDROID_WEBVIEW_COMPENSATION_FRACTION;
  return Math.round(translateY + androidCompensation);
}

/**
 * getProfileButtonExtraMarginBottomPx - Profile 캐릭터 요약 카드의 "캐릭터 변경 ›" 버튼에
 * 추가로 줄 양수 margin-bottom(px). chibi+female+variant1에서만 0이 아닌 값을 반환하고,
 * 그 외 모든 조합은 항상 0이다. picker와 같은 정규화 계산을 쓰지만, Profile은 이미 실기기에서
 * 정상으로 확인됐으므로 picker 전용 Android 보정(PICKER_ANDROID_WEBVIEW_COMPENSATION_FRACTION)
 * 은 더하지 않는다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @param {number} charBoxHeight    - FitBuddyCharacter 박스 높이(size*1.3, scale 적용 전)
 * @returns {number} margin-bottom에 양수로 더할 값(px) — 0이면 보정 불필요
 */
export function getProfileButtonExtraMarginBottomPx(gender, characterStyle, characterVariant, charBoxHeight) {
  if (!isChibiFemaleVariant1(gender, characterStyle, characterVariant)) return 0;
  return Math.round(getChibiFemaleVariant1Normalization(charBoxHeight / 1.3, charBoxHeight).translateY);
}
