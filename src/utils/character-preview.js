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
// (다른 11개 조합은 세로 여백이 이미 충분해 같은 scale에서도 넘지 않는다). 이 카드는 MUI
// Card가 아니라 일반 Box라 overflow:hidden이 없어 위로 넘친 부분이 실제로 잘리지는 않지만,
// 시각적으로 2/3번보다 눈에 띄게 위로 솟아 보인다.
// f01/f02/f03 base를 76×98.8 박스에서 alpha 채널로 재는 방식(0.1316, f01 vs avg(f02,f03)
// 신발 끝 차이 0.04px)으로는 데스크톱 Chromium 기준 계산상 거의 완벽히 맞았지만, 실제
// Android 실기기에서는 여전히 f01이 눈에 띄게 위에 떠 보인다는 피드백을 받았다 — 렌더링
// 엔진(Android WebView) 차이일 수 있어 이번엔 alpha 평균값 대신 실기기 육안 결과를 최우선
// 기준으로 삼는다. Android 기준 "13px대에서도 위에 있음, 8~10px 추가 하향 필요"라는 관찰을
// 반영해 22/98.8로 재조정한다(21~23px 권장 범위의 중간값). 이 정도로 내리면 원래 카드
// 여백(라벨과의 gap 4px)으로는 신발이 "1번" 라벨과 겹치므로, 아래 character-style-picker.jsx
// 에서 1/2/3 공통 preview stage 간격을 4px→12px로 넓혀 세 카드 모두 라벨과 안전 여백을
// 확보했다(1/2/3 카드 높이·라벨 위치는 동일하게 유지, f01만 이동). "캐릭터 변경" 선택
// 카드(1/2/3 preview) 전용 보정이라 다른 화면(Profile 요약 카드 등)에는 적용하지 않는다.
const CHIBI_FEMALE_VARIANT1_SELECT_CARD_OFFSET_FRACTION = 0.2227; // 22px / 98.8px(size=76 기준)

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

// [중요 — 이전 버전의 버그] Profile은 실제 MUI <Card>를 쓰는데, @mui/material/Card/Card.js의
// CardRoot는 항상 `overflow: 'hidden'`을 갖고 있다(theme.js의 MuiCard.styleOverrides로도
// 지워지지 않는, 컴포넌트 자체에 박힌 스타일 — node_modules 소스로 직접 확인). 이전 버전은
// scale(1.3)로 시각적으로 커진 캐릭터를 "박스 bottom"에 음수 margin-bottom으로 맞췄는데,
// 음수 margin-bottom은 해당 아이템이 grid 행 높이 계산에 기여하는 몫을 그만큼 줄인다 — 즉
// Card가 실제로 필요한 높이보다 작게 계산되고, 그 결과 이미 위로 넘친 캐릭터 머리 부분이
// Card의 overflow:hidden에 의해 잘렸다("음수 margin이 공간을 늘려준다"는 이전 설명은
// 틀렸다 — 오히려 줄인다). 이번에는 부모 레이아웃을 줄이는 방식 대신, 순서를 바꾼다:
// 1) 캐릭터 column에 `charBoxHeight * scale`만큼의 minHeight를 줘서 스케일된 캐릭터
//    전체(머리~발끝)가 들어갈 자리를 먼저 확보한다(레이아웃이 실제로 커지므로 Card도 함께
//    커진다 — overflow:hidden에 걸릴 일이 없다).
// 2) 그 상태에서 "캐릭터 변경 ›" 버튼 쪽에 작은 양수 margin-bottom을 줘서, 버튼을 실제
//    신발 끝 높이까지 끌어올린다(큰 이미지를 원하는 위치로 밀어내는 대신, 작은 텍스트를
//    캐릭터의 실제 위치에 맞추는 쪽이 더 안전하다).
// 12개 base asset을 110×143 박스 기준 alpha 채널로 실측한 결과 11개는 세로 투명 여백이
// 사실상 없어(0~5px, 평균 1.2px) 이 보정이 필요 없다. chibi female 1번만 원본이 정사각형
// 이라 세로 여백이 커서(스케일 전 기준 박스 높이의 12.6%), scale(1.3, transform-origin:
// 'bottom center')을 거치면 이 여백도 배율만큼 함께 늘어난다(12.6%×1.3≈16.4%) — 이 값을
// 버튼의 추가 margin-bottom으로 쓴다. Playwright로 실제 마크업(overflow:hidden 포함)을
// 렌더링해 머리 잘림 없음 + 신발 끝↔버튼 하단 차이 0px을 확인했다.
const CHIBI_FEMALE_VARIANT1_PROFILE_BOTTOM_OFFSET_FRACTION = 0.1637; // 스케일 전 12.59% × scale 1.3

/**
 * getProfileButtonExtraMarginBottomPx - Profile 캐릭터 요약 카드의 "캐릭터 변경 ›" 버튼에
 * 추가로 줄 양수 margin-bottom(px). getBasePreviewScale과 같은 조합(chibi/female/1)에서만
 * 0이 아닌 값을 반환한다. 버튼은 이미 flex column에서 margin-top:'auto'로 컬럼 바닥에
 * 붙어 있으므로, 여기 반환값을 margin-bottom에 더하면 그만큼 위로 끌어올려진다. "캐릭터
 * 변경" 선택 카드(getBaseVariantSelectCardOffsetY)와는 화면이 달라 별도로 관리한다.
 *
 * @param {string} gender           - 'female'|'male'
 * @param {string} characterStyle   - 'semi'|'chibi'
 * @param {number} characterVariant - 1|2|3
 * @param {number} charBoxHeight    - FitBuddyCharacter 박스 높이(size*1.3, scale 적용 전)
 * @returns {number} margin-bottom에 양수로 더할 값(px) — 0이면 보정 불필요
 */
export function getProfileButtonExtraMarginBottomPx(gender, characterStyle, characterVariant, charBoxHeight) {
  if (characterStyle === 'chibi' && gender === 'female' && Number(characterVariant) === 1) {
    return Math.round(charBoxHeight * CHIBI_FEMALE_VARIANT1_PROFILE_BOTTOM_OFFSET_FRACTION);
  }
  return 0;
}
