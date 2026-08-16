import { createTheme } from '@mui/material/styles';

const theme = createTheme({
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
    h1: { fontWeight: 700, fontSize: '2rem' },
    h2: { fontWeight: 700, fontSize: '1.5rem' },
    h3: { fontWeight: 600, fontSize: '1.25rem' },
    h4: { fontWeight: 600, fontSize: '1.1rem' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.85rem' },
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
          fontSize: '1.1rem',
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
  },
});

export default theme;
