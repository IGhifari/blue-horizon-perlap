-- ============================================================================
-- MIGRATION: Autentikasi, Role per Divisi, dan Kebijakan RLS (Portal Logistik)
-- Jalankan seluruh script ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

BEGIN;

-- 1. Pastikan tabel public.profiles tersedia
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'admin_divisi', 'user')),
  divisi text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

-- 2. Aktifkan RLS & berikan GRANT tabel ke role authenticated
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_tasks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.requests FROM anon;
REVOKE ALL ON public.timeline_tasks FROM anon;
REVOKE ALL ON public.profiles FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- ============================================================================
-- 3. HELPER FUNCTIONS (SECURITY DEFINER + SAFE search_path)
-- Menggunakan SECURITY DEFINER agar pembacaan role & divisi dari tabel
-- public.profiles tidak terkena blokir atau infinite recursion RLS.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(p.role))
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_divisi()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trim(p.divisi)
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.resolve_login_email(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  IF p_username IS NULL OR length(trim(p_username)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT u.email
    INTO v_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(trim(p.username)) = lower(trim(p_username))
  LIMIT 1;

  RETURN v_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_initial_admin(
  p_user_id uuid,
  p_username text,
  p_divisi text DEFAULT 'Perlengkapan'
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count integer;
  v_profile public.profiles;
BEGIN
  SELECT count(*) INTO v_admin_count
  FROM public.profiles
  WHERE lower(trim(role)) = 'admin';

  IF v_admin_count > 0 THEN
    RAISE EXCEPTION 'Setup admin awal ditolak: akun admin utama sudah tersedia.';
  END IF;

  INSERT INTO public.profiles (id, username, role, divisi)
  VALUES (p_user_id, trim(p_username), 'admin', COALESCE(p_divisi, 'Perlengkapan'))
  ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        role = 'admin',
        divisi = EXCLUDED.divisi
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_divisi() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_divisi() TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.setup_initial_admin(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 4. TRIGGER VALIDASI INTEGRITAS DIVISI & PROTEKSI PROFILE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trg_protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Izinkan jika dieksekusi dari SQL Editor / service_role (auth.uid() IS NULL)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_caller_role := public.get_my_role();

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Hanya Admin Utama yang diizinkan membuat atau mengubah data profil/role/divisi.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_security ON public.profiles;
CREATE TRIGGER enforce_profile_security
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_profile_fields();

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
    -- Untuk non-admin, otomatis gunakan & samakan nilai divisi dari profil pengguna
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
    IF v_role = 'user' THEN
      RAISE EXCEPTION 'Role user tidak memiliki akses untuk mengubah pengajuan.';
    ELSIF v_role = 'admin_divisi' THEN
      IF lower(trim(OLD.divisi)) <> lower(trim(v_divisi))
         OR lower(trim(NEW.divisi)) <> lower(trim(v_divisi)) THEN
        RAISE EXCEPTION 'Admin divisi hanya dapat mengubah data divisinya sendiri.';
      END IF;
      NEW.divisi := OLD.divisi;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_request_divisi ON public.requests;
CREATE TRIGGER enforce_request_divisi
  BEFORE INSERT OR UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enforce_request_divisi();

-- ============================================================================
-- 5. BERSIHKAN POLICY LAMA & TERAPKAN POLICY BARU BERBASIS ROLE + DIVISI
-- ============================================================================

-- 5A. Policy pada public.profiles
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'admin_divisi'
      AND lower(trim(divisi)) = lower(trim(public.get_my_divisi()))
    )
  );

CREATE POLICY "profiles_insert_admin_only"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin'
  );

CREATE POLICY "profiles_update_admin_only"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
  );

CREATE POLICY "profiles_delete_admin_only"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
    AND id <> auth.uid()
  );

-- 5B. Policy pada public.requests
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.requests', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "requests_select_by_role_and_divisi"
  ON public.requests
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('admin_divisi', 'user')
      AND lower(trim(divisi)) = lower(trim(public.get_my_divisi()))
    )
  );

CREATE POLICY "requests_insert_by_role_and_divisi"
  ON public.requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() IN ('admin_divisi', 'user')
      AND lower(trim(divisi)) = lower(trim(public.get_my_divisi()))
    )
  );

CREATE POLICY "requests_update_by_admin_and_admin_divisi"
  ON public.requests
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'admin_divisi'
      AND lower(trim(divisi)) = lower(trim(public.get_my_divisi()))
    )
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'admin_divisi'
      AND lower(trim(divisi)) = lower(trim(public.get_my_divisi()))
    )
  );

CREATE POLICY "requests_delete_by_admin_and_admin_divisi"
  ON public.requests
  FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR (
      public.get_my_role() = 'admin_divisi'
      AND lower(trim(divisi)) = lower(trim(public.get_my_divisi()))
    )
  );

-- 5C. Policy pada public.timeline_tasks
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'timeline_tasks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.timeline_tasks', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "timeline_select_authenticated"
  ON public.timeline_tasks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "timeline_insert_admin_only"
  ON public.timeline_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin'
  );

CREATE POLICY "timeline_update_admin_only"
  ON public.timeline_tasks
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
  );

CREATE POLICY "timeline_delete_admin_only"
  ON public.timeline_tasks
  FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
  );

COMMIT;
