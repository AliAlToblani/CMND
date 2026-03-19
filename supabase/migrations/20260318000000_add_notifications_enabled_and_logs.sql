-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add notifications_enabled to profiles + create notification_logs
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add notifications_enabled column to profiles
--    Default OFF (false) for all existing and new users.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type    TEXT NOT NULL,
  recipient_email      TEXT NOT NULL,
  recipient_name       TEXT,
  sent_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  related_entity_type  TEXT,          -- e.g. 'customer', 'contract'
  related_entity_name  TEXT,
  related_entity_id    UUID,
  error_message        TEXT,          -- populated when status = 'failed'
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all logs; regular users see nothing (logs are admin-only)
CREATE POLICY "Admins can view notification logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notification logs"
  ON public.notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can insert logs unconditionally
CREATE POLICY "Service role can insert notification logs"
  ON public.notification_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update notification logs"
  ON public.notification_logs FOR UPDATE
  TO service_role
  USING (true);

-- 4. Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
  ON public.notification_logs (sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient
  ON public.notification_logs (recipient_email);

CREATE INDEX IF NOT EXISTS idx_profiles_notifications_enabled
  ON public.profiles (notifications_enabled)
  WHERE notifications_enabled = true;
