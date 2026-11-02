-- ============================================================================
-- MIGRATION: 20261102000003_readonly_rekap_per_divisi.sql
-- DESKRIPSI: Kebijakan RLS agar Rekap Per Divisi bersifat Read-Only untuk Admin Divisi & User.
--            Operasi UPDATE dan DELETE pada tabel public.requests eksklusif untuk Admin Utama (admin).
-- ============================================================================

-- 1. Perbarui trigger proteksi requests
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
    -- Untuk non-admin, otomatis samakan nilai divisi dari profil pengguna
    IF v_role <> 'admin' THEN
      IF v_divisi IS NULL THEN
        RAISE EXCEPTION 'Divisi pengguna belum diatur pada tabel public.profiles.';
      END IF;
      IF NEW.divisi IS NOT NULL AND lower(trim(NEW.divisi)) <> lower(trim(v_divisi)) THEN
        RAISE EXCEPTION 'Tidak diizinkan membuat pengajuan untuk divisi lain (%).', NEW.divisi;
      END IF;
      NEW.divisi := v_divisi;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Rekap per divisi bersifat read-only: hanya admin utama yang boleh mengubah data
    IF v_role <> 'admin' THEN
      RAISE EXCEPTION 'Akses ditolak: Rekap per divisi bersifat read-only. Hanya Admin Utama yang dapat mengubah data.';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Rekap per divisi bersifat read-only: hanya admin utama yang boleh menghapus data
    IF v_role <> 'admin' THEN
      RAISE EXCEPTION 'Akses ditolak: Rekap per divisi bersifat read-only. Hanya Admin Utama yang dapat menghapus data.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_request_divisi ON public.requests;
CREATE TRIGGER enforce_request_divisi
  BEFORE INSERT OR UPDATE OR DELETE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enforce_request_divisi();

-- 2. Perbarui policy UPDATE pada public.requests
DROP POLICY IF EXISTS "requests_update_by_admin_and_admin_divisi" ON public.requests;
DROP POLICY IF EXISTS "requests_update_admin_only" ON public.requests;

CREATE POLICY "requests_update_admin_only"
  ON public.requests
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
  );

-- 3. Perbarui policy DELETE pada public.requests
DROP POLICY IF EXISTS "requests_delete_by_admin_and_admin_divisi" ON public.requests;
DROP POLICY IF EXISTS "requests_delete_admin_only" ON public.requests;

CREATE POLICY "requests_delete_admin_only"
  ON public.requests
  FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
  );
