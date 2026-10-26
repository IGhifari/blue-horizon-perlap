import { FileSpreadsheet, Download, Copy, Plus } from 'lucide-react';
import { DIVISIONS } from '../../data/initialData';
import Button from '../ui/Button';

export default function DivisionTabs({
  activeDivisiTab,
  onSelectDivisi,
  isAdmin,
  onExportExcel,
  onExportCsv,
  onCopyTable,
  onAddNewModal,
}) {
  const tabs = [
    { id: 'ALL', label: 'Semua (Form Responses)' },
    ...DIVISIONS.map((div) => ({ id: div, label: `Rekap - ${div}` })),
  ];

  return (
    <div className="p-4 sm:p-5 bg-[#DBEAFE] border-b-2 border-[#0A1936] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Sheet Selector Pills */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filter Sheet Divisi"
      >
        {tabs.map((tab) => {
          const isActive = activeDivisiTab === tab.id;
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

      {/* Tombol Aksi Khusus Admin */}
      {isAdmin && (
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
            onClick={onExportExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xls)</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExportCsv}
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV</span>
          </Button>
          <Button
            type="button"
            variant="blue"
            size="sm"
            onClick={onCopyTable}
          >
            <Copy className="w-4 h-4" />
            <span>Salin ke Spreadsheet</span>
          </Button>
        </div>
      )}
    </div>
  );
}
