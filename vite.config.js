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
      // autoUpdate는 새 SW가 감지되면 열려있는 탭을 자동으로 reload할 수 있어
      // 게시글/댓글/프로필 작성 중인 입력이 날아갈 위험이 있다. prompt는 새 SW를 설치만 해두고
      // 별도 알림 UI 없이는 리로드를 트리거하지 않으므로, 실제로는 다음 방문/새로고침 시에만
      // 새 버전이 적용된다(이번 PR에서는 업데이트 알림 UI를 추가하지 않는다).
      registerType: 'prompt',
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
