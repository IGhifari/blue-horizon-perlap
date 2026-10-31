-- ============================================================================
-- MIGRATION: Fitur Upload Foto Bukti Transaksi & Dokumentasi Pengeluaran
-- Jalankan script ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

BEGIN;

-- 1. Tambahkan kolom foto_bukti (JSONB array) pada tabel public.requests
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS foto_bukti jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Perbarui trigger trg_enforce_request_divisi agar hanya Admin Utama ('admin')
--    yang diizinkan menambah, mengubah, atau menghapus foto_bukti
CREATE OR REPLACE FUNCTION public.trg_enforce_request_divisi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_divisi text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_role := public.get_my_role();
  v_divisi := public.get_my_divisi();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Profil pengguna belum terdaftar di tabel public.profiles untuk user ID %.', auth.uid();
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF v_role <> 'admin' THEN
      IF v_divisi IS NULL THEN
        RAISE EXCEPTION 'Divisi pengguna belum diatur pada tabel public.profiles.';
      END IF;
      IF NEW.divisi IS NOT NULL AND lower(trim(NEW.divisi)) <> lower(trim(v_divisi)) THEN
        RAISE EXCEPTION 'Tidak diizinkan membuat pengajuan untuk divisi lain (%).', NEW.divisi;
      END IF;
      NEW.divisi := v_divisi;
      -- Hanya Admin Utama (Divisi Perlengkapan) yang boleh mengunggah foto bukti
      NEW.foto_bukti := '[]'::jsonb;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF v_role = 'user' THEN
      RAISE EXCEPTION 'Role user tidak memiliki akses untuk mengubah pengajuan.';
    ELSIF v_role = 'admin_divisi' THEN
      IF lower(trim(OLD.divisi)) <> lower(trim(v_divisi))
         OR lower(trim(NEW.divisi)) <> lower(trim(v_divisi)) THEN
        RAISE EXCEPTION 'Admin divisi hanya dapat mengubah data divisinya sendiri.';
      END IF;
      NEW.divisi := OLD.divisi;
      -- Pertahankan foto_bukti lama jika bukan Admin Utama
      IF NEW.foto_bukti IS DISTINCT FROM OLD.foto_bukti THEN
        RAISE EXCEPTION 'Hanya Admin Utama (Divisi Perlengkapan) yang dapat mengubah foto bukti transaksi.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Siapkan Supabase Storage Bucket 'bukti-transaksi' untuk foto struk & pengeluaran
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-transaksi',
  'bukti-transaksi',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Kebijakan RLS pada storage.objects untuk bucket 'bukti-transaksi'
DROP POLICY IF EXISTS "bukti_transaksi_select_authenticated" ON storage.objects;
CREATE POLICY "bukti_transaksi_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'bukti-transaksi');

DROP POLICY IF EXISTS "bukti_transaksi_insert_admin_only" ON storage.objects;
CREATE POLICY "bukti_transaksi_insert_admin_only"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bukti-transaksi'
    AND public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "bukti_transaksi_update_admin_only" ON storage.objects;
CREATE POLICY "bukti_transaksi_update_admin_only"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'bukti-transaksi'
    AND public.get_my_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'bukti-transaksi'
    AND public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "bukti_transaksi_delete_admin_only" ON storage.objects;
CREATE POLICY "bukti_transaksi_delete_admin_only"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bukti-transaksi'
    AND public.get_my_role() = 'admin'
  );

COMMIT;
