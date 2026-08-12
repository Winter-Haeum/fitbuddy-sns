import { useEffect, useRef, useState } from 'react';
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

const SCROLL_HIDE_THRESHOLD = 8;
const SCROLL_TOP_OFFSET = 16;

// window.scrollY가 0으로 고정되는 브라우저/레이아웃 조합을 대비해
// 실제 문서 스크롤 위치를 여러 경로로 폴백 조회한다.
function getScrollY() {
  return (
    document.scrollingElement?.scrollTop ??
    window.scrollY ??
    document.documentElement.scrollTop ??
    document.body.scrollTop ??
    0
  );
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const currentValue = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  useEffect(() => {
    // 마운트 시점의 실제 스크롤 위치로 기준값을 맞춰,
    // 이미 스크롤된 상태로 페이지가 열려도 첫 스크롤에서 오작동하지 않게 한다.
    lastScrollY.current = getScrollY();

    const handleScroll = () => {
      const currentScrollY = getScrollY();

      if (currentScrollY <= SCROLL_TOP_OFFSET) {
        setHidden(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) < SCROLL_HIDE_THRESHOLD) {
        return;
      }

      setHidden(diff > 0);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        transform: hidden ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.25s ease',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentValue === -1 ? false : currentValue}
        onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
        sx={{ bgcolor: 'background.paper' }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            sx={{
              '&.Mui-selected': { color: 'primary.main' },
              minWidth: 0,
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
