import { useState, useEffect } from 'react';
import { Plus, RotateCcw, Send } from 'lucide-react';
import { DIVISIONS, createEmptyDraftRow } from '../../data/initialData';
import {
  isMainAdmin,
  getAllowedDivisions,
  matchCanonicalDivision,
} from '../../features/auth/permissions';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ItemFormCard from './ItemFormCard';

export default function RequestForm({ profile, onSubmitItems, onNotify }) {
  const allowedDivisions = getAllowedDivisions(profile, DIVISIONS);
  const canChooseDivision = isMainAdmin(profile);
  const defaultDivision = canChooseDivision
    ? matchCanonicalDivision(profile?.divisi, DIVISIONS) || 'Perlengkapan'
    : profile?.divisi || allowedDivisions[0] || 'Acara';

  const [divisi, setDivisi] = useState(defaultDivision);
  const [tanggalPermintaan, setTanggalPermintaan] = useState('2026-10-26');
  const [draftRows, setDraftRows] = useState(() => [createEmptyDraftRow()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!canChooseDivision && profile?.divisi) {
      setDivisi(profile.divisi);
    } else if (canChooseDivision && profile?.divisi) {
      setDivisi(matchCanonicalDivision(profile.divisi, DIVISIONS));
    }
  }, [canChooseDivision, profile?.divisi]);

  const handleFieldChange = (draftId, field, value) => {
    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.draftId !== draftId) return row;
        if (field === 'jumlahBarang') {
          const parsed = value === '' ? '' : parseInt(value, 10);
          return { ...row, jumlahBarang: Number.isNaN(parsed) ? '' : parsed };
        }
        return { ...row, [field]: value };
      })
    );

    if (errors[draftId]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [draftId]: { ...prev[draftId], [field]: '' },
      }));
    }
  };

  const handleAddRow = () => {
    setDraftRows((prev) => [...prev, createEmptyDraftRow()]);
  };

  const handleRemoveRow = (draftId) => {
    setDraftRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.draftId !== draftId) : prev
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[draftId];
      return next;
    });
  };

  const handleReset = () => {
    setDraftRows([createEmptyDraftRow()]);
    setErrors({});
    onNotify('Formulir telah direset.', 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    let hasInvalidQuantity = false;

    draftRows.forEach((row) => {
      const rowErrors = {};
      const trimmedName = row.namaBarang.trim();
      const qty = Number(row.jumlahBarang);

      if (!trimmedName && draftRows.length === 1) {
        rowErrors.namaBarang = 'Nama barang wajib diisi.';
      }
      if (trimmedName && (!qty || qty < 1)) {
        rowErrors.jumlahBarang = 'Minimal 1 unit.';
        hasInvalidQuantity = true;
      }

      if (Object.keys(rowErrors).length > 0) {
        newErrors[row.draftId] = rowErrors;
      }
    });

    const validRows = draftRows.filter((r) => r.namaBarang.trim() !== '');

    if (validRows.length === 0) {
      setErrors(newErrors);
      onNotify('Mohon isi minimal 1 Nama Barang.', 'error');
      return;
    }

    if (hasInvalidQuantity) {
      setErrors(newErrors);
      onNotify('Jumlah barang harus minimal 1 unit.', 'error');
      return;
    }

    const effectiveDivisi = canChooseDivision
      ? divisi
      : profile?.divisi || divisi;

    onSubmitItems({
      divisi: effectiveDivisi,
      tanggalPermintaan: tanggalPermintaan || '2026-10-26',
      rows: validRows,
    });

    setDraftRows([createEmptyDraftRow()]);
    setErrors({});
  };

  return (
    <Card variant="white" shadow="lg" className="overflow-hidden">
      <form onSubmit={handleSubmit} noValidate>
        {/* Header Divisi & Tanggal */}
        <div className="p-5 sm:p-6 bg-[#DBEAFE] border-b-2 border-[#0A1936] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="selectDivisi"
            label={
              canChooseDivision
                ? 'Divisi Pemohon'
                : 'Divisi Pemohon (Sesuai Akun Anda)'
            }
            required
            disabled={!canChooseDivision}
            value={canChooseDivision ? divisi : profile?.divisi || divisi}
            options={allowedDivisions.length ? allowedDivisions : DIVISIONS}
            onChange={(e) => setDivisi(e.target.value)}
          />

          <Input
            id="inputTanggal"
            label="Tanggal Permintaan"
            type="date"
            required
            value={tanggalPermintaan}
            onChange={(e) => setTanggalPermintaan(e.target.value)}
          />
        </div>

        {/* Daftar Barang Dinamis */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#0A1936]">
                Daftar Barang yang Diajukan
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                Klik tombol &quot;+ Tambah Barang Lain&quot; di bawah jika ingin mengajukan lebih dari 1 barang sekaligus.
              </p>
            </div>
            <Badge variant="dark" className="px-3 py-1 text-xs">
              {draftRows.length} Barang
            </Badge>
          </div>

          <div className="space-y-4">
            {draftRows.map((row, index) => (
              <ItemFormCard
                key={row.draftId}
                row={row}
                index={index}
                canRemove={draftRows.length > 1}
                error={errors[row.draftId] || {}}
                onChangeField={handleFieldChange}
                onRemove={handleRemoveRow}
              />
            ))}
          </div>

          <div className="pt-1">
            <Button
              type="button"
              variant="dashed"
              onClick={handleAddRow}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang Lain (Barang {draftRows.length + 1}, dst.)</span>
            </Button>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="px-5 sm:px-6 py-4 bg-[#E0F2FE] border-t-2 border-[#0A1936] flex items-center justify-end">
          <div className="flex flex-wrap items-center justify-end gap-3 ml-auto">
            <Button type="button" variant="secondary" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              <span>Reset Form</span>
            </Button>
            <Button type="submit" variant="blue">
              <Send className="w-4 h-4" />
              <span>Kirim Permintaan Barang</span>
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
