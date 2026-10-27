import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../data/initialData';
import {
  isMainAdmin,
  canManageDivisionItems,
  filterItemsByProfileAccess,
} from '../features/auth/permissions';
import {
  filterItems,
  exportPortalToExcel,
} from '../utils/exportUtils';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SummaryCards from '../components/rekap/SummaryCards';
import DivisionTabs from '../components/rekap/DivisionTabs';
import ItemsTable from '../components/rekap/ItemsTable';
import EditItemModal from '../components/rekap/EditItemModal';

export default function RekapPage({
  items,
  profile,
  activeDivisiTab,
  onSelectDivisi,
  onSaveCrudItem,
  onDeleteItem,
  onNotify,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const mainAdmin = isMainAdmin(profile);
  const canEditItems = canManageDivisionItems(profile);
  const effectiveDivisiTab = mainAdmin
    ? activeDivisiTab
    : profile?.divisi || 'ALL';

  const accessibleItems = useMemo(
    () => filterItemsByProfileAccess(items, profile),
    [items, profile]
  );

  const filteredItems = useMemo(
    () =>
      filterItems(accessibleItems, {
        activeDivisiTab: effectiveDivisiTab,
        searchQuery,
        categoryFilter,
      }),
    [accessibleItems, effectiveDivisiTab, searchQuery, categoryFilter]
  );

  const handleExportExcel = async () => {
    if (!canEditItems || isExporting) return;
    setIsExporting(true);
    try {
      await exportPortalToExcel({
        profile,
        supabaseClient: supabase,
        fallbackItems: items,
      });
      onNotify('File Excel (.xlsx) berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Ekspor Excel gagal:', err);
      onNotify(err?.message || 'Gagal mengekspor file Excel.', 'error');
    } finally {
      setIsExporting(false);
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

  return (
    <section className="space-y-6">
      {/* Kartu Ringkasan KPI */}
      <SummaryCards
        filteredItems={filteredItems}
        activeDivisiTab={effectiveDivisiTab}
      />

      {/* Tabel Rekap & Filter */}
      <Card variant="white" shadow="lg" className="overflow-hidden">
        <DivisionTabs
          activeDivisiTab={effectiveDivisiTab}
          onSelectDivisi={onSelectDivisi}
          profile={profile}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
          onAddNewModal={() =>
            setEditingItem({
              divisi: mainAdmin
                ? effectiveDivisiTab === 'ALL'
                  ? 'Perlengkapan'
                  : effectiveDivisiTab
                : profile?.divisi,
              namaBarang: '',
              jumlahBarang: 1,
              kategori: 'Pinjam',
              jikaMembeli: '',
              jikaMenyewa: '',
              jikaMeminjam: '',
              catatanOpsional: '',
              tanggalPermintaan: '2026-10-26',
            })
          }
        />

        {/* Bar Pencarian & Filter Kategori */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#F4F8FF] border-b-2 border-[#0A1936] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

          <div className="flex items-center gap-2 w-full sm:w-64">
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

        {/* Tabel Data */}
        <ItemsTable
          items={filteredItems}
          isAdmin={canEditItems}
          onEditItem={(item) => setEditingItem(item)}
          onDeleteItem={onDeleteItem}
        />
      </Card>

      {/* Modal Tambah/Edit (Admin Utama & Admin Divisi) */}
      {canEditItems && editingItem && (
        <EditItemModal
          item={editingItem}
          profile={profile}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveModal}
        />
      )}
    </section>
  );
}
