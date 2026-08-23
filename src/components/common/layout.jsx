import Box from '@mui/material/Box';
import BottomNav from './bottom-nav';

/**
 * Layout 컴포넌트 - 하단 네비게이션 포함 페이지 레이아웃
 * @param {React.ReactNode} children [Required]
 * @param {boolean} showNav - 하단 네비게이션 표시 여부 [Optional, 기본값: true]
 */
export default function Layout({ children, showNav = true }) {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Android 15+(targetSdk 35+)는 edge-to-edge를 자동 강제해 WebView가 상태바/시스템
          네비게이션 바 영역까지 그린다 — 네이티브 코드 없이 env(safe-area-inset-*)
          (index.html의 viewport-fit=cover와 함께 동작)로 보정한다. pt/pb를 반드시 이 흰
          배경(background.paper) Box에 둬야 한다 — 바깥 Box는 background.default(연한 회색)라,
          이전에 pb를 바깥 Box에 뒀을 때 그 padding 영역만큼 회색이 그대로 노출되어 스크롤
          맨 아래에 "콘텐츠가 끝나고 별도의 회색 바닥이 드러난" 것처럼 보였다.
          pb 값은 BottomNav 자체 높이(약 56~64px, 글자 크기 설정에 따라 가변)를 살짝 웃도는
          최소한만 남긴다 — bottom:calc(80px+safe-area)로 그 위에 떠 있는 FAB까지 여기서
          전부 피하려던 이전 시도(150px)는 필요 이상으로 컸다. FAB는 원래 Material Design에서
          스크롤 콘텐츠 위에 살짝 겹쳐 떠 있는 것이 정상이라(다른 페이지들의 FAB도 동일), 콘텐츠
          padding은 "nav에 가려지지 않을 정도"만 확보하고 FAB와의 관계는 건드리지 않는다. */}
      <Box sx={{
        maxWidth: 480, mx: 'auto', minHeight: '100vh', position: 'relative',
        bgcolor: 'background.paper', boxShadow: '0 0 20px rgba(0,0,0,0.08)',
        pt: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        pb: showNav ? 'calc(70px + env(safe-area-inset-bottom, 0px))' : 'env(safe-area-inset-bottom, 0px)',
      }}>
        {children}
        {showNav && <BottomNav />}
      </Box>
    </Box>
  );
}
