import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

/**
 * FadeInBox - Intersection Observer 기반 스크롤 등장 애니메이션
 *
 * Props:
 * @param {React.ReactNode} children [Required]
 * @param {number} delay - 등장 지연 시간(ms) [Optional, 기본값: 0]
 * @param {string} direction - 등장 방향 'up'|'left'|'right' [Optional, 기본값: 'up']
 * @param {object} sx - 추가 sx 스타일 [Optional]
 *
 * Example usage:
 * <FadeInBox delay={100}><Card>...</Card></FadeInBox>
 */
export default function FadeInBox({ children, delay = 0, direction = 'up', sx = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translate = {
    up: 'translateY(20px)',
    left: 'translateX(-20px)',
    right: 'translateX(20px)',
  }[direction] || 'translateY(20px)';

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0,0)' : translate,
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
        willChange: 'opacity, transform',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
