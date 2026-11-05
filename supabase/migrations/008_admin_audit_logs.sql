-- ==============================================================================
-- RESTOLINK - 008_ADMIN_AUDIT_LOGS.SQL
-- Audit Trail Log untuk Seluruh Aksi Sensitif Platform Admin (FS-14 / M8)
-- Mencatat aksi manual override status tenant, transaksi, dan alasan penanganan.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_entity text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index untuk mempermudah pencarian riwayat aksi per target dan urutan waktu
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs (target_entity, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Hanya platform_admin yang dapat membaca dan menambah riwayat audit trail
CREATE POLICY "audit_logs_select_admin"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "audit_logs_insert_admin"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (public.is_platform_admin());
