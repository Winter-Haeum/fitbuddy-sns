import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 저장소 서브패스 배포 경로.
const GITHUB_PAGES_BASE = '/fitbuddy-sns/';

export default defineConfig(({ mode }) => {
  // `npm run build:android`(vite build --mode android)에서만 true.
  // Capacitor Android의 WebView는 앱 내부 콘텐츠를 localhost 루트 기준으로 제공하므로,
  // GitHub Pages 전용 서브패스 base를 그대로 쓰면 JS/CSS 등 asset 경로를 찾지 못해
  // 흰 화면이 된다. Android build에서는 base를 '/'로 바꾼다 — BrowserRouter의
  // basename={import.meta.env.BASE_URL}(main.jsx, 무변경)이 base 값을 그대로 따라가므로
  // Router 쪽 추가 수정 없이 root 기준으로 자연스럽게 맞춰진다.
  const isAndroid = mode === 'android';
  const base = isAndroid ? '/' : GITHUB_PAGES_BASE;

  return {
    base,
    plugins: [
      react(),
      // PWA(manifest/Service Worker)는 GitHub Pages 웹 배포 전용 기능이다. Capacitor
      // 공식 트러블슈팅 문서에서도 WebView 안의 Service Worker가 plugin bridge 동작에
      // 영향을 줄 수 있다고 안내하므로, Android build에서는 플러그인 자체를 추가하지 않는다
      // (일반 `npm run build`에서는 아래 설정이 기존과 동일하게 그대로 적용된다).
      !isAndroid && VitePWA({
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
    ].filter(Boolean),
  };
});
