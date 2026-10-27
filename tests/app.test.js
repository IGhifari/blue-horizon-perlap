import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_ITEMS,
  INITIAL_TIMELINE,
  DIVISIONS,
  CATEGORIES,
  createEmptyDraftRow,
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
  canReadItem,
  canCreateItem,
  canEditItem,
  canDeleteItem,
  canManageUsers,
  canManageTimeline,
  canUpdateProfileRoleOrDivisi,
  resolveEffectiveDivisionForCreate,
  filterItemsByProfileAccess,
  usernameToInternalEmail,
} from '../src/features/auth/permissions.js';

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

test('Skenario 2: Admin divisi hanya dapat melihat dan mengubah data divisinya sendiri', () => {
  const visible = filterItemsByProfileAccess(INITIAL_ITEMS, PROFILE_ADMIN_ACARA);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].divisi, 'Acara');

  const itemAcara = INITIAL_ITEMS.find((i) => i.divisi === 'Acara');
  const itemDekdok = INITIAL_ITEMS.find((i) => i.divisi === 'Dekdok');

  assert.equal(canReadItem(PROFILE_ADMIN_ACARA, itemAcara), true);
  assert.equal(canEditItem(PROFILE_ADMIN_ACARA, itemAcara, { divisi: 'Acara' }), true);
  assert.equal(canDeleteItem(PROFILE_ADMIN_ACARA, itemAcara), true);

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

test('Ekspor Excel role admin mencakup 7 sheet sesuai urutan spesifikasi dan memuat seluruh data', async () => {
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

  // Periksa header sheet Semua Data
  const wsSemua = wb.getWorksheet('Semua Data');
  assert.ok(wsSemua);
  const headerValues = [
    wsSemua.getCell('A4').value,
    wsSemua.getCell('B4').value,
    wsSemua.getCell('C4').value,
    wsSemua.getCell('D4').value,
    wsSemua.getCell('E4').value,
    wsSemua.getCell('F4').value,
    wsSemua.getCell('G4').value,
    wsSemua.getCell('H4').value,
    wsSemua.getCell('I4').value,
  ];
  assert.deepEqual(headerValues, EXPORT_HEADERS);

  // Periksa autoFilter dan freeze pane
  assert.equal(wsSemua.autoFilter, 'A4:I4');
  assert.equal(wsSemua.views[0]?.state, 'frozen');
  assert.equal(wsSemua.views[0]?.ySplit, 4);

  // Periksa sheet Timeline Perlengkapan
  const wsTimeline = wb.getWorksheet('Timeline Perlengkapan');
  assert.ok(wsTimeline);
  assert.equal(wsTimeline.getCell('A7').value, 'No');
  assert.equal(wsTimeline.getCell('B7').value, 'Divisi');
  assert.equal(wsTimeline.autoFilter, 'A7:H7');
  assert.equal(wsTimeline.views[0]?.ySplit, 7);

  // Periksa bahwa data di sheet Rekap - Acara hanya divisi Acara
  const wsAcara = wb.getWorksheet('Rekap - Acara');
  assert.ok(wsAcara);
  const divisiVal = wsAcara.getCell('A5').value;
  assert.equal(divisiVal, 'Acara');
});

test('Ekspor Excel role admin_divisi hanya memuat sheet divisinya dan tidak membocorkan divisi lain', async () => {
  const result = await exportPortalToExcel({
    profile: PROFILE_ADMIN_ACARA,
    fallbackItems: INITIAL_ITEMS,
    fallbackTimeline: INITIAL_TIMELINE,
  });

  const wb = result.wb;
  const sheetNames = wb.worksheets.map((s) => s.name);

  // Hanya sheet Timeline, Semua Data (berisi data Acara saja), dan Rekap - Acara
  assert.deepEqual(sheetNames, [
    'Timeline Perlengkapan',
    'Semua Data',
    'Rekap - Acara',
  ]);

  // Pastikan sheet divisi lain tidak dibuat
  assert.equal(sheetNames.includes('Rekap - Perlengkapan'), false);
  assert.equal(sheetNames.includes('Rekap - Humreg'), false);
  assert.equal(sheetNames.includes('Rekap - Dekdok'), false);
  assert.equal(sheetNames.includes('Rekap - Keamanan'), false);

  // Pastikan pada sheet Semua Data hanya berisi 1 item (milik Acara)
  const wsSemua = wb.getWorksheet('Semua Data');
  assert.equal(wsSemua.getCell('A5').value, 'Acara');
  assert.equal(wsSemua.getCell('A6').value, 'TOTAL KESELURUHAN'); // baris setelah data adalah summary
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
