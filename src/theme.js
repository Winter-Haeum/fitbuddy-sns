import { createTheme } from '@mui/material/styles';

// 글자 크기 설정(마이페이지 > 설정)에서 사용하는 4단계. 값 자체(문자열)는 localStorage에도
// 그대로 저장되므로 함부로 이름을 바꾸지 않는다 — 바꾸면 기존 사용자의 저장된 선택이 무효화된다.
export const FONT_SCALE_LEVELS = ['small', 'medium', 'large', 'xlarge'];
export const FONT_SCALE_LABELS = { small: '작게', medium: '보통', large: '크게', xlarge: '아주 크게' };

// 지금까지 FitBuddy가 써온 고정 typography 값(아래 BASE_REM)이 이미 "크게"에 해당하는
// 수준이므로, 기존 사용자 화면이 갑자기 바뀌지 않도록 기본값을 large로 둔다.
export const DEFAULT_FONT_SCALE = 'large';

// title/subtitle/body/caption 등 본문 계열 typography에 적용하는 배율(large=1 = 기존 값 그대로).
const CONTENT_SCALE = { small: 0.85, medium: 0.925, large: 1, xlarge: 1.15 };

// navigation label/button처럼 물리적 공간이 제한된 UI는 같은 비율로 키우면 레이아웃이
// 깨지므로, 접근성 하한/상한은 유지하되 본문보다 압축된 배율을 별도로 사용한다.
const COMPACT_SCALE = { small: 0.9, medium: 0.95, large: 1, xlarge: 1.08 };

// large(=현재 FitBuddy 고정값) 기준 rem 값. 실제 렌더링 값은 이 값에 위 배율을 곱해 계산한다.
const BASE_REM = {
  h1: 2, h2: 1.5, h3: 1.25, h4: 1.1, body1: 0.95, body2: 0.85,
  caption: 0.75, button: 0.875, dialogTitle: 1.1, navLabel: 0.75,
};

function rem(base, scale) {
  return `${(base * scale).toFixed(3)}rem`;
}

/**
 * createAppTheme - 글자 크기 단계에 맞는 MUI 테마를 생성한다.
 *
 * 페이지마다 `if (fontScale === ...)` 분기를 두지 않고, 이 팩토리가 만든 theme의
 * typography 값을 모든 페이지가 Typography/Button 등 MUI 컴포넌트를 통해 공통으로
 * 따르도록 한다.
 *
 * @param {string} fontScale - 'small'|'medium'|'large'|'xlarge' [Optional, 기본값: DEFAULT_FONT_SCALE]
 *
 * Example usage:
 * const theme = createAppTheme('xlarge');
 */
export function createAppTheme(fontScale = DEFAULT_FONT_SCALE) {
  const c = CONTENT_SCALE[fontScale] ?? CONTENT_SCALE[DEFAULT_FONT_SCALE];
  const n = COMPACT_SCALE[fontScale] ?? COMPACT_SCALE[DEFAULT_FONT_SCALE];

  return createTheme({
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
            padding: '10px 20px',
          },
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
      // BottomNavigationAction은 theme.typography를 직접 참조하지 않고 자체 고정 rem 값을
      // 쓰므로, 5개 탭 label 크기가 선택/비선택 상태와 무관하게 항상 동일하도록 여기서
      // 명시적으로 맞춘다(글자 크기 설정과도 연동되도록 compact scale 적용).
      MuiBottomNavigationAction: {
        styleOverrides: {
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
