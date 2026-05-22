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
      <Box sx={{ maxWidth: 480, mx: 'auto', minHeight: '100vh', position: 'relative', bgcolor: 'background.paper', boxShadow: '0 0 20px rgba(0,0,0,0.08)' }}>
        {children}
        {showNav && <BottomNav />}
      </Box>
    </Box>
  );
}
