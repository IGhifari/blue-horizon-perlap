# Portal Logistik & Peminjaman Barang Acara — Divisi Perlengkapan

Aplikasi berbasis **ReactJS + Vite + Tailwind CSS** dengan desain **Neobrutalism UI** untuk pendataan, pengajuan, rekapitulasi per divisi, dan pelacakan timeline kerja Divisi Perlengkapan (21 Okt – 15 Nov).

## Cara Menjalankan Project Secara Lokal

1. Instal seluruh dependency:
   ```bash
   npm install
   ```
2. Jalankan server pengembangan (Vite):
   ```bash
   npm run dev
   ```
3. Jalankan pemeriksaan kualitas kode & pengujian:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

## Penyimpanan Data & Integrasi Google Sheets

Saat ini penyimpanan data dilakukan secara lokal di browser menggunakan state React dan `localStorage` (`perlap_items_v1` & `perlap_timeline_v1`).

Untuk mengekspor data ke Google Sheets atau Microsoft Excel:
- Gunakan tombol **Unduh CSV / Excel** pada halaman **Rekap Per Divisi**.
- Gunakan tombol **Salin ke Spreadsheet** untuk menyalin format TSV dan menempelkannya (`Ctrl+V`) langsung ke Google Sheets.

### Panduan Integrasi Otomatis ke Google Sheets
Jika ingin menghubungkan pengiriman form secara langsung ke Google Sheets tanpa menyimpan kredensial di frontend:
1. Buat **Google Apps Script** pada Google Spreadsheet tujuan dengan fungsi `doPost(e)` yang menerima payload JSON dan memisahkan baris ke sheet `Form Responses` serta sheet masing-masing divisi.
2. Deploy sebagai **Web App** atau gunakan backend perantara (proxy API) yang menyimpan kredensial service account di sisi server.
3. Panggil endpoint backend / Web App URL tersebut melalui variabel environment server pada saat `handleSubmitItems` dijalankan.
