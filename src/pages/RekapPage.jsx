import { useState, useMemo } from 'react';
import { Search, Database, RotateCcw } from 'lucide-react';
import { CATEGORIES, PERLAP_STATUS_OPTIONS } from '../data/initialData';
import {
  filterItems,
  exportItemsToExcel,
  exportItemsToCsv,
  copyItemsToTsv,
} from '../utils/exportUtils';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import SummaryCards from '../components/rekap/SummaryCards';
import DivisionTabs from '../components/rekap/DivisionTabs';
import ItemsTable from '../components/rekap/ItemsTable';
import EditItemModal from '../components/rekap/EditItemModal';

export default function RekapPage({
  items,
  isAdmin,
  activeDivisiTab,
  onSelectDivisi,
  onTogglePerlapStatus,
  onSaveCrudItem,
  onDeleteItem,
  onResetDefaultData,
  onNotify,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [perlapFilter, setPerlapFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);

  const filteredItems = useMemo(
    () =>
      filterItems(items, {
        activeDivisiTab,
        searchQuery,
        categoryFilter,
        perlapFilter,
      }),
    [items, activeDivisiTab, searchQuery, categoryFilter, perlapFilter]
  );

  const handleExportExcel = () => {
    if (!isAdmin) return;
    exportItemsToExcel(filteredItems, activeDivisiTab);
    onNotify('File Excel (.xls) berhasil diunduh!', 'success');
  };

  const handleExportCsv = () => {
    if (!isAdmin) return;
    exportItemsToCsv(filteredItems, activeDivisiTab);
    onNotify('File CSV berhasil diunduh!', 'success');
  };

  const handleCopyTable = async () => {
    if (!isAdmin) return;
    try {
      await copyItemsToTsv(filteredItems);
      onNotify(
        'Tabel berhasil disalin! Siap ditempel (Ctrl+V) ke Excel / Google Sheets.',
        'success'
      );
    } catch {
      onNotify('Gagal menyalin tabel.', 'error');
    }
  };

  const handleSaveModal = (payload) => {
    onSaveCrudItem(payload);
    setEditingItem(null);
  };

  const categoryOptions = [
    { value: 'ALL', label: 'Semua Kategori' },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const perlapOptions = [
    { value: 'ALL', label: 'Semua Status Perlap' },
    ...PERLAP_STATUS_OPTIONS.map((s) => ({
      value: s,
      label: `Perlap: ${s}`,
    })),
  ];

  return (
    <section className="space-y-6">
      {/* Kartu Ringkasan KPI */}
      <SummaryCards
        filteredItems={filteredItems}
        activeDivisiTab={activeDivisiTab}
      />

      {/* Tabel Rekap & Filter */}
      <Card variant="white" shadow="lg" className="overflow-hidden">
        <DivisionTabs
          activeDivisiTab={activeDivisiTab}
          onSelectDivisi={onSelectDivisi}
          isAdmin={isAdmin}
          onExportExcel={handleExportExcel}
          onExportCsv={handleExportCsv}
          onCopyTable={handleCopyTable}
          onAddNewModal={() =>
            setEditingItem({
              divisi:
                activeDivisiTab === 'ALL' ? 'Perlengkapan' : activeDivisiTab,
              namaBarang: '',
              jumlahBarang: 1,
              kategori: 'Pinjam',
              tersediaDiPerlap: 'Belum Ada',
              jikaMembeli: '',
              jikaMenyewa: '',
              jikaMeminjam: '',
              catatanOpsional: '',
              tanggalPermintaan: '2026-10-26',
            })
          }
        />

        {/* Bar Pencarian, Filter Kategori & Filter Status Perlap */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#F4F8FF] border-b-2 border-[#0A1936] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <Input
              id="searchBarangInput"
              type="text"
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, tempat sewa, peminjam, atau catatan..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-52">
              <label
                htmlFor="filterPerlapSelect"
                className="text-xs font-extrabold uppercase text-[#0A1936] shrink-0"
              >
                Perlap:
              </label>
              <Select
                id="filterPerlapSelect"
                value={perlapFilter}
                options={perlapOptions}
                onChange={(e) => setPerlapFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-56">
              <label
                htmlFor="filterKategoriSelect"
                className="text-xs font-extrabold uppercase text-[#0A1936] shrink-0"
              >
                Kategori:
              </label>
              <Select
                id="filterKategoriSelect"
                value={categoryFilter}
                options={categoryOptions}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <ItemsTable
          items={filteredItems}
          isAdmin={isAdmin}
          onTogglePerlapStatus={onTogglePerlapStatus}
          onEditItem={(item) => setEditingItem(item)}
          onDeleteItem={onDeleteItem}
        />
      </Card>

      {/* Modal Tambah/Edit (Admin CRUD) */}
      {isAdmin && editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveModal}
        />
      )}

      {/* Info Status Penyimpanan Lokal (Tampil untuk Admin) */}
      {isAdmin && (
        <Card variant="cream" className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black text-[#0A1936] flex items-center gap-2">
                <Database className="w-4 h-4 shrink-0 text-[#132956]" />
                <span>Panel Data Admin Perlengkapan</span>
              </h3>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Data disimpan secara lokal di browser. Anda dapat mengubah status ketersediaan di Perlap, mengedit/menghapus barang, atau mengekspor data ke Excel (.xls) &amp; CSV.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onResetDefaultData}
              className="self-start md:self-center shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Data Awal</span>
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}
