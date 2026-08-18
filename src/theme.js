import { createTheme } from '@mui/material/styles';

// 글자 크기 설정(마이페이지 > 설정)에서 사용하는 4단계. 값 자체(문자열)는 localStorage에도
// 그대로 저장되므로 함부로 이름을 바꾸지 않는다 — 바꾸면 기존 사용자의 저장된 선택이 무효화된다.
export const FONT_SCALE_LEVELS = ['small', 'medium', 'large', 'xlarge'];
export const FONT_SCALE_LABELS = { small: '작게', medium: '보통', large: '크게', xlarge: '아주 크게' };

// 지금까지 FitBuddy가 써온 고정 typography 값(아래 BASE_REM)이 이미 "크게"에 해당하는
// 수준이므로, 기존 사용자 화면이 갑자기 바뀌지 않도록 기본값을 large로 둔다.
export const DEFAULT_FONT_SCALE = 'large';

// title/subtitle/body/caption 등 본문 계열 typography, 그리고 spacing(카드 padding/리스트
// 간격 등 앱 전역에서 sx={{p, m, gap}}로 쓰는 모든 값)에 적용하는 배율(large=1 = 기존 값 그대로).
const CONTENT_SCALE = { small: 0.85, medium: 0.925, large: 1, xlarge: 1.15 };

// navigation label/button/chip/input처럼 물리적 공간·터치 영역이 제한된 UI는 본문과 같은
// 비율로 키우면 레이아웃이 깨지거나 터치 영역이 과도해지므로, 압축된 배율을 별도로 쓴다.
// xlarge는 nav/button이 고정 높이 UI를 뚫고 나가지 않도록 CONTENT_SCALE(1.15)보다 낮은
// 1.08로 상한을 두고, small은 실사용에서 체감될 만큼 눈에 띄게 줄어야 한다는 피드백에 따라
// CONTENT_SCALE.small과 같은 0.85로 낮췄다(버튼은 2차 액션 기준 상 32px 안팎까지는 여전히
// 탭 가능한 범위로 판단 — 실기기 확인 필요).
const COMPACT_SCALE = { small: 0.85, medium: 0.95, large: 1, xlarge: 1.08 };

// large(=현재 FitBuddy 고정값) 기준 rem 값. 실제 렌더링 값은 이 값에 위 배율을 곱해 계산한다.
const BASE_REM = {
  h1: 2, h2: 1.5, h3: 1.25, h4: 1.1, body1: 0.95, body2: 0.85,
  caption: 0.75, button: 0.875, dialogTitle: 1.1, navLabel: 0.75, chipLabel: 0.8125,
};

function rem(base, scale) {
  return `${(base * scale).toFixed(3)}rem`;
}

function px(base, scale) {
  return `${Math.round(base * scale)}px`;
}

/**
 * getScale - 글자 크기 단계에 대응하는 배율 두 가지를 반환한다. theme.js가 만드는
 * MUI 컴포넌트 스타일뿐 아니라, `<FitBuddyCharacter size={56}>`처럼 CSS가 아니라 숫자
 * prop으로 크기를 받는 커스텀 컴포넌트를 페이지에서 스케일링할 때도 같은 배율을 쓴다.
 *
 * @param {string} fontScale - 'small'|'medium'|'large'|'xlarge' [Optional, 기본값: DEFAULT_FONT_SCALE]
 * @returns {{ content: number, compact: number }}
 */
export function getScale(fontScale = DEFAULT_FONT_SCALE) {
  return {
    content: CONTENT_SCALE[fontScale] ?? CONTENT_SCALE[DEFAULT_FONT_SCALE],
    compact: COMPACT_SCALE[fontScale] ?? COMPACT_SCALE[DEFAULT_FONT_SCALE],
  };
}

/**
 * createAppTheme - 글자 크기 단계에 맞는 MUI 테마를 생성한다.
 *
 * 페이지마다 `if (fontScale === ...)` 분기를 두지 않고, 모든 페이지가 이 팩토리가 만든
 * theme의 typography/spacing/컴포넌트 기본값을 통해 공통으로 스케일을 따르게 한다.
 * `theme.spacing()`도 배율을 타므로(아래), sx={{p, m, gap}} 등 앱 전역의 카드 padding·
 * 리스트 간격도 이 팩토리 하나만 손봐도 함께 조정된다 — 각 페이지의 개별 spacing 값을
 * 일일이 찾아 고치지 않아도 되는 이유다.
 *
 * @param {string} fontScale - 'small'|'medium'|'large'|'xlarge' [Optional, 기본값: DEFAULT_FONT_SCALE]
 *
 * Example usage:
 * const theme = createAppTheme('xlarge');
 */
export function createAppTheme(fontScale = DEFAULT_FONT_SCALE) {
  const { content: c, compact: n } = getScale(fontScale);

  return createTheme({
    // MUI 기본 spacing(1) = 8px 고정. 여기서 배율을 곱해두면 theme.spacing()을 거치는
    // 모든 sx={{p,m,gap,...}}와 Card/CardContent/Dialog 등 MUI 내부 기본 padding까지
    // 글자 크기 단계에 맞춰 함께 커지고 줄어든다.
    spacing: (factor = 1) => `${8 * factor * c}px`,
    palette: {
      primary: {
        main: '#6BCB77',
        light: '#9EE3A7',
        dark: '#4CAF5A',
        contrastText: '#fff',
      },
      secondary: {
        main: '#5DA9E9',
        light: '#8EC8F4',
        dark: '#3A8AC9',
        contrastText: '#fff',
      },
      accent: {
        purple: '#A084E8',
        yellow: '#FFE082',
      },
      background: {
        default: '#F6F7FB',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#1a1a2e',
        secondary: '#6B7280',
      },
    },
    typography: {
      fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: rem(BASE_REM.h1, c) },
      h2: { fontWeight: 700, fontSize: rem(BASE_REM.h2, c) },
      h3: { fontWeight: 600, fontSize: rem(BASE_REM.h3, c) },
      h4: { fontWeight: 600, fontSize: rem(BASE_REM.h4, c) },
      body1: { fontSize: rem(BASE_REM.body1, c) },
      body2: { fontSize: rem(BASE_REM.body2, c) },
      caption: { fontSize: rem(BASE_REM.caption, c) },
      button: { fontSize: rem(BASE_REM.button, n) },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: `${px(10, n)} ${px(20, n)}`,
          },
          sizeSmall: {
            padding: `${px(5, n)} ${px(12, n)}`,
            minHeight: px(30, n),
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { padding: px(8, n) },
          sizeSmall: { padding: px(5, n) },
        },
      },
      // 개별 아이콘에 sx={{fontSize:...}}로 명시적 크기를 지정한 곳(코드베이스 전반에 흔함)은
      // 그대로 우선 적용되고, 기본 크기를 쓰는 아이콘만 이 배율을 따른다.
      MuiSvgIcon: {
        styleOverrides: {
          root: { fontSize: rem(1.5, n) },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8 },
          label: {
            fontSize: rem(BASE_REM.chipLabel, n),
            paddingLeft: px(10, n),
            paddingRight: px(10, n),
          },
          sizeSmall: { height: px(24, n) },
        },
      },
      // TextField/Select의 입력 텍스트는 MUI가 브라우저 기본(1rem, 고정)으로 렌더링해
      // theme.typography variant를 타지 않는다 — 글자 크기 설정을 "일부 우회"하고 있던
      // 지점(프로필 수정 모달의 닉네임/자기소개/키·몸무게·목표 입력창 등)이라, body1과
      // 같은 배율로 명시적으로 맞춘다. Select도 outlined variant에서는 이 input 클래스를
      // 함께 쓰므로 "최근 7일" 같은 드롭다운 표시 텍스트도 여기서 함께 스케일된다.
      MuiOutlinedInput: {
        styleOverrides: {
          // 입력창 높이(상하 padding)도 글자 크기 단계에 맞춰 함께 조정. 좌우 padding은
          // 손가락으로 텍스트 커서를 두기 쉬운 폭을 유지하기 위해 그대로 둔다.
          input: { paddingTop: px(16.5, c), paddingBottom: px(16.5, c), fontSize: rem(BASE_REM.body1, c) },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: rem(BASE_REM.body1, c) },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '20px',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: '20px 24px 10px',
            fontWeight: 700,
            fontSize: rem(BASE_REM.dialogTitle, c),
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '12px 24px 16px',
          },
          dividers: {
            padding: '16px 24px',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '8px 24px 20px',
            gap: '8px',
          },
        },
      },
      // BottomNavigation 컨테이너 자체는 MUI 기본값이 height:56px로 고정돼 있어, "아주
      // 크게"에서 아이콘+라벨+padding 합이 56px에 근접/초과하면 내용이 잘릴 수 있다.
      // height를 auto로 풀어 내용에 맞게 늘어나게 하고, minHeight로 "작게"에서도 눌리지
      // 않게 하한만 유지한다(layout.jsx가 하단에 확보해 둔 70px 여백 안에서 충분히 수용됨).
      MuiBottomNavigation: {
        styleOverrides: {
          root: { height: 'auto', minHeight: px(56, n) },
        },
      },
      // BottomNavigationAction은 theme.typography를 직접 참조하지 않고 자체 고정 rem 값을
      // 쓰므로, 5개 탭 label 크기가 선택/비선택 상태와 무관하게 항상 동일하도록 여기서
      // 명시적으로 맞춘다(글자 크기 설정과도 연동되도록 compact scale 적용). root의
      // minWidth/padding도 함께 스케일링해 큰 글씨에서 5개 탭 높이가 서로 달라지지 않게 한다.
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            minWidth: 0,
            paddingTop: px(6, n),
            paddingBottom: px(6, n),
          },
          label: {
            fontSize: rem(BASE_REM.navLabel, n),
            '&.Mui-selected': { fontSize: rem(BASE_REM.navLabel, n) },
          },
        },
      },
    },
  });
}

// 기존 `import theme from './theme.js'` 사용처(있다면) 및 최초 렌더 전 기본값이 필요한
// 경우를 위한 기본 테마. 실제 앱은 FontScaleProvider(use-font-scale.jsx)가 사용자 선택에
// 맞춰 createAppTheme()을 다시 호출해 이 값을 대체한다.
const theme = createAppTheme();

export default theme;
