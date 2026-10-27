import { FileSpreadsheet, Plus } from 'lucide-react';
import { DIVISIONS } from '../../data/initialData';
import {
  isMainAdmin,
  canManageDivisionItems,
} from '../../features/auth/permissions';
import Button from '../ui/Button';

export default function DivisionTabs({
  activeDivisiTab,
  onSelectDivisi,
  profile,
  onExportExcel,
  isExporting = false,
  onAddNewModal,
}) {
  const showAllTabs = isMainAdmin(profile);
  const canEditAndExport = canManageDivisionItems(profile);

  const tabs = showAllTabs
    ? [
        { id: 'ALL', label: 'Semua (Form Responses)' },
        ...DIVISIONS.map((div) => ({ id: div, label: `Rekap - ${div}` })),
      ]
    : profile?.divisi
      ? [{ id: profile.divisi, label: `Rekap - ${profile.divisi}` }]
      : [];

  return (
    <div className="p-4 sm:p-5 bg-[#DBEAFE] border-b-2 border-[#0A1936] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Sheet Selector Pills */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filter Sheet Divisi"
      >
        {tabs.map((tab) => {
          const isActive =
            activeDivisiTab === tab.id || (!showAllTabs && tabs.length === 1);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectDivisi(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-[#0A1936] transition-all duration-100 cursor-pointer select-none ${
                isActive
                  ? 'bg-[#132956] text-white shadow-[3px_3px_0px_#38BDF8] -translate-y-[1px]'
                  : 'bg-white hover:bg-[#E0F2FE] text-[#0A1936] shadow-[2px_2px_0px_#0A1936] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tombol Aksi Khusus Admin Utama & Admin Divisi */}
      {canEditAndExport && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAddNewModal}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </Button>
          <Button
            type="button"
            variant="mint"
            size="sm"
            disabled={isExporting}
            onClick={onExportExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel (.xlsx)'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
