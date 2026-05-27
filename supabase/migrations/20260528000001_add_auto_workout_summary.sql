-- ============================================================
-- Migration: add auto_workout_summary to fitbuddy_daily_logs
-- Created  : 2026-05-28
-- Purpose  : 운동일기 저장 시 운동 요약 데이터(횟수·시간·휴식·
--            칼로리·걸음수·종류)를 JSONB로 자동 첨부
-- ============================================================

-- IF NOT EXISTS 가드로 중복 실행 시에도 기존 데이터 영향 없음
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fitbuddy_daily_logs'
      AND column_name  = 'auto_workout_summary'
  ) THEN
    ALTER TABLE public.fitbuddy_daily_logs
      ADD COLUMN auto_workout_summary jsonb DEFAULT NULL;

    COMMENT ON COLUMN public.fitbuddy_daily_logs.auto_workout_summary IS
      '운동일기 저장 시 자동 첨부되는 운동 요약 JSON.
       구조 예시:
       {
         "count"        : 2,
         "duration"     : 45,
         "rest_seconds" : 120,
         "calories"     : 310,
         "steps"        : 3500,
         "types"        : ["홈트", "러닝"]
       }';
  END IF;
END;
$$;
