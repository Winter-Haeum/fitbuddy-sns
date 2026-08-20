// base(=워크아웃/포즈/percentage/mood 없이 렌더) 미리보기용 표시 정규화. 이전에는 chibi
// female 1번 하나를 위해 scale/select-card offset/Profile offset 세 값을 각각 하드코딩된
// 상수 + `if (style==='chibi' && gender==='female' && variant===1)` 조건으로 따로 관리했다.
// 캐릭터 조합이 늘어날 때마다 이런 예외가 계속 누적되는 구조라, 대신 "gender+style 그룹 안에서
// variant 1을 variant 2/3의 평균에 맞춘다"는 규칙 하나를 모든 조합에 동일하게 적용하는
// 방식으로 바꿨다 — 실제로 값이 필요한 조합(현재는 chibi female, 그리고 이번에 정밀 측정
// 과정에서 존재가 드러난 chibi male의 작은 오차)만 결과적으로 0이 아닌 보정을 받고, 나머지는
// 계산 결과 자체가 자연스럽게 무보정에 가깝게 나온다 — 코드에 "이 조합만 특별하다"는 분기가
// 없다.

// 12개 base asset(semi/chibi × female/male × 1/2/3) 전부를 Playwright + canvas로 렌더링해
// 알파 채널(alpha>10을 몸통으로 판정)로 실측한 원본 캔버스 크기와 콘텐츠 위치(0~1 비율).
// asset 파일 자체는 건드리지 않는다 — 이 표는 순수 읽기 전용 실측 데이터다. chibi female 1번
// (fitbuddy_f01_base.png.webp)만 W===H(정사각형, 1254×1254)로 다른 11개(1024×1536)와
// 원본 캔버스 비율 자체가 다르다는 사실이 바로 이 표에 드러난다 — 코드에서 그 사실을 안다는
// 표시로 별도 조건문을 쓸 필요가 없다.
const BASE_ALPHA_BOUNDS = {
  semi: {
    f: {
      1: { W: 1024, H: 1536, top: 0.0078, bottom: 0.9876 },
      2: { W: 1024, H: 1536, top: 0.0078, bottom: 1 },
      3: { W: 1024, H: 1536, top: 0.0124, bottom: 0.9961 },
    },
    m: {
      1: { W: 1024, H: 1536, top: 0.0052, bottom: 0.9935 },
      2: { W: 1024, H: 1536, top: 0.0072, bottom: 0.9948 },
      3: { W: 1024, H: 1536, top: 0.0046, bottom: 0.9935 },
    },
  },
  chibi: {
    f: {
      1: { W: 1254, H: 1254, top: 0.0080, bottom: 0.9793 },
      2: { W: 1024, H: 1536, top: 0.0052, bottom: 1 },
      3: { W: 1024, H: 1536, top: 0.0078, bottom: 0.9635 },
    },
    m: {
      1: { W: 1024, H: 1536, top: 0.0241, bottom: 0.9616 },
      2: { W: 1024, H: 1536, top: 0.0085, bottom: 0.9863 },
      3: { W: 1024, H: 1536, top: 0.0117, bottom: 0.9883 },
    },
  },
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

/**
 * getVariant1Normalization - 같은 gender+style 안에서 variant 1의 base asset이 variant 2/3
 * 평균과 같은 시각적 높이·같은 신발 바닥선에 오도록 만드는 데 필요한 scale과 translateY(px)를
 * 계산한다. gender/style을 조건 분기하지 않는다 — BASE_ALPHA_BOUNDS의 실측값만으로 4개
 * gender+style 그룹 모두에 동일한 계산을 적용하고, 그 결과 필요 없는 그룹은 scale≈1·
 * translateY≈0이 자연스럽게 나온다. variant 2/3은 애초에 이 함수를 호출하지 않는다 — "2/3은
 * 절대 움직이지 않는다"는 정책 자체가 목적이라, 이 둘은 정규화 대상이 아니라 항상 기준점으로만
 * 쓰인다.
 *
 * @param {string} gender         - 'female'|'male'
 * @param {string} characterStyle - 'semi'|'chibi'
 * @param {number} boxWidth       - FitBuddyCharacter size(px)
 * @param {number} boxHeight      - size*1.3(px)
 * @returns {{ scale: number, translateY: number }} scale은 transform:scale()에, translateY는
 *   (scale과 별도 레이어로) translateY()/margin-bottom에 바로 쓸 수 있다.
 */
export function getVariant1Normalization(gender, characterStyle, boxWidth, boxHeight) {
  const g = gender === 'male' ? 'm' : 'f';
  const group = BASE_ALPHA_BOUNDS[characterStyle === 'chibi' ? 'chibi' : 'semi']?.[g];
  if (!group) return { scale: 1, translateY: 0 };

  const geo1 = renderedContentGeometry(group[1], boxWidth, boxHeight);
  const geo2 = renderedContentGeometry(group[2], boxWidth, boxHeight);
  const geo3 = renderedContentGeometry(group[3], boxWidth, boxHeight);

  const targetHeight = (geo2.contentHeight + geo3.contentHeight) / 2;
  const targetBottomGap = (geo2.contentBottomFromBoxBottom + geo3.contentBottomFromBoxBottom) / 2;

  const scale = geo1.contentHeight > 0 ? targetHeight / geo1.contentHeight : 1;
  // scale은 transform-origin:'bottom center'로 걸리므로, box-bottom 기준 거리도 같은 배율로
  // 함께 늘어난다 — 그만큼을 반영해야 translateY가 정확해진다.
  const scaledBottomFromBoxBottom = geo1.contentBottomFromBoxBottom * scale;
  const translateY = Math.round(scaledBottomFromBoxBottom - targetBottomGap);

  return { scale: Math.round(scale * 1000) / 1000, translateY };
}

/**
 * getBasePreviewScale - base 단계(=워크아웃/포즈/percentage/mood 없이 호출) 미리보기에서 쓰는
 * 표시 보정 배율. variant 1에서만 getVariant1Normalization의 scale을 쓰고, 2/3은 항상 1
 * (보정 없음)이다. scale은 박스의 가로세로 "비율"에만 의존하고 절대 px 크기와는 무관하므로
 * (렌더 결과가 항상 같은 비율로 함께 커지고 작아짐) 임의의 기준 박스로 계산해도 결과가
 * 같다 — 이 함수가 호출부에서 실제 size를 안 받는 기존 시그니처를 그대로 유지할 수 있는 이유.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @returns {number} transform: scale()에 바로 쓸 수 있는 배율
 */
export function getBasePreviewScale(gender, characterStyle, characterVariant) {
  if (Number(characterVariant) !== 1) return 1;
  return getVariant1Normalization(gender, characterStyle, 100, 130).scale;
}

/**
 * getBaseVariantSelectCardOffsetY - "캐릭터 변경" 선택 카드(1/2/3 preview)에서만 쓰는 세로
 * 보정. variant 1에서만 getVariant1Normalization의 translateY를 쓰고, 2/3은 항상 0이다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @param {number} charBoxHeight    - FitBuddyCharacter 박스 높이(size*1.3)
 * @returns {number} translateY에 바로 쓸 수 있는 아래쪽 이동량(px)
 */
export function getBaseVariantSelectCardOffsetY(gender, characterStyle, characterVariant, charBoxHeight) {
  if (Number(characterVariant) !== 1) return 0;
  return getVariant1Normalization(gender, characterStyle, charBoxHeight / 1.3, charBoxHeight).translateY;
}

/**
 * getProfileButtonExtraMarginBottomPx - Profile 캐릭터 요약 카드의 "캐릭터 변경 ›" 버튼에
 * 추가로 줄 양수 margin-bottom(px). variant 1에서만 getVariant1Normalization의 translateY를
 * 쓰고, 2/3은 항상 0이다. picker(getBaseVariantSelectCardOffsetY)와 같은 정규화 규칙을
 * 쓰지만, 화면마다 박스 크기가 달라 translateY 절대값은 박스 크기에 비례해 다르게 나온다 —
 * 그래서 함수는 공유하되 호출은 화면별로 따로 유지한다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @param {number} charBoxHeight    - FitBuddyCharacter 박스 높이(size*1.3, scale 적용 전)
 * @returns {number} margin-bottom에 양수로 더할 값(px) — 0이면 보정 불필요
 */
export function getProfileButtonExtraMarginBottomPx(gender, characterStyle, characterVariant, charBoxHeight) {
  if (Number(characterVariant) !== 1) return 0;
  return getVariant1Normalization(gender, characterStyle, charBoxHeight / 1.3, charBoxHeight).translateY;
}
