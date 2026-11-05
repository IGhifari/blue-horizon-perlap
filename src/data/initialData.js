export const DIVISIONS = [
  'Perlengkapan',
  'Humreg',
  'Dekdok',
  'Acara',
  'Keamanan',
];

export const CATEGORIES = [
  'Pinjam',
  'Beli',
  'Sewa',
  'Sudah Tersedia di Divisi',
];

export const TIMELINE_STATUSES = [
  'Belum Mulai',
  'Sedang Berjalan',
  'Selesai',
];

export const KETENTUAN_ITEMS = [
  {
    number: '1. Nama & Jumlah Barang:',
    desc: 'Tuliskan nama alat beserta jumlah unit yang dibutuhkan.',
  },
  {
    number: '2. Metode Pengadaan:',
    desc: 'Pilih apakah barang akan Dipinjam, Dibeli, Disewa, atau Sudah Tersedia.',
  },
  {
    number: '3. Jika Membeli:',
    desc: 'Cantumkan nama toko, platform, atau tempat pembelian.',
  },
  {
    number: '4. Jika Menyewa:',
    desc: 'Cantumkan nama atau informasi tempat sewanya jika sudah ada.',
  },
  {
    number: '5. Jika Meminjam:',
    desc: 'Tuliskan nama orang/pihak yang akan meminjamkan barang tersebut.',
  },
  {
    number: '6. Catatan Ketersediaan:',
    desc: 'Jika barang sudah tersedia dari divisi masing-masing, tetap cantumkan & beri keterangan.',
  },
];

export const INITIAL_ITEMS = [
  {
    id: 'item-1',
    divisi: 'Perlengkapan',
    namaBarang: 'Kabel Roll 25 Meter',
    jumlahBarang: 6,
    hargaSatuan: 0,
    totalHarga: 0,
    kategori: 'Pinjam',
    jikaMembeli: '-',
    jikaMenyewa: '-',
    jikaMeminjam: 'Budi (Logistik Kampus)',
    catatanOpsional: 'Sudah tersedia 4 unit dari divisi Perlengkapan',
    tanggalPermintaan: '2026-10-26',
  },
  {
    id: 'item-2',
    divisi: 'Humreg',
    namaBarang: 'Lanyard & ID Card Panitia',
    jumlahBarang: 50,
    hargaSatuan: 6000,
    totalHarga: 300000,
    kategori: 'Beli',
    jikaMembeli: 'Percetakan & Toko ATK Jaya',
    jikaMenyewa: '-',
    jikaMeminjam: '-',
    catatanOpsional: 'Desain sudah siap cetak',
    tanggalPermintaan: '2026-10-26',
  },
  {
    id: 'item-3',
    divisi: 'Dekdok',
    namaBarang: 'Lighting & Tripod Kamera',
    jumlahBarang: 2,
    hargaSatuan: 75000,
    totalHarga: 150000,
    kategori: 'Sewa',
    jikaMembeli: '-',
    jikaMenyewa: 'Sewa Kamera Bogor (@sewakamerabogor)',
    jikaMeminjam: '-',
    catatanOpsional: 'Ambil H-1 acara',
    tanggalPermintaan: '2026-10-26',
  },
  {
    id: 'item-4',
    divisi: 'Acara',
    namaBarang: 'Microphone Wireless Dual UHF',
    jumlahBarang: 4,
    hargaSatuan: 100000,
    totalHarga: 400000,
    kategori: 'Sewa',
    jikaMembeli: '-',
    jikaMenyewa: 'Vendor Sound System Utama',
    jikaMeminjam: '-',
    catatanOpsional: 'Digunakan untuk panggung utama',
    tanggalPermintaan: '2026-10-26',
  },
  {
    id: 'item-5',
    divisi: 'Keamanan',
    namaBarang: 'Handy Talky (HT) & Charger',
    jumlahBarang: 6,
    hargaSatuan: 50000,
    totalHarga: 300000,
    kategori: 'Sewa',
    jikaMembeli: '-',
    jikaMenyewa: 'Rental HT Bogor',
    jikaMeminjam: '-',
    catatanOpsional: 'Sudah tersedia 2 unit dari divisi Keamanan',
    tanggalPermintaan: '2026-10-26',
  },
];

export const INITIAL_TIMELINE = [
  {
    id: 'tl-1',
    rentang: '21 – 23 Okt',
    target: 'Menyiapkan spreadsheet inventaris & Form Permintaan Barang divisi.',
    output: 'Form & sistem inventaris',
    status: 'Selesai',
    progres: 100,
  },
  {
    id: 'tl-2',
    rentang: '24 – 27 Okt',
    target: 'Rekapitulasi permintaan barang (pinjam/sewa/beli) dari seluruh divisi.',
    output: 'Rekap kebutuhan alat',
    status: 'Sedang Berjalan',
    progres: 60,
  },
  {
    id: 'tl-3',
    rentang: '28 Okt – 5 Nov',
    target: 'Pengecekan stok, pengadaan barang tervalidasi Bendahara, & penyesuaian venue.',
    output: 'Pengadaan barang berjalan',
    status: 'Belum Mulai',
    progres: 0,
  },
  {
    id: 'tl-4',
    rentang: '6 – 12 Nov',
    target: 'Pengecekan kelengkapan teknis (kabel, sound, jumlah, & fungsi).',
    output: 'Wajib 100% alat tersedia',
    status: 'Belum Mulai',
    progres: 0,
  },
  {
    id: 'tl-5',
    rentang: '13 – 14 Nov',
    target: 'Packing & labeling barang per pos/pengguna, serta uji kelayakan alat.',
    output: 'Barang ter-label & siap angkut',
    status: 'Belum Mulai',
    progres: 0,
  },
  {
    id: 'tl-6',
    rentang: '15 Nov',
    target: 'Distribusi alat di lokasi & penanganan kekurangan barang via Korlap.',
    output: 'Logistik Hari H aman',
    status: 'Belum Mulai',
    progres: 0,
  },
];

export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function createEmptyDraftRow() {
  return {
    draftId: 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    namaBarang: '',
    jumlahBarang: 1,
    hargaSatuan: 0,
    totalHarga: 0,
    kategori: 'Pinjam',
    tersediaDiPerlap: 'Belum Ada',
    jikaMembeli: '',
    jikaMenyewa: '',
    jikaMeminjam: '',
    catatanOpsional: '',
  };
}

export function getTodayDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
