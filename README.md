# Portal Logistik & Peminjaman Barang Acara — Divisi Perlengkapan (Blue Horizon)

Aplikasi berbasis **ReactJS + Vite + Tailwind CSS + Supabase Auth & Database** dengan desain **Neobrutalism UI** serta kontrol akses berbasis **Role & Divisi (RBAC + RLS)**.

## 1. Environment Variables

### Frontend (`.env.local`)
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-or-publishable-key>
```
> **Penting:** Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` atau di kode frontend.

### Supabase Edge Functions (`supabase/functions/*`)
Variabel berikut otomatis disediakan oleh runtime Supabase Edge Functions di server:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Setup Database, RLS & Akun Admin Utama Pertama

1. Buka **Supabase Dashboard → SQL Editor**, lalu jalankan isi file migrasi:
   - `supabase/migrations/20261026000001_rbac_rls_policies.sql`
2. Buat pengguna pertama di **Supabase Dashboard → Authentication → Users → Add User**:
   - Email: `admin_perlap@perlap.internal` (atau email pilihan Anda)
   - Password: `<password-kuat>`
   - Centang **Auto Confirm User**
3. Salin `UUID` user tersebut, lalu jalankan perintah satu kali berikut di **SQL Editor** untuk menetapkan akun tersebut sebagai **Admin Utama** pertama:
   ```sql
   SELECT public.setup_initial_admin(
     '<UUID_USER_DARI_AUTH>',
     'admin_perlap',
     'Perlengkapan'
   );
   ```
   *(Fungsi `setup_initial_admin` hanya dapat dijalankan jika belum ada akun ber-role `admin` di tabel `public.profiles`).*

4. *(Opsional)* Deploy Supabase Edge Functions untuk pembuatan/pengelolaan user langsung dari UI Admin:
   ```bash
   supabase functions deploy username-login
   supabase functions deploy admin-users
   ```

## 3. Struktur Role & Hak Akses

| Role | Hak Akses |
| :--- | :--- |
| **`admin` (Admin Utama)** | Melihat pengajuan semua divisi, CRUD semua pengajuan, mengelola akun & role/divisi pengguna, mengelola timeline kerja, dan ekspor Excel/CSV. |
| **`admin_divisi` (Admin Divisi)** | Melihat, menambah, mengedit, menghapus, dan mengekspor pengajuan **hanya pada divisinya sendiri**, serta memantau timeline kerja. |
| **`user` (User Divisi)** | Membuat pengajuan barang **hanya untuk divisinya sendiri** dan melihat rekap pengajuan divisinya secara *read-only*. |

## 4. Menjalankan Project Secara Lokal

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```
