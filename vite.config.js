import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 저장소 서브패스 배포 경로. manifest의 start_url/scope도 동일한 값을 재사용해
// base가 바뀌어도 두 곳이 어긋나지 않도록 한다.
const base = '/fitbuddy-sns/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // 새 버전은 백그라운드에서 조용히 다운로드되고 다음 방문/새로고침 시 적용된다.
      // 게시글 작성 등 입력 중인 화면을 강제로 리로드하지 않는 가장 단순하고 안전한 방식.
      registerType: 'autoUpdate',
      manifest: {
        name: 'FitBuddy',
        short_name: 'FitBuddy',
        description: '운동 기록과 커뮤니티를 함께 관리하는 FitBuddy',
        // theme.js의 실제 브랜드 색상(palette.primary.main / background.paper)을 그대로 재사용.
        theme_color: '#6BCB77',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // 앱 shell(빌드된 JS/CSS/HTML)만 최소 precache한다. 캐릭터 일러스트 등 대용량 이미지와
        // Supabase API/Auth 요청은 이번 1차 PWA 범위에서 의도적으로 캐싱하지 않는다
        // (조회수/좋아요/피드/챌린지 등이 오래된 캐시로 잘못 표시되는 것을 방지).
        globPatterns: ['**/*.{js,css,html}'],
      },
    }),
  ],
});
