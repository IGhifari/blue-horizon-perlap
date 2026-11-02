import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_ITEMS,
  INITIAL_TIMELINE,
  DIVISIONS,
  CATEGORIES,
  createEmptyDraftRow,
  getTodayDateString,
} from '../src/data/initialData.js';
import {
  filterItems,
  buildPortalWorkbook,
  exportPortalToExcel,
  getExportFileName,
  EXPORT_HEADERS,
} from '../src/utils/exportUtils.js';
import {
  ROLES,
  isMainAdmin,
  canReadItem,
  canCreateItem,
  canEditItem,
  canDeleteItem,
  canManageUsers,
  canManageTimeline,
  canManagePhotos,
  canManageDivisionItems,
  canExportDivisionItems,
  canUpdateProfileRoleOrDivisi,
  resolveEffectiveDivisionForCreate,
  filterItemsByProfileAccess,
  usernameToInternalEmail,
} from '../src/features/auth/permissions.js';
import {
  validateImageFile,
  normalizePhotoList,
  uploadPhotoFile,
  removePhotoFromStorage,
  MAX_FILE_SIZE_BYTES,
} from '../src/utils/photoUtils.js';

const PROFILE_MAIN_ADMIN = {
  id: 'uuid-admin-1',
  username: 'admin_utama',
  role: ROLES.ADMIN,
  divisi: 'Perlengkapan',
};

const PROFILE_ADMIN_ACARA = {
  id: 'uuid-admin-acara',
  username: 'admin_acara',
  role: ROLES.ADMIN_DIVISI,
  divisi: 'Acara',
};

const PROFILE_USER_ACARA = {
  id: 'uuid-user-acara',
  username: 'anggota_acara',
  role: ROLES.USER,
  divisi: 'Acara',
};

const PROFILE_USER_DEKDOK = {
  id: 'uuid-user-dekdok',
  username: 'anggota_dekdok',
  role: ROLES.USER,
  divisi: 'Dekdok',
};

test('INITIAL_ITEMS, INITIAL_TIMELINE, DIVISIONS, dan CATEGORIES sesuai spesifikasi', () => {
  assert.equal(INITIAL_ITEMS.length, 5);
  assert.equal(INITIAL_TIMELINE.length, 6);
  assert.deepEqual(DIVISIONS, [
    'Perlengkapan',
    'Humreg',
    'Dekdok',
    'Acara',
    'Keamanan',
  ]);
  assert.deepEqual(CATEGORIES, [
    'Pinjam',
    'Beli',
    'Sewa',
    'Sudah Tersedia di Divisi',
  ]);
});

test('createEmptyDraftRow menghasilkan baris draft dengan default yang valid', () => {
  const row = createEmptyDraftRow();
  assert.ok(row.draftId.startsWith('draft-'));
  assert.equal(row.namaBarang, '');
  assert.equal(row.jumlahBarang, 1);
  assert.equal(row.kategori, 'Pinjam');
});

test('getTodayDateString menghasilkan tanggal hari ini dengan format YYYY-MM-DD', () => {
  const today = getTodayDateString();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);

  const fixedDate = new Date(2026, 9, 28);
  assert.equal(getTodayDateString(fixedDate), '2026-10-28');
});

test('Skenario 1: Admin utama dapat melihat, mengubah, menghapus data semua divisi serta mengelola akun & timeline', () => {
  const visible = filterItemsByProfileAccess(INITIAL_ITEMS, PROFILE_MAIN_ADMIN);
  assert.equal(visible.length, 5);

  for (const item of INITIAL_ITEMS) {
    assert.equal(canReadItem(PROFILE_MAIN_ADMIN, item), true);
    assert.equal(canEditItem(PROFILE_MAIN_ADMIN, item, { divisi: 'Humreg' }), true);
    assert.equal(canDeleteItem(PROFILE_MAIN_ADMIN, item), true);
  }

  assert.equal(canManageUsers(PROFILE_MAIN_ADMIN), true);
  assert.equal(canManageTimeline(PROFILE_MAIN_ADMIN), true);
});

test('Skenario 2: Admin divisi hanya dapat melihat data divisinya sendiri (read-only di rekap per divisi, tidak bisa edit & hapus)', () => {
  const visible = filterItemsByProfileAccess(INITIAL_ITEMS, PROFILE_ADMIN_ACARA);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].divisi, 'Acara');

  const itemAcara = INITIAL_ITEMS.find((i) => i.divisi === 'Acara');
  const itemDekdok = INITIAL_ITEMS.find((i) => i.divisi === 'Dekdok');

  // Boleh membaca data divisinya sendiri
  assert.equal(canReadItem(PROFILE_ADMIN_ACARA, itemAcara), true);

  // Rekap per divisi bersifat read-only: Admin Divisi tidak boleh edit atau hapus
  assert.equal(canEditItem(PROFILE_ADMIN_ACARA, itemAcara, { divisi: 'Acara' }), false);
  assert.equal(canDeleteItem(PROFILE_ADMIN_ACARA, itemAcara), false);
  assert.equal(canManageDivisionItems(PROFILE_ADMIN_ACARA), false);

  // Boleh mengekspor data divisinya sendiri ke Excel
  assert.equal(canExportDivisionItems(PROFILE_ADMIN_ACARA), true);

  // Tidak boleh memindahkan item divisinya ke divisi lain
  assert.equal(canEditItem(PROFILE_ADMIN_ACARA, itemAcara, { divisi: 'Dekdok' }), false);

  // Tidak boleh mengelola akun atau timeline
  assert.equal(canManageUsers(PROFILE_ADMIN_ACARA), false);
  assert.equal(canManageTimeline(PROFILE_ADMIN_ACARA), false);

  // Tidak boleh mengakses divisi lain
  assert.equal(canReadItem(PROFILE_ADMIN_ACARA, itemDekdok), false);
  assert.equal(canEditItem(PROFILE_ADMIN_ACARA, itemDekdok), false);
  assert.equal(canDeleteItem(PROFILE_ADMIN_ACARA, itemDekdok), false);
});

test('Skenario 3: User hanya dapat mengirim pengajuan untuk divisinya sendiri', () => {
  assert.equal(canCreateItem(PROFILE_USER_ACARA, 'Acara'), true);
  assert.equal(canCreateItem(PROFILE_USER_ACARA, 'Keamanan'), false);

  const effective = resolveEffectiveDivisionForCreate(
    PROFILE_USER_ACARA,
    'Acara'
  );
  assert.equal(effective, 'Acara');

  // Jika user memanipulasi request dengan mengirim divisi lain, harus ditolak
  assert.throws(
    () => resolveEffectiveDivisionForCreate(PROFILE_USER_ACARA, 'Perlengkapan'),
    /Akses ditolak/
  );
});

test('Skenario 4: User dan Admin Divisi tidak dapat mengubah role atau divisi akun', () => {
  assert.equal(canUpdateProfileRoleOrDivisi(PROFILE_USER_ACARA), false);
  assert.equal(canUpdateProfileRoleOrDivisi(PROFILE_ADMIN_ACARA), false);
  assert.equal(canUpdateProfileRoleOrDivisi(PROFILE_MAIN_ADMIN), true);
});

test('Skenario 5: Pengguna divisi A tidak dapat membaca, mengedit, atau menghapus data divisi B', () => {
  const itemAcara = INITIAL_ITEMS.find((i) => i.divisi === 'Acara');
  const itemDekdok = INITIAL_ITEMS.find((i) => i.divisi === 'Dekdok');

  // User Dekdok mencoba mengakses item Acara
  assert.equal(canReadItem(PROFILE_USER_DEKDOK, itemAcara), false);
  assert.equal(canEditItem(PROFILE_USER_DEKDOK, itemAcara), false);
  assert.equal(canDeleteItem(PROFILE_USER_DEKDOK, itemAcara), false);

  // User Dekdok hanya bisa membaca item Dekdok (dan tidak bisa edit/hapus)
  assert.equal(canReadItem(PROFILE_USER_DEKDOK, itemDekdok), true);
  assert.equal(canEditItem(PROFILE_USER_DEKDOK, itemDekdok), false);
  assert.equal(canDeleteItem(PROFILE_USER_DEKDOK, itemDekdok), false);
});

test('Skenario 6: Pengguna yang belum login tidak dapat mengakses data internal', () => {
  const visible = filterItemsByProfileAccess(INITIAL_ITEMS, null);
  assert.equal(visible.length, 0);

  for (const item of INITIAL_ITEMS) {
    assert.equal(canReadItem(null, item), false);
    assert.equal(canEditItem(null, item), false);
    assert.equal(canDeleteItem(null, item), false);
  }

  assert.throws(
    () => resolveEffectiveDivisionForCreate(null, 'Acara'),
    /Autentikasi diperlukan/
  );
});

test('Pemetaan username ke format email internal & filter tabel berfungsi konsisten', () => {
  assert.equal(
    usernameToInternalEmail('Admin_Perlap'),
    'admin_perlap@perlap.internal'
  );

  const filtered = filterItems(INITIAL_ITEMS, {
    activeDivisiTab: 'ALL',
    searchQuery: 'Kabel',
    categoryFilter: 'Pinjam',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].namaBarang, 'Kabel Roll 25 Meter');
});

test('Format nama file ekspor memuat tanggal Portal-Logistik-YYYY-MM-DD.xlsx', () => {
  const fileName = getExportFileName('2026-10-27');
  assert.equal(fileName, 'Portal-Logistik-2026-10-27.xlsx');
});

test('Ekspor Excel role admin mencakup 7 sheet sesuai urutan spesifikasi dan memuat seluruh data tanpa header banner', async () => {
  const wb = await buildPortalWorkbook({
    profile: PROFILE_MAIN_ADMIN,
    items: INITIAL_ITEMS,
    timeline: INITIAL_TIMELINE,
  });

  const sheetNames = wb.worksheets.map((s) => s.name);
  assert.deepEqual(sheetNames, [
    'Timeline Perlengkapan',
    'Semua Data',
    'Rekap - Acara',
    'Rekap - Perlengkapan',
    'Rekap - Humreg',
    'Rekap - Dekdok',
    'Rekap - Keamanan',
  ]);

  // Periksa header sheet Semua Data (langsung di baris 1 tanpa banner judul/petunjuk)
  const wsSemua = wb.getWorksheet('Semua Data');
  assert.ok(wsSemua);
  const headerValues = [
    wsSemua.getCell('A1').value,
    wsSemua.getCell('B1').value,
    wsSemua.getCell('C1').value,
    wsSemua.getCell('D1').value,
    wsSemua.getCell('E1').value,
    wsSemua.getCell('F1').value,
    wsSemua.getCell('G1').value,
    wsSemua.getCell('H1').value,
    wsSemua.getCell('I1').value,
  ];
  assert.deepEqual(headerValues, EXPORT_HEADERS);

  // Periksa autoFilter dan freeze pane di baris 1
  assert.equal(wsSemua.autoFilter, 'A1:I1');
  assert.equal(wsSemua.views[0]?.state, 'frozen');
  assert.equal(wsSemua.views[0]?.ySplit, 1);

  // Data baris pertama dimulai langsung di baris 2
  assert.equal(wsSemua.getCell('A2').value, 'Perlengkapan');

  // Periksa sheet Timeline Perlengkapan (tanpa kalimat petunjuk Cara Penggunaan)
  const wsTimeline = wb.getWorksheet('Timeline Perlengkapan');
  assert.ok(wsTimeline);
  assert.equal(wsTimeline.getCell('A6').value, 'No');
  assert.equal(wsTimeline.getCell('B6').value, 'Divisi');
  assert.equal(wsTimeline.autoFilter, 'A6:H6');
  assert.equal(wsTimeline.views[0]?.ySplit, 6);
  assert.equal(wsTimeline.getCell('A2').value, null);

  // Periksa bahwa data di sheet Rekap - Acara hanya divisi Acara (dimulai di baris 2)
  const wsAcara = wb.getWorksheet('Rekap - Acara');
  assert.ok(wsAcara);
  const divisiVal = wsAcara.getCell('A2').value;
  assert.equal(divisiVal, 'Acara');
});

test('Ekspor Excel role admin_divisi hanya memuat sheet divisinya saja tanpa sheet timeline perlengkapan dan tanpa sheet semua data', async () => {
  const result = await exportPortalToExcel({
    profile: PROFILE_ADMIN_ACARA,
    fallbackItems: INITIAL_ITEMS,
    fallbackTimeline: INITIAL_TIMELINE,
  });

  const wb = result.wb;
  const sheetNames = wb.worksheets.map((s) => s.name);

  // Hanya sheet Rekap - Acara saja (sheet Timeline Perlengkapan dan Semua Data tidak dibuat)
  assert.deepEqual(sheetNames, [
    'Rekap - Acara',
  ]);

  // Pastikan sheet Semua Data dan Timeline Perlengkapan tidak ada
  assert.equal(sheetNames.includes('Timeline Perlengkapan'), false);
  assert.equal(sheetNames.includes('Semua Data'), false);

  // Pastikan sheet divisi lain tidak dibuat
  assert.equal(sheetNames.includes('Rekap - Perlengkapan'), false);
  assert.equal(sheetNames.includes('Rekap - Humreg'), false);
  assert.equal(sheetNames.includes('Rekap - Dekdok'), false);
  assert.equal(sheetNames.includes('Rekap - Keamanan'), false);

  // Periksa bahwa sheet Rekap - Acara langsung dimulai dengan header di baris 1 dan data di baris 2
  const wsAcara = wb.getWorksheet('Rekap - Acara');
  assert.equal(wsAcara.getCell('A1').value, 'Divisi');
  assert.equal(wsAcara.getCell('B1').value, 'Nama Barang');
  assert.equal(wsAcara.autoFilter, 'A1:I1');
  assert.equal(wsAcara.views[0]?.ySplit, 1);
  assert.equal(wsAcara.getCell('A2').value, 'Acara');
  assert.equal(wsAcara.getCell('A3').value, 'TOTAL REKAP ACARA'); // baris setelah data adalah summary
});

test('Ekspor Excel melempar error jika data Supabase gagal diambil dan tidak mengunduh data parsial', async () => {
  const mockSupabaseClient = {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: { message: 'Database connection failed' } }),
      }),
    }),
  };

  await assert.rejects(
    () =>
      exportPortalToExcel({
        profile: PROFILE_MAIN_ADMIN,
        supabaseClient: mockSupabaseClient,
        fallbackItems: INITIAL_ITEMS,
      }),
    /Gagal mengambil data pengajuan dari server: Database connection failed/
  );
});

test('Validasi konfigurasi Supabase menyebutkan nama variabel yang belum tersedia tanpa menampilkan nilai rahasia', () => {
  function validateConfig(env) {
    const url = env?.VITE_SUPABASE_URL || env?.SUPABASE_URL;
    const key =
      env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env?.VITE_SUPABASE_ANON_KEY ||
      env?.SUPABASE_PUBLISHABLE_KEY ||
      env?.SUPABASE_ANON_KEY;

    const missing = [];
    if (!url) missing.push('VITE_SUPABASE_URL (atau SUPABASE_URL)');
    if (!key) {
      missing.push(
        'VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY (atau SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY)'
      );
    }
    if (missing.length > 0) {
      throw new Error(
        `Konfigurasi Supabase belum lengkap. Variabel environment berikut belum tersedia: ${missing.join(', ')}.`
      );
    }
    return { url, key };
  }

  // Jika URL dan Key kosong
  assert.throws(
    () => validateConfig({}),
    /VITE_SUPABASE_URL \(atau SUPABASE_URL\)/
  );

  // Jika hanya URL tersedia
  assert.throws(
    () => validateConfig({ VITE_SUPABASE_URL: 'https://test.supabase.co' }),
    /VITE_SUPABASE_PUBLISHABLE_KEY/
  );

  // Jika menggunakan format standar Vite (VITE_)
  const res1 = validateConfig({
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  });
  assert.equal(res1.url, 'https://test.supabase.co');

  // Jika menggunakan format alternatif (SUPABASE_)
  const res2 = validateConfig({
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'test-key',
  });
  assert.equal(res2.url, 'https://test.supabase.co');
});

test('Hak akses foto bukti transaksi hanya diizinkan untuk Admin Utama (Divisi Perlengkapan)', () => {
  assert.equal(canManagePhotos(PROFILE_MAIN_ADMIN), true);
  assert.equal(canManagePhotos(PROFILE_ADMIN_ACARA), false);
  assert.equal(canManagePhotos(PROFILE_USER_ACARA), false);
  assert.equal(canManagePhotos(null), false);

  const itemAcara = {
    ...INITIAL_ITEMS.find((i) => i.divisi === 'Acara'),
    fotoBukti: [{ id: 'p-1', name: 'struk.jpg', url: 'https://example.com/struk.jpg' }],
  };

  // Admin Utama diizinkan mengedit detail barang di sheet Semua Data
  assert.equal(
    canEditItem(PROFILE_MAIN_ADMIN, itemAcara, {
      divisi: 'Acara',
      fotoBukti: itemAcara.fotoBukti,
    }),
    true
  );

  // Admin Divisi tidak boleh mengedit barang (rekap per divisi bersifat read-only)
  assert.equal(
    canEditItem(PROFILE_ADMIN_ACARA, itemAcara, {
      divisi: 'Acara',
      fotoBukti: itemAcara.fotoBukti,
    }),
    false
  );
});

test('Validasi dan normalisasi multi-foto bukti transaksi berfungsi dengan benar', () => {
  assert.equal(
    validateImageFile({ name: 'struk.jpg', type: 'image/jpeg', size: 1024 * 500 }).valid,
    true
  );
  assert.equal(
    validateImageFile({ name: 'nota.png', type: 'image/png', size: 1024 * 200 }).valid,
    true
  );
  assert.equal(
    validateImageFile({ name: 'dokumen.pdf', type: 'application/pdf', size: 1024 }).valid,
    false
  );
  assert.equal(
    validateImageFile({
      name: 'besar.jpg',
      type: 'image/jpeg',
      size: MAX_FILE_SIZE_BYTES + 100,
    }).valid,
    false
  );

  const normalized = normalizePhotoList([
    {
      id: 'photo-1',
      name: 'struk-1.jpg',
      url: 'https://cdn.example.com/struk-1.jpg',
      caption: 'Struk Pembelian Kabel Roll',
    },
    'https://cdn.example.com/struk-2.png',
  ]);
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].caption, 'Struk Pembelian Kabel Roll');
  assert.equal(normalized[1].url, 'https://cdn.example.com/struk-2.png');
});

test('Upload dan hapus foto bukti transaksi mendukung Supabase Storage & menolak non-Admin Utama', async () => {
  const dummyFile = {
    name: 'struk-tokopedia.jpg',
    type: 'image/jpeg',
    size: 2048,
    dataUrl: 'data:image/jpeg;base64,dGVzdA==',
  };

  // Non-admin harus ditolak ketika mencoba upload
  await assert.rejects(
    () =>
      uploadPhotoFile(dummyFile, {
        itemId: 'item-1',
        divisi: 'Acara',
        profile: PROFILE_ADMIN_ACARA,
      }),
    /Hanya Admin Utama/
  );

  // Mock Supabase Storage berhasil
  let removedPaths = [];
  const mockSupabaseStorage = {
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock/path' }, error: null }),
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/bukti-transaksi/${path}` },
        }),
        remove: async (paths) => {
          removedPaths = paths;
          return { data: paths, error: null };
        },
      }),
    },
  };

  const uploaded = await uploadPhotoFile(dummyFile, {
    itemId: 'item-1',
    divisi: 'Perlengkapan',
    profile: PROFILE_MAIN_ADMIN,
    supabaseClient: mockSupabaseStorage,
    caption: 'Struk Pembelian Rp 250.000',
  });

  assert.ok(uploaded.id.startsWith('photo-'));
  assert.equal(uploaded.name, 'struk-tokopedia.jpg');
  assert.equal(uploaded.caption, 'Struk Pembelian Rp 250.000');
  assert.equal(uploaded.uploadedBy, 'admin_utama');
  assert.ok(uploaded.url.includes('bukti-transaksi/perlengkapan/item-1/'));
  assert.ok(uploaded.storagePath);

  await removePhotoFromStorage(uploaded, {
    profile: PROFILE_MAIN_ADMIN,
    supabaseClient: mockSupabaseStorage,
  });
  assert.deepEqual(removedPaths, [uploaded.storagePath]);
});

test('Tab Rekap per divisi bersifat read-only (Edit & Hapus eksklusif untuk Admin Utama di tab Semua Data)', () => {
  const isAllTab = (tab) => tab === 'ALL';
  const canEditOnTab = (profile, tab) => isMainAdmin(profile) && isAllTab(tab);

  // Admin Utama di tab Semua Data ('ALL'): Boleh Edit & Hapus
  assert.equal(canEditOnTab(PROFILE_MAIN_ADMIN, 'ALL'), true);

  // Admin Utama di tab divisi ('Rekap - Acara', 'Rekap - Perlengkapan', dll.): Tidak boleh Edit & Hapus
  assert.equal(canEditOnTab(PROFILE_MAIN_ADMIN, 'Acara'), false);
  assert.equal(canEditOnTab(PROFILE_MAIN_ADMIN, 'Dekdok'), false);
  assert.equal(canEditOnTab(PROFILE_MAIN_ADMIN, 'Perlengkapan'), false);
  assert.equal(canEditOnTab(PROFILE_MAIN_ADMIN, 'Humreg'), false);
  assert.equal(canEditOnTab(PROFILE_MAIN_ADMIN, 'Keamanan'), false);

  // Admin Divisi di tab manapun: Tidak boleh Edit & Hapus
  assert.equal(canEditOnTab(PROFILE_ADMIN_ACARA, 'ALL'), false);
  assert.equal(canEditOnTab(PROFILE_ADMIN_ACARA, 'Acara'), false);

  // User Divisi di tab manapun: Tidak boleh Edit & Hapus
  assert.equal(canEditOnTab(PROFILE_USER_ACARA, 'ALL'), false);
  assert.equal(canEditOnTab(PROFILE_USER_ACARA, 'Acara'), false);
});

