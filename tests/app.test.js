import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_ITEMS,
  INITIAL_TIMELINE,
  DIVISIONS,
  CATEGORIES,
  PERLAP_STATUS_OPTIONS,
  createEmptyDraftRow,
} from '../src/data/initialData.js';
import { filterItems } from '../src/utils/exportUtils.js';
import { detectRoleFromLocation } from '../src/hooks/useRoleRoute.js';

test('INITIAL_ITEMS memiliki 5 data awal lengkap dengan status tersediaDiPerlap', () => {
  assert.equal(INITIAL_ITEMS.length, 5);
  assert.deepEqual(
    INITIAL_ITEMS.map((i) => i.divisi),
    ['Perlengkapan', 'Humreg', 'Dekdok', 'Acara', 'Keamanan']
  );
  INITIAL_ITEMS.forEach((item) => {
    assert.ok(PERLAP_STATUS_OPTIONS.includes(item.tersediaDiPerlap));
  });
});

test('INITIAL_TIMELINE memiliki 6 tahapan kerja sesuai file sumber', () => {
  assert.equal(INITIAL_TIMELINE.length, 6);
  assert.equal(INITIAL_TIMELINE[0].status, 'Selesai');
  assert.equal(INITIAL_TIMELINE[0].progres, 100);
  assert.equal(INITIAL_TIMELINE[1].status, 'Sedang Berjalan');
  assert.equal(INITIAL_TIMELINE[1].progres, 60);
});

test('DIVISIONS, CATEGORIES, dan PERLAP_STATUS_OPTIONS sesuai spesifikasi', () => {
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
  assert.deepEqual(PERLAP_STATUS_OPTIONS, ['Belum Ada', 'Sudah Ada']);
});

test('createEmptyDraftRow menghasilkan baris draft dengan default yang valid termasuk tersediaDiPerlap', () => {
  const row = createEmptyDraftRow();
  assert.ok(row.draftId.startsWith('draft-'));
  assert.equal(row.namaBarang, '');
  assert.equal(row.jumlahBarang, 1);
  assert.equal(row.kategori, 'Pinjam');
  assert.equal(row.tersediaDiPerlap, 'Belum Ada');
});

test('filterItems memfilter berdasarkan divisi, kategori, status Perlap, dan kata kunci pencarian', () => {
  const all = filterItems(INITIAL_ITEMS, {
    activeDivisiTab: 'ALL',
    searchQuery: '',
    categoryFilter: 'ALL',
    perlapFilter: 'ALL',
  });
  assert.equal(all.length, 5);

  const sudahAdaPerlap = filterItems(INITIAL_ITEMS, {
    activeDivisiTab: 'ALL',
    searchQuery: '',
    categoryFilter: 'ALL',
    perlapFilter: 'Sudah Ada',
  });
  assert.equal(sudahAdaPerlap.length, 2);

  const belumAdaPerlap = filterItems(INITIAL_ITEMS, {
    activeDivisiTab: 'ALL',
    searchQuery: '',
    categoryFilter: 'ALL',
    perlapFilter: 'Belum Ada',
  });
  assert.equal(belumAdaPerlap.length, 3);
});

test('detectRoleFromLocation membedakan URL user dan admin dengan benar', () => {
  assert.equal(
    detectRoleFromLocation({ pathname: '/', search: '', hash: '' }),
    'user'
  );
  assert.equal(
    detectRoleFromLocation({ pathname: '/user', search: '', hash: '' }),
    'user'
  );
  assert.equal(
    detectRoleFromLocation({ pathname: '/admin', search: '', hash: '' }),
    'admin'
  );
  assert.equal(
    detectRoleFromLocation({ pathname: '/', search: '?role=admin', hash: '' }),
    'admin'
  );
  assert.equal(
    detectRoleFromLocation({ pathname: '/', search: '', hash: '#/admin' }),
    'admin'
  );
});
