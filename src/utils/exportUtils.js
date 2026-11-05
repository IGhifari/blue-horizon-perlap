import { DIVISIONS, INITIAL_TIMELINE } from '../data/initialData.js';
import {
  ROLES,
  isMainAdmin,
  getAllowedDivisions,
  filterItemsByProfileAccess,
  matchCanonicalDivision,
} from '../features/auth/permissions.js';
import { normalizePhotoList } from './photoUtils.js';

let cachedExcelJS = null;

async function getExcelJS() {
  if (cachedExcelJS) return cachedExcelJS;
  const mod = await import('exceljs');
  cachedExcelJS = mod.default || mod;
  return cachedExcelJS;
}

export const EXPORT_HEADERS = [
  'Divisi',
  'Nama Barang',
  'Jumlah Barang',
  'Harga Satuan (Rp)',
  'Total (Rp)',
  'Kategori',
  'Jika Membeli',
  'Jika Menyewa',
  'Jika Meminjam',
  'Catatan Opsional',
  'Tanggal Permintaan',
];

export const ORDERED_DIVISION_SHEETS = [
  'Acara',
  'Perlengkapan',
  'Humreg',
  'Dekdok',
  'Keamanan',
];

const COLORS = {
  headerFill: 'FF1E3A5F',      // Dark navy blue (sesuai referensi)
  headerText: 'FFFFFFFF',      // White
  instructionFill: 'FFEBF4FF', // Soft ice blue (sesuai referensi)
  instructionText: 'FF1E3A5F', // Dark navy text
  border: 'FFCBD5E1',          // Slate 300
  summaryFill: 'FFEBF4FF',     // Soft ice blue
  textDark: 'FF1E293B',        // Slate 800
};

const BORDERS = {
  thin: {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  },
  summary: {
    top: { style: 'thin', color: { argb: COLORS.headerFill } },
    bottom: { style: 'double', color: { argb: COLORS.headerFill } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  },
};

export function normalizeItem(item) {
  if (!item) return null;
  const rawNote = String(item.catatanOpsional ?? item.catatan_opsional ?? '')
    .replace(/\[PERLAP:SUDAH_ADA\]\s*/g, '')
    .trim();

  const rawDivisi = item.divisi || '-';
  const canonicalDiv = matchCanonicalDivision(rawDivisi);

  const jumlah = Math.max(1, Number(item.jumlahBarang ?? item.jumlah_barang) || 1);
  const hargaSatuan = Math.max(0, Number(item.hargaSatuan ?? item.harga_satuan) || 0);
  const totalHarga =
    item.totalHarga !== undefined && item.totalHarga !== null
      ? Number(item.totalHarga)
      : (item.total_harga !== undefined && item.total_harga !== null
          ? Number(item.total_harga)
          : jumlah * hargaSatuan);

  return {
    id: item.id,
    divisi: canonicalDiv,
    namaBarang: item.namaBarang ?? item.nama_barang ?? '-',
    jumlahBarang: jumlah,
    hargaSatuan,
    totalHarga,
    kategori: item.kategori || '-',
    jikaMembeli: (item.jikaMembeli ?? item.jika_membeli) || '-',
    jikaMenyewa: (item.jikaMenyewa ?? item.jika_menyewa) || '-',
    jikaMeminjam: (item.jikaMeminjam ?? item.jika_meminjam) || '-',
    catatanOpsional: rawNote || '-',
    tanggalPermintaan: (item.tanggalPermintaan ?? item.tanggal_permintaan) || '-',
    fotoBukti: normalizePhotoList(item.fotoBukti ?? item.foto_bukti),
  };
}

export function normalizeTimeline(item, index = 0) {
  if (!item) return null;
  return {
    id: item.id || `tl-${index + 1}`,
    urutan: item.urutan ?? index + 1,
    divisi: item.divisi || 'Perlengkapan',
    rentang: item.rentang || '-',
    target: item.target || '-',
    output: item.output || '-',
    status: item.status || 'Belum Mulai',
    progres: Number(item.progres) || 0,
    pic: item.pic || item.catatan || '-',
  };
}

export function getExportFileName(customDate = null) {
  const d = customDate ? new Date(customDate) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `Portal-Logistik-${year}-${month}-${day}.xlsx`;
}

function formatItemsSheet(ws, { rows = [], isAllData = false, divisiName = '' }) {
  ws.columns = [
    { key: 'divisi', width: 18 },
    { key: 'namaBarang', width: 34 },
    { key: 'jumlahBarang', width: 16 },
    { key: 'hargaSatuan', width: 20 },
    { key: 'totalHarga', width: 22 },
    { key: 'kategori', width: 20 },
    { key: 'jikaMembeli', width: 26 },
    { key: 'jikaMenyewa', width: 30 },
    { key: 'jikaMeminjam', width: 26 },
    { key: 'catatanOpsional', width: 32 },
    { key: 'tanggalPermintaan', width: 20 },
  ];

  // Bekukan baris header kolom (baris 1) agar tetap terlihat ketika scrolling
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }];

  // Baris 1: Header Kolom Langsung di Baris Paling Atas
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  EXPORT_HEADERS.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerFill } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.border = BORDERS.thin;
    cell.alignment = {
      vertical: 'middle',
      horizontal:
        h === 'Nama Barang' || h.startsWith('Jika') || h.startsWith('Catatan')
          ? 'left'
          : 'center',
      wrapText: true,
    };
  });

  // Aktifkan Filter pada Baris Header Tabel (Baris 1)
  ws.autoFilter = 'A1:K1';

  // Baris 2+: Data Pengajuan
  let currentRowIndex = 2;
  rows.forEach((item) => {
    const row = ws.getRow(currentRowIndex);
    row.height = 22;
    const values = [
      item.divisi || '-',
      item.namaBarang || '-',
      Number(item.jumlahBarang) || 1,
      Number(item.hargaSatuan) || 0,
      Number(item.totalHarga) || 0,
      item.kategori || '-',
      item.jikaMembeli || '-',
      item.jikaMenyewa || '-',
      item.jikaMeminjam || '-',
      item.catatanOpsional || '-',
      item.tanggalPermintaan || '-',
    ];

    values.forEach((val, idx) => {
      const cell = row.getCell(idx + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.textDark } };
      cell.border = BORDERS.thin;
      if (idx === 2) {
        // Jumlah Barang: angka rata kanan dengan format ribuan
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (idx === 3 || idx === 4) {
        // Harga Satuan & Total: Rupiah format rata kanan
        cell.numFmt = '"Rp"#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (idx === 0 || idx === 5 || idx === 10) {
        // Divisi, Kategori, Tanggal: rata tengah
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
    currentRowIndex++;
  });

  // Baris Ringkasan (Summary Row) di Bagian Bawah
  const summaryRow = ws.getRow(currentRowIndex);
  summaryRow.height = 25;
  const lastDataRow = currentRowIndex - 1;
  const totalQtyCalc = rows.reduce((s, r) => s + (Number(r.jumlahBarang) || 0), 0);
  const totalCostCalc = rows.reduce((s, r) => s + (Number(r.totalHarga) || 0), 0);

  const summaryValues = [
    isAllData ? 'TOTAL KESELURUHAN' : `TOTAL REKAP ${divisiName ? divisiName.toUpperCase() : ''}`.trim(),
    `${rows.length} Permintaan`,
    rows.length > 0 ? { formula: `SUM(C2:C${lastDataRow})`, result: totalQtyCalc } : 0,
    '',
    rows.length > 0 ? { formula: `SUM(E2:E${lastDataRow})`, result: totalCostCalc } : 0,
    '',
    '',
    '',
    '',
    '',
    '',
  ];

  summaryValues.forEach((val, idx) => {
    const cell = summaryRow.getCell(idx + 1);
    cell.value = val;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.summaryFill } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.instructionText } };
    cell.border = BORDERS.summary;
    if (idx === 0) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (idx === 1) {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    } else if (idx === 2) {
      cell.numFmt = '#,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (idx === 4) {
      cell.numFmt = '"Rp"#,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  });
}

function formatTimelineSheet(ws, timeline = []) {
  ws.columns = [
    { key: 'no', width: 8 },
    { key: 'divisi', width: 18 },
    { key: 'rentang', width: 20 },
    { key: 'target', width: 44 },
    { key: 'output', width: 28 },
    { key: 'status', width: 18 },
    { key: 'progres', width: 16 },
    { key: 'catatan', width: 26 },
  ];

  // Bekukan baris header timeline (baris 6)
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7' }];

  // Baris 1: Judul Utama
  ws.mergeCells('A1:H1');
  const titleRow = ws.getRow(1);
  titleRow.height = 32;
  const titleCell = ws.getCell('A1');
  titleCell.value = 'TIMELINE & TARGET KERJA DIVISI PERLENGKAPAN';
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerFill } };
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.headerText } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Baris 2: Pemisah kosong
  ws.getRow(2).height = 10;

  // Perhitungan Metrik KPI
  const totalSteps = timeline.length;
  const completedSteps = timeline.filter((t) => t.status === 'Selesai').length;
  const inProgressSteps = timeline.filter((t) => t.status === 'Sedang Berjalan').length;
  const avgProgress =
    totalSteps > 0
      ? Math.round(
          timeline.reduce((s, t) => s + (Number(t.progres) || 0), 0) / totalSteps
        )
      : 0;

  // Baris 3: Header Kartu KPI
  ws.mergeCells('A3:B3');
  ws.mergeCells('C3:D3');
  ws.mergeCells('E3:F3');
  ws.mergeCells('G3:H3');
  ws.getRow(3).height = 18;

  const kpiHeaders = [
    { cell: 'A3', label: 'Total Tahapan Kerja', fill: 'FFF1F5F9', color: 'FF1E3A5F' },
    { cell: 'C3', label: 'Tahapan Selesai', fill: 'FFEBF4FF', color: 'FF1E3A5F' },
    { cell: 'E3', label: 'Sedang Berjalan', fill: 'FFFFF3CD', color: 'FF856404' },
    { cell: 'G3', label: 'Rata-rata Progres', fill: 'FFD1E7DD', color: 'FF0F5132' },
  ];

  kpiHeaders.forEach((kpi) => {
    const c = ws.getCell(kpi.cell);
    c.value = kpi.label;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.fill } };
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: kpi.color } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = BORDERS.thin;
  });

  // Baris 4: Nilai Kartu KPI
  ws.mergeCells('A4:B4');
  ws.mergeCells('C4:D4');
  ws.mergeCells('E4:F4');
  ws.mergeCells('G4:H4');
  ws.getRow(4).height = 26;

  const kpiValues = [
    { cell: 'A4', val: totalSteps, fill: 'FFF1F5F9', color: 'FF1E3A5F' },
    { cell: 'C4', val: completedSteps, fill: 'FFEBF4FF', color: 'FF1E3A5F' },
    { cell: 'E4', val: inProgressSteps, fill: 'FFFFF3CD', color: 'FF856404' },
    { cell: 'G4', val: `${avgProgress}%`, fill: 'FFD1E7DD', color: 'FF0F5132' },
  ];

  kpiValues.forEach((kpi) => {
    const c = ws.getCell(kpi.cell);
    c.value = kpi.val;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.fill } };
    c.font = { name: 'Calibri', size: 14, bold: true, color: { argb: kpi.color } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = BORDERS.thin;
  });

  // Baris 5: Pemisah kosong
  ws.getRow(5).height = 10;

  // Baris 6: Header Tabel Timeline
  const headerRow = ws.getRow(6);
  headerRow.height = 28;
  const headers = [
    'No',
    'Divisi',
    'Tanggal / Rentang',
    'Target & Rincian Pekerjaan',
    'Hasil Akhir / Output',
    'Status',
    'Progres (%)',
    'PIC / Catatan',
  ];

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerFill } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.border = BORDERS.thin;
    cell.alignment = {
      vertical: 'middle',
      horizontal:
        h === 'No' || h === 'Divisi' || h.startsWith('Tanggal') || h === 'Status' || h.startsWith('Progres')
          ? 'center'
          : 'left',
      wrapText: true,
    };
  });

  // Aktifkan AutoFilter pada Header Timeline
  ws.autoFilter = 'A6:H6';

  // Baris 7+: Data Timeline
  let currentRowIndex = 7;
  timeline.forEach((item, index) => {
    const row = ws.getRow(currentRowIndex);
    row.height = 22;
    const values = [
      item.urutan || index + 1,
      item.divisi || 'Perlengkapan',
      item.rentang || '-',
      item.target || '-',
      item.output || '-',
      item.status || 'Belum Mulai',
      Number(item.progres) || 0,
      item.pic || '-',
    ];

    values.forEach((val, idx) => {
      const cell = row.getCell(idx + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.textDark } };
      cell.border = BORDERS.thin;
      if (idx === 6) {
        cell.numFmt = '0"%"';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (idx === 0 || idx === 1 || idx === 2 || idx === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
    currentRowIndex++;
  });
}

export async function buildPortalWorkbook({
  profile,
  items = [],
  timeline = [],
}) {
  const ExcelJS = await getExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Portal Logistik';
  wb.created = new Date();

  const isAdmin = isMainAdmin(profile);
  const allowedDivisions = getAllowedDivisions(profile, DIVISIONS);

  if (isAdmin) {
    // 1. Sheet Timeline Perlengkapan (jika data timeline tersedia, eksklusif Admin Utama)
    if (timeline && timeline.length > 0) {
      const wsTimeline = wb.addWorksheet('Timeline Perlengkapan');
      formatTimelineSheet(wsTimeline, timeline);
    }

    // 2. Sheet Semua Data (eksklusif Admin Utama)
    const wsSemuaData = wb.addWorksheet('Semua Data');
    formatItemsSheet(wsSemuaData, {
      rows: items,
      isAllData: true,
    });

    // 3-7. Sheet Rekap Per Divisi untuk seluruh divisi
    const allowedSet = new Set(allowedDivisions.map((d) => d.toLowerCase()));
    const targetDivisions = ORDERED_DIVISION_SHEETS.filter((div) =>
      allowedSet.has(div.toLowerCase())
    );

    targetDivisions.forEach((divisi) => {
      const divRows = items.filter(
        (item) => String(item.divisi || '').trim().toLowerCase() === divisi.toLowerCase()
      );

      const wsDiv = wb.addWorksheet(`Rekap - ${divisi}`);
      formatItemsSheet(wsDiv, {
        rows: divRows,
        isAllData: false,
        divisiName: divisi,
      });
    });
  } else {
    // Role per divisi: sheetnya HANYA data per divisi saja.
    // Sheet Timeline Perlengkapan dan Sheet Semua Data tidak disertakan.
    const userDivision =
      profile?.divisi || (allowedDivisions.length > 0 ? allowedDivisions[0] : null);
    const targetDivisions = userDivision ? [userDivision] : allowedDivisions;

    targetDivisions.forEach((divisi) => {
      const divRows = items.filter(
        (item) => String(item.divisi || '').trim().toLowerCase() === divisi.toLowerCase()
      );

      const wsDiv = wb.addWorksheet(`Rekap - ${divisi}`);
      formatItemsSheet(wsDiv, {
        rows: divRows,
        isAllData: false,
        divisiName: divisi,
      });
    });
  }

  return wb;
}

export async function exportPortalToExcel({
  profile,
  supabaseClient = null,
  fallbackItems = [],
  fallbackTimeline = [],
  customDate = null,
}) {
  const client = supabaseClient;

  let rawRequests = null;
  let rawTimeline = null;

  // Integrasi Supabase: Ambil data terbaru langsung dari server saat tombol ekspor ditekan
  if (client) {
    let requestsQuery = client.from('requests').select('*').order('created_at');
    // Jika role non-admin, filter divisi secara eksplisit sesuai profil (dan dilindungi RLS)
    if (profile?.role !== ROLES.ADMIN && profile?.divisi) {
      requestsQuery = requestsQuery.eq('divisi', profile.divisi);
    }

    const { data: reqData, error: reqError } = await requestsQuery;
    if (reqError) {
      throw new Error(`Gagal mengambil data pengajuan dari server: ${reqError.message}`);
    }
    rawRequests = reqData;

    // Timeline hanya diperlukan untuk role admin
    if (profile?.role === ROLES.ADMIN) {
      const { data: tlData, error: tlError } = await client
        .from('timeline_tasks')
        .select('*')
        .order('urutan');
      if (tlError) {
        console.warn('Gagal mengambil data timeline dari server:', tlError.message);
        rawTimeline = fallbackTimeline && fallbackTimeline.length > 0 ? fallbackTimeline : INITIAL_TIMELINE;
      } else {
        rawTimeline = tlData && tlData.length > 0 ? tlData : (fallbackTimeline.length > 0 ? fallbackTimeline : INITIAL_TIMELINE);
      }
    } else {
      rawTimeline = [];
    }
  }

  const itemsSource = rawRequests || fallbackItems || [];
  const timelineSource =
    profile?.role === ROLES.ADMIN
      ? (rawTimeline || fallbackTimeline || INITIAL_TIMELINE)
      : [];

  const normalizedItems = itemsSource.map(normalizeItem);
  const normalizedTimeline = timelineSource.map(normalizeTimeline);

  // Filter akses profil sebagai pengamanan lapis ganda (defense-in-depth)
  const secureItems = filterItemsByProfileAccess(normalizedItems, profile);

  const wb = await buildPortalWorkbook({
    profile,
    items: secureItems,
    timeline: normalizedTimeline,
  });

  const fileName = getExportFileName(customDate);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return {
    wb,
    fileName,
    itemsCount: secureItems.length,
    timelineCount: normalizedTimeline.length,
  };
}

// Backward-compatible alias
export function exportItemsToExcel(rows) {
  return exportPortalToExcel({
    profile: { role: 'admin' },
    fallbackItems: rows,
    fallbackTimeline: INITIAL_TIMELINE,
  });
}

function mapItemToRow(item) {
  return [
    item.divisi,
    item.namaBarang,
    item.jumlahBarang,
    item.kategori,
    item.jikaMembeli,
    item.jikaMenyewa,
    item.jikaMeminjam,
    item.catatanOpsional,
    item.tanggalPermintaan,
  ];
}

export function exportItemsToCsv(rows, activeDivisiTab = 'ALL') {
  const csvLines = [
    EXPORT_HEADERS.join(','),
    ...rows.map((r) =>
      mapItemToRow(r)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  const csvContent = '\uFEFF' + csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const scopeName =
    activeDivisiTab === 'ALL'
      ? 'Semua_Data_Divisi'
      : `Rekap_${activeDivisiTab}`;

  link.href = url;
  link.download = `${scopeName}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyItemsToTsv(rows) {
  const tsv = [
    EXPORT_HEADERS.join('\t'),
    ...rows.map((r) =>
      mapItemToRow(r)
        .map((v) => String(v ?? '').replace(/[\t\r\n]+/g, ' '))
        .join('\t')
    ),
  ];

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(tsv);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = tsv;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  textarea.remove();

  if (!success) {
    throw new Error('Clipboard copy failed');
  }
  return true;
}

export function filterItems(
  items,
  {
    activeDivisiTab = 'ALL',
    searchQuery = '',
    categoryFilter = 'ALL',
  }
) {
  const query = (searchQuery || '').toLowerCase().trim();

  return items.filter((item) => {
    const matchDivisi =
      activeDivisiTab === 'ALL' || item.divisi === activeDivisiTab;
    const matchKat =
      categoryFilter === 'ALL' || item.kategori === categoryFilter;
    const photoText = normalizePhotoList(item.fotoBukti)
      .map((p) => `${p.name} ${p.caption}`)
      .join(' ');
    const matchQuery =
      !query ||
      [
        item.divisi,
        item.namaBarang,
        item.jikaMembeli,
        item.jikaMenyewa,
        item.jikaMeminjam,
        item.catatanOpsional,
        photoText,
      ].some((val) => String(val || '').toLowerCase().includes(query));

    return matchDivisi && matchKat && matchQuery;
  });
}
