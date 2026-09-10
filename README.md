# FitBuddy

운동 기록과 소셜 기능을 함께 담은 React 기반 웹 애플리케이션입니다.

---

## 🌱 프로젝트 소개

기본적인 운동을 부담 없이 기록하고 꾸준히 이어갈 수 있는 서비스를 목표로 만든 개인 프로젝트입니다.<br>
운동 기록만 남기는 도구가 아니라 피드, 챌린지, 캐릭터를 함께 두어 기록과 지속적인 사용이 이어지도록 구성했습니다.<br>
기획부터 화면 구현, 데이터 연동, 배포까지 직접 진행했습니다.

---

## ✨ 주요 기능

- 이메일 회원가입 / 로그인, 로그인 상태에 따른 화면 접근 제어
- 운동 타이머와 전역 미니 플레이어, 운동 기록 저장
- 기록 페이지: 운동 기록과 운동 일기(컨디션·메모) 관리
- 피드: 게시글 작성 · 상세 · 좋아요, 좋아요한 사용자 목록
- 챌린지(기간 챌린지 / 오늘 모임) 생성 · 참여 · 진행률
- 식단 기록 (끼니 · 칼로리 · 이미지)
- 성장형 캐릭터 (XP 규칙, 캐릭터 스타일 선택)
- 홈 대시보드: 오늘의 운동 목표, 일일 걸음수 (Android Health Connect 연동)
- 글자 크기 설정, 반응형 레이아웃

---

## 🛠 기술 스택

이 프로젝트에서 사용한 주요 기술입니다.

<img src="https://img.shields.io/badge/React-cfe8ff?style=flat-square&logo=react&logoColor=black"/> <img src="https://img.shields.io/badge/Vite-e6d6ff?style=flat-square&logo=vite&logoColor=black"/> <img src="https://img.shields.io/badge/MUI-bcd8ff?style=flat-square&logo=mui&logoColor=black"/> <img src="https://img.shields.io/badge/React%20Router-ffd8cc?style=flat-square&logo=reactrouter&logoColor=black"/> <img src="https://img.shields.io/badge/Supabase-cfeccf?style=flat-square&logo=supabase&logoColor=black"/> <img src="https://img.shields.io/badge/Capacitor-d0e4ff?style=flat-square&logo=capacitor&logoColor=black"/>

- React · Vite · React Router
- MUI · Emotion
- Supabase (인증 · 데이터)
- Capacitor (Android 빌드), PWA
- 배포: GitHub Actions → GitHub Pages

---

## 🎯 구현 및 경험

- Supabase 인증과 라우트 접근 제어(로그인 필요 화면 / 비로그인 전용 화면)를 분리해 구성
- 운동 타이머 상태를 화면 이동과 무관하게 유지하도록 전역 상태와 미니 플레이어로 처리
- 게시글 작성 화면을 수정 화면에서도 재사용하도록 구조를 정리해 중복 관리 부담을 줄임
- 캐릭터 이미지를 스타일·상태별로 분리하고 리졸버를 통해 불러오도록 정리
- 웹 배포(GitHub Pages)와 Android 빌드(Capacitor)를 분리해 설정
- 실제 사용하면서 발견한 흐름·사용성 문제를 기준으로 기능과 UI를 계속 보완

---

## 🚀 실행 / 배포

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 웹 빌드
```

환경 변수는 `.env` 에 설정합니다.

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`main` 브랜치에 push하면 GitHub Actions가 빌드 후 GitHub Pages로 배포합니다.

---

## 🔗 Links

- GitHub: https://github.com/Winter-Haeum/fitbuddy-sns
- Live: https://winter-haeum.github.io/fitbuddy-sns/
