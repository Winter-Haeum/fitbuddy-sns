import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
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

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const currentValue = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

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
        {NAV_ITEMS.map((item, index) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                {item.icon}
                {currentValue === index && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                    }}
                  />
                )}
              </Box>
            }
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
