# Supabase Migrations

이 폴더는 FitBuddy SNS 프로젝트의 DB 스키마 변경 이력을 관리합니다.

## 파일 명명 규칙

```
YYYYMMDDHHMMSS_설명.sql
```

## 실행 방법

각 `.sql` 파일을 **Supabase Dashboard → SQL Editor**에 붙여넣고 실행합니다.  
모든 파일은 `IF NOT EXISTS` 가드를 포함하므로 중복 실행해도 안전합니다.

## 마이그레이션 목록

| 파일 | 내용 |
|------|------|
| `20260528000001_add_auto_workout_summary.sql` | `fitbuddy_daily_logs`에 `auto_workout_summary jsonb` 컬럼 추가 |
