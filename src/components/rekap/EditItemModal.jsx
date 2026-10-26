import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import {
  DIVISIONS,
  CATEGORIES,
  PERLAP_STATUS_OPTIONS,
} from '../../data/initialData';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

export default function EditItemModal({ item, onClose, onSave }) {
  const isNew = !item?.id;
  const [formData, setFormData] = useState({
    divisi: 'Perlengkapan',
    namaBarang: '',
    jumlahBarang: 1,
    kategori: 'Pinjam',
    tersediaDiPerlap: 'Belum Ada',
    jikaMembeli: '',
    jikaMenyewa: '',
    jikaMeminjam: '',
    catatanOpsional: '',
    tanggalPermintaan: '2026-10-26',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        divisi: item.divisi || 'Perlengkapan',
        namaBarang: item.namaBarang || '',
        jumlahBarang: item.jumlahBarang || 1,
        kategori: item.kategori || 'Pinjam',
        tersediaDiPerlap: item.tersediaDiPerlap || 'Belum Ada',
        jikaMembeli: item.jikaMembeli === '-' ? '' : item.jikaMembeli || '',
        jikaMenyewa: item.jikaMenyewa === '-' ? '' : item.jikaMenyewa || '',
        jikaMeminjam: item.jikaMeminjam === '-' ? '' : item.jikaMeminjam || '',
        catatanOpsional:
          item.catatanOpsional === '-' ? '' : item.catatanOpsional || '',
        tanggalPermintaan: item.tanggalPermintaan || '2026-10-26',
      });
    }
  }, [item]);

  if (!item) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === 'jumlahBarang'
          ? value === ''
            ? ''
            : parseInt(value, 10) || 1
          : value,
    }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.namaBarang.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }
    if (!formData.jumlahBarang || Number(formData.jumlahBarang) < 1) {
      setError('Jumlah barang minimal 1 unit.');
      return;
    }

    onSave({
      ...(item.id ? { id: item.id } : {}),
      divisi: formData.divisi,
      namaBarang: formData.namaBarang.trim(),
      jumlahBarang: Math.max(1, Number(formData.jumlahBarang) || 1),
      kategori: formData.kategori,
      tersediaDiPerlap: formData.tersediaDiPerlap || 'Belum Ada',
      jikaMembeli: formData.jikaMembeli.trim() || '-',
      jikaMenyewa: formData.jikaMenyewa.trim() || '-',
      jikaMeminjam: formData.jikaMeminjam.trim() || '-',
      catatanOpsional: formData.catatanOpsional.trim() || '-',
      tanggalPermintaan: formData.tanggalPermintaan || '2026-10-26',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-crud-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1936]/70 p-4 overflow-y-auto"
    >
      <Card
        variant="white"
        shadow="lg"
        className="w-full max-w-2xl overflow-hidden my-8"
      >
        <div className="px-5 py-4 bg-[#132956] text-white border-b-2 border-[#0A1936] flex items-center justify-between">
          <h3
            id="modal-crud-title"
            className="text-sm sm:text-base font-black"
          >
            {isNew
              ? 'Tambah Data Barang Baru (Admin CRUD)'
              : 'Edit Data Barang & Ketersediaan Perlap (Admin CRUD)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white text-[#0A1936] border-2 border-[#0A1936] shadow-[2px_2px_0px_#38BDF8] hover:bg-[#FDA4AF] transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FDA4AF] border-2 border-[#0A1936] text-xs font-extrabold text-[#0A1936]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="modal-divisi"
              label="Divisi"
              required
              value={formData.divisi}
              options={DIVISIONS}
              onChange={(e) => handleChange('divisi', e.target.value)}
            />
            <Input
              id="modal-tanggal"
              label="Tanggal Permintaan"
              type="date"
              required
              value={formData.tanggalPermintaan}
              onChange={(e) => handleChange('tanggalPermintaan', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <Input
                id="modal-namaBarang"
                label="Nama Barang / Alat"
                required
                value={formData.namaBarang}
                onChange={(e) => handleChange('namaBarang', e.target.value)}
                placeholder="Nama barang..."
              />
            </div>
            <div className="sm:col-span-4">
              <Input
                id="modal-jumlahBarang"
                label="Jumlah Unit"
                type="number"
                min="1"
                required
                value={formData.jumlahBarang}
                onChange={(e) => handleChange('jumlahBarang', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-[#DBEAFE] border-2 border-[#0A1936]">
            <Select
              id="modal-kategori"
              label="Kategori Pengadaan"
              required
              value={formData.kategori}
              options={CATEGORIES}
              onChange={(e) => handleChange('kategori', e.target.value)}
            />
            <Select
              id="modal-tersediaDiPerlap"
              label="Sudah Tersedia di Divisi Perlap?"
              required
              value={formData.tersediaDiPerlap}
              options={PERLAP_STATUS_OPTIONS}
              onChange={(e) =>
                handleChange('tersediaDiPerlap', e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="modal-jikaMembeli"
              label="Jika Membeli"
              value={formData.jikaMembeli}
              onChange={(e) => handleChange('jikaMembeli', e.target.value)}
              placeholder="Rentang harga..."
            />
            <Input
              id="modal-jikaMenyewa"
              label="Jika Menyewa"
              value={formData.jikaMenyewa}
              onChange={(e) => handleChange('jikaMenyewa', e.target.value)}
              placeholder="Tempat sewa..."
            />
            <Input
              id="modal-jikaMeminjam"
              label="Jika Meminjam"
              value={formData.jikaMeminjam}
              onChange={(e) => handleChange('jikaMeminjam', e.target.value)}
              placeholder="Nama peminjam..."
            />
          </div>

          <Input
            id="modal-catatanOpsional"
            label="Catatan Opsional"
            value={formData.catatanOpsional}
            onChange={(e) => handleChange('catatanOpsional', e.target.value)}
            placeholder="Keterangan tambahan..."
          />

          <div className="pt-3 border-t-2 border-[#0A1936] flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="blue">
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
