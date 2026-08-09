import { Component } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

/**
 * ErrorBoundary - React 렌더링 오류 포착 및 fallback UI 표시
 *
 * 사용법:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * 향후 Sentry 연동 시 componentDidCatch에서 Sentry.captureException() 호출
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // 향후 Sentry 연동 지점:
    // import * as Sentry from '@sentry/react';
    // Sentry.captureException(error, { extra: info });
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center',
            bgcolor: '#F7FAF8',
          }}
        >
          <Typography sx={{ fontSize: '3.5rem', mb: 1.5 }}>😕</Typography>
          <Typography variant='h3' sx={{ fontWeight: 700, mb: 1, color: '#1B5E20' }}>
            화면을 불러오지 못했습니다
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3, maxWidth: 300 }}>
            일시적인 오류가 발생했습니다.
            새로고침하면 대부분 해결됩니다.
          </Typography>
          <Button
            variant='contained'
            onClick={() => window.location.reload()}
            sx={{ bgcolor: '#6BCB77', '&:hover': { bgcolor: '#4DBB68' } }}
          >
            새로고침
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
