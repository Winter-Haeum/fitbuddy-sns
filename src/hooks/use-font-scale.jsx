import { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, FONT_SCALE_LEVELS, DEFAULT_FONT_SCALE } from '../theme';

const STORAGE_KEY = 'fitbuddy_fontScale';
const FontScaleContext = createContext(null);

function readStoredFontScale() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return FONT_SCALE_LEVELS.includes(stored) ? stored : DEFAULT_FONT_SCALE;
}

/**
 * FontScaleProvider - 사용자가 선택한 글자 크기를 기기(localStorage)에 저장하고, 그에 맞는
 * MUI 테마를 앱 전체에 제공한다. 계정 데이터가 아니라 UI 설정이므로 로그아웃해도 같은
 * 기기에서는 유지되며, 이 설정 하나 때문에 DB에 저장하지 않는다.
 *
 * @param {React.ReactNode} children [Required]
 *
 * Example usage:
 * <FontScaleProvider><App /></FontScaleProvider>
 */
export function FontScaleProvider({ children }) {
  const [fontScale, setFontScaleState] = useState(readStoredFontScale);

  function setFontScale(level) {
    if (!FONT_SCALE_LEVELS.includes(level)) return;
    setFontScaleState(level);
    localStorage.setItem(STORAGE_KEY, level);
  }

  const theme = useMemo(() => createAppTheme(fontScale), [fontScale]);

  return (
    <FontScaleContext.Provider value={{ fontScale, setFontScale }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </FontScaleContext.Provider>
  );
}

// FontScaleProvider and useFontScale are intentionally kept together, matching the existing
// use-auth.jsx pattern in this codebase.
// eslint-disable-next-line react-refresh/only-export-components
export function useFontScale() {
  return useContext(FontScaleContext);
}
