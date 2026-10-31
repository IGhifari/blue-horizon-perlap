import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Camera, Upload, Trash2 } from 'lucide-react';
import {
  DIVISIONS,
  CATEGORIES,
  getTodayDateString,
} from '../../data/initialData';
import {
  isMainAdmin,
  canManagePhotos,
  getAllowedDivisions,
} from '../../features/auth/permissions';
import {
  MAX_PHOTOS_PER_ITEM,
  normalizePhotoList,
  uploadPhotoFile,
  removePhotoFromStorage,
} from '../../utils/photoUtils';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function EditItemModal({
  item,
  profile,
  supabaseClient,
  onClose,
  onSave,
}) {
  const isNew = !item?.id;
  const canChooseDivision = isMainAdmin(profile);
  const canUploadPhotos = canManagePhotos(profile);
  const allowedDivisions = getAllowedDivisions(profile, DIVISIONS);

  const [formData, setFormData] = useState({
    divisi: profile?.divisi || 'Perlengkapan',
    namaBarang: '',
    jumlahBarang: 1,
    kategori: 'Pinjam',
    jikaMembeli: '',
    jikaMenyewa: '',
    jikaMeminjam: '',
    catatanOpsional: '',
    tanggalPermintaan: getTodayDateString(),
    fotoBukti: [],
  });
  const [error, setError] = useState('');
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      const lockedDivisi = canChooseDivision
        ? item.divisi || 'Perlengkapan'
        : profile?.divisi || item.divisi;

      setFormData({
        divisi: lockedDivisi,
        namaBarang: item.namaBarang || '',
        jumlahBarang: item.jumlahBarang || 1,
        kategori: item.kategori || 'Pinjam',
        jikaMembeli: item.jikaMembeli === '-' ? '' : item.jikaMembeli || '',
        jikaMenyewa: item.jikaMenyewa === '-' ? '' : item.jikaMenyewa || '',
        jikaMeminjam: item.jikaMeminjam === '-' ? '' : item.jikaMeminjam || '',
        catatanOpsional:
          item.catatanOpsional === '-' ? '' : item.catatanOpsional || '',
        tanggalPermintaan: item.tanggalPermintaan || getTodayDateString(),
        fotoBukti: normalizePhotoList(item.fotoBukti),
      });
    }
  }, [item, canChooseDivision, profile?.divisi]);

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

  const handleSelectPhotoFiles = async (fileList) => {
    if (!canUploadPhotos || !fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (formData.fotoBukti.length + files.length > MAX_PHOTOS_PER_ITEM) {
      setError(`Maksimal ${MAX_PHOTOS_PER_ITEM} foto bukti per barang.`);
      return;
    }

    setIsUploadingPhotos(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const photoItem = await uploadPhotoFile(file, {
          itemId: item.id || 'draft',
          divisi: formData.divisi,
          profile,
          supabaseClient,
        });
        uploaded.push(photoItem);
      }
      setFormData((prev) => ({
        ...prev,
        fotoBukti: [...prev.fotoBukti, ...uploaded],
      }));
    } catch (err) {
      setError(err?.message || 'Gagal mengunggah foto bukti.');
    } finally {
      setIsUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCaptionChange = (photoId, caption) => {
    if (!canUploadPhotos) return;
    setFormData((prev) => ({
      ...prev,
      fotoBukti: prev.fotoBukti.map((p) =>
        p.id === photoId ? { ...p, caption } : p
      ),
    }));
  };

  const handleRemovePhoto = async (photo) => {
    if (!canUploadPhotos) return;
    try {
      await removePhotoFromStorage(photo, {
        profile,
        supabaseClient,
      });
    } catch {
      // Abaikan jika gagal hapus di storage
    }
    setFormData((prev) => ({
      ...prev,
      fotoBukti: prev.fotoBukti.filter((p) => p.id !== photo.id),
    }));
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

    const finalDivisi = canChooseDivision
      ? formData.divisi
      : profile?.divisi || formData.divisi;

    onSave({
      ...(item.id ? { id: item.id } : {}),
      divisi: finalDivisi,
      namaBarang: formData.namaBarang.trim(),
      jumlahBarang: Math.max(1, Number(formData.jumlahBarang) || 1),
      kategori: formData.kategori,
      jikaMembeli: formData.jikaMembeli.trim() || '-',
      jikaMenyewa: formData.jikaMenyewa.trim() || '-',
      jikaMeminjam: formData.jikaMeminjam.trim() || '-',
      catatanOpsional: formData.catatanOpsional.trim() || '-',
      tanggalPermintaan: formData.tanggalPermintaan || getTodayDateString(),
      fotoBukti: canUploadPhotos
        ? normalizePhotoList(formData.fotoBukti)
        : normalizePhotoList(item.fotoBukti),
    });
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-crud-title"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !mt-0 z-[100] flex items-center justify-center bg-[#0A1936]/80 p-3 sm:p-5 overflow-y-auto"
    >
      <Card
        variant="white"
        shadow="lg"
        className="w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        <div className="px-5 py-4 bg-[#132956] text-white border-b-2 border-[#0A1936] flex items-center justify-between shrink-0">
          <h3
            id="modal-crud-title"
            className="text-sm sm:text-base font-black"
          >
            {isNew
              ? 'Tambah Data Barang Baru'
              : 'Edit Data Barang'}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-[#FDA4AF] border-2 border-[#0A1936] text-xs font-extrabold text-[#0A1936]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="modal-divisi"
              label={
                canChooseDivision ? 'Divisi' : 'Divisi (Terkunci Sesuai Role)'
              }
              required
              disabled={!canChooseDivision}
              value={formData.divisi}
              options={allowedDivisions.length ? allowedDivisions : DIVISIONS}
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

          <div className="p-3.5 rounded-xl bg-[#DBEAFE] border-2 border-[#0A1936]">
            <Select
              id="modal-kategori"
              label="Kategori Pengadaan"
              required
              value={formData.kategori}
              options={CATEGORIES}
              onChange={(e) => handleChange('kategori', e.target.value)}
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

          {/* Bagian Upload Foto Bukti Transaksi (Khusus Admin Utama / Divisi Perlengkapan) */}
          {canUploadPhotos && (
            <div className="p-4 rounded-xl bg-[#F4F8FF] border-2 border-[#0A1936] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#0A1936] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#132956]" />
                    <span>
                      Bukti Transaksi &amp; Dokumentasi Pengeluaran (Struk / Nota)
                    </span>
                  </label>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    Unggah satu atau beberapa foto struk pembelian maupun
                    dokumentasi pengeluaran (maks. {MAX_PHOTOS_PER_ITEM} foto).
                  </p>
                </div>

                <Badge variant="dark">
                  {formData.fotoBukti.length}/{MAX_PHOTOS_PER_ITEM} Foto
                </Badge>
              </div>

              <input
                ref={fileInputRef}
                id="modal-fotoBukti"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleSelectPhotoFiles(e.target.files)}
              />

              {formData.fotoBukti.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.fotoBukti.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="p-2.5 rounded-xl bg-white border-2 border-[#0A1936] shadow-[2px_2px_0px_#0A1936] flex items-start gap-2.5"
                    >
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#0A1936] bg-[#0A1936] shrink-0 block"
                        title="Klik untuk membuka ukuran penuh"
                      >
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </a>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-[#132956] truncate">
                            #{idx + 1} • {photo.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo)}
                            className="p-1 rounded-md bg-[#FDA4AF] hover:bg-[#FB7185] text-[#0A1936] border border-[#0A1936] cursor-pointer shrink-0"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={photo.caption || ''}
                          onChange={(e) =>
                            handleCaptionChange(photo.id, e.target.value)
                          }
                          placeholder="Keterangan struk/pengeluaran..."
                          className="w-full px-2.5 py-1 text-xs font-bold bg-[#F4F8FF] text-[#0A1936] rounded-lg border border-[#0A1936] focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.fotoBukti.length < MAX_PHOTOS_PER_ITEM && (
                <div>
                  <Button
                    type="button"
                    variant="dashed"
                    size="sm"
                    disabled={isUploadingPhotos}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isUploadingPhotos
                        ? 'Mengunggah & Memproses Foto...'
                        : '+ Pilih / Tambah Foto Struk Pembelian (Multi-Foto)'}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t-2 border-[#0A1936] flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="blue" disabled={isUploadingPhotos}>
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
