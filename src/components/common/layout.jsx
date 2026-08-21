import Box from '@mui/material/Box';
import BottomNav from './bottom-nav';

/**
 * Layout 컴포넌트 - 하단 네비게이션 포함 페이지 레이아웃
 * @param {React.ReactNode} children [Required]
 * @param {boolean} showNav - 하단 네비게이션 표시 여부 [Optional, 기본값: true]
 */
export default function Layout({ children, showNav = true }) {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pb: showNav ? '70px' : 0 }}>
      {/* Android 15+(targetSdk 35+)는 edge-to-edge를 자동 강제해 WebView가 상태바 영역까지
          그린다 — 네이티브 코드 없이, env(safe-area-inset-top)(index.html의 viewport-fit=cover
          와 함께 동작) + 약간의 여유(8px)만큼 모든 페이지의 최상단에 공통으로 padding을 준다.
          모든 페이지가 이 Layout 하나를 통해 렌더되므로 페이지마다 값을 따로 넣지 않아도
          Home/Records/Feed/Challenge/Profile의 첫 콘텐츠 시작 위치가 함께 맞춰진다. 이 값을
          지원하지 않는 환경(구형 WebView, 데스크톱 브라우저)에서는 env()가 0으로 처리되어
          기존과 동일하게 동작한다. */}
      <Box sx={{
        maxWidth: 480, mx: 'auto', minHeight: '100vh', position: 'relative',
        bgcolor: 'background.paper', boxShadow: '0 0 20px rgba(0,0,0,0.08)',
        pt: 'calc(env(safe-area-inset-top, 0px) + 8px)',
      }}>
        {children}
        {showNav && <BottomNav />}
      </Box>
    </Box>
  );
}
