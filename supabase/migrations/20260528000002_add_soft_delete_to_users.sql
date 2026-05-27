-- ============================================================
-- Migration: add soft-delete columns to fitbuddy_users
-- Created  : 2026-05-28
-- Purpose  : 회원 탈퇴 시 즉시 삭제 대신 is_deleted 플래그로
--            소프트 삭제 처리. 탈퇴 계정 로그인 차단에 사용.
-- ============================================================

DO $$
BEGIN
  -- is_deleted 컬럼 추가
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fitbuddy_users'
      AND column_name  = 'is_deleted'
  ) THEN
    ALTER TABLE public.fitbuddy_users
      ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

    COMMENT ON COLUMN public.fitbuddy_users.is_deleted IS
      '탈퇴 처리 여부. true이면 로그인 차단 및 계정 비활성화.';
  END IF;

  -- deleted_at 컬럼 추가
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fitbuddy_users'
      AND column_name  = 'deleted_at'
  ) THEN
    ALTER TABLE public.fitbuddy_users
      ADD COLUMN deleted_at timestamptz DEFAULT NULL;

    COMMENT ON COLUMN public.fitbuddy_users.deleted_at IS
      '탈퇴 처리된 시각 (UTC). is_deleted=true 일 때 기록됨.';
  END IF;
END;
$$;
