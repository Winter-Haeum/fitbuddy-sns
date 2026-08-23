import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

const NAV_ITEMS = [
  { label: '홈', icon: <HomeRoundedIcon />, path: '/' },
  { label: '기록관', icon: <MenuBookRoundedIcon />, path: '/records' },
  { label: '피드', icon: <GridViewRoundedIcon />, path: '/feed' },
  { label: '챌린지', icon: <EmojiEventsRoundedIcon />, path: '/challenges' },
  { label: '마이', icon: <PersonRoundedIcon />, path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentValue = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider',
        // Android 15+(targetSdk 35+) edge-to-edge에서는 이 Paper가 system navigation bar
        // 영역까지 그려져 실제 탭 버튼이 그 아래 가려지고 눌리지 않는다. pb로 그 높이만큼
        // 여백을 주면 Paper 배경은 시스템 바 영역까지 자연스럽게 이어지고(끊긴 것처럼 보이지
        // 않음), 실제 탭 버튼(BottomNavigation)은 그 위에서 정상적으로 눌리는 위치에 남는다.
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentValue === -1 ? false : currentValue}
        onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
        showLabels
        sx={{ bgcolor: 'background.paper' }}
      >
        {/* showLabels로 5개 탭 모두 항상 라벨을 표시한다 — MUI 기본값(showLabels=false)은
            선택된 탭만 라벨을 보여주면서 icon/label 위치와 전체 높이가 달라지는데, 그것이
            바로 "active/inactive 탭 높이가 들쑥날쑥해 보이는" 원인이었다. active 상태 차이는
            color/font-weight로만 표현한다. */}
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            sx={{
              minWidth: 0,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
              '& .MuiBottomNavigationAction-label.Mui-selected': { fontWeight: 700 },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
