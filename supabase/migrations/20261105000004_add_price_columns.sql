-- ============================================================================
-- MIGRATION: 20261105000004_add_price_columns.sql
-- DESKRIPSI: Menambahkan kolom harga_satuan dan total_harga pada tabel public.requests.
-- ============================================================================

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS harga_satuan numeric(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_harga numeric(14, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.requests.harga_satuan IS 'Harga satuan per unit barang dalam Rupiah.';
COMMENT ON COLUMN public.requests.total_harga IS 'Total harga barang (jumlah_barang * harga_satuan) dalam Rupiah.';
