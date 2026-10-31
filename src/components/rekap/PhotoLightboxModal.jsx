import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  Camera,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import {
  MAX_PHOTOS_PER_ITEM,
  uploadPhotoFile,
  removePhotoFromStorage,
  formatPhotoDate,
  normalizePhotoList,
} from '../../utils/photoUtils';
import { canManagePhotos } from '../../features/auth/permissions';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';

export default function PhotoLightboxModal({
  item,
  profile,
  supabaseClient,
  initialIndex = 0,
  onClose,
  onUpdatePhotos,
  onNotify,
}) {
  const canManage = canManagePhotos(profile);
  const photos = normalizePhotoList(item?.fotoBukti);

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, photos.length - 1))
  );
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [defaultCaption, setDefaultCaption] = useState('');
  const [editingCaption, setEditingCaption] = useState('');
  const fileInputRef = useRef(null);

  const safeIndex =
    photos.length > 0 ? Math.min(activeIndex, photos.length - 1) : 0;
  const currentPhoto = photos[safeIndex] || null;

  useEffect(() => {
    setEditingCaption(currentPhoto?.caption || '');
    setZoom(1);
  }, [currentPhoto?.id, currentPhoto?.caption]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (
        e.key === 'ArrowRight' &&
        photos.length > 1 &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        setActiveIndex((prev) => (prev + 1) % photos.length);
      } else if (
        e.key === 'ArrowLeft' &&
        photos.length > 1 &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, photos.length]);

  if (!item) return null;

  const handleFilesSelected = async (fileList) => {
    if (!canManage || !fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (photos.length + files.length > MAX_PHOTOS_PER_ITEM) {
      onNotify?.(
        `Maksimal ${MAX_PHOTOS_PER_ITEM} foto bukti per barang.`,
        'error'
      );
      return;
    }

    setIsUploading(true);
    try {
      const uploadedItems = [];
      for (const file of files) {
        const uploaded = await uploadPhotoFile(file, {
          itemId: item.id,
          divisi: item.divisi,
          profile,
          supabaseClient,
          caption: defaultCaption.trim(),
        });
        uploadedItems.push(uploaded);
      }

      const nextPhotos = [...photos, ...uploadedItems];
      await onUpdatePhotos?.(item.id, nextPhotos);
      setActiveIndex(nextPhotos.length - uploadedItems.length);
      setDefaultCaption('');
    } catch (err) {
      onNotify?.(err?.message || 'Gagal mengunggah foto bukti.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCurrentPhoto = async () => {
    if (!canManage || !currentPhoto) return;

    try {
      await removePhotoFromStorage(currentPhoto, {
        profile,
        supabaseClient,
      });
      const nextPhotos = photos.filter((p) => p.id !== currentPhoto.id);
      await onUpdatePhotos?.(item.id, nextPhotos);
      setActiveIndex((prev) => Math.max(0, Math.min(prev, nextPhotos.length - 1)));
    } catch (err) {
      onNotify?.(err?.message || 'Gagal menghapus foto bukti.', 'error');
    }
  };

  const handleSaveCaption = async () => {
    if (!canManage || !currentPhoto) return;
    const trimmed = editingCaption.trim();
    if (trimmed === (currentPhoto.caption || '')) return;

    const nextPhotos = photos.map((p) =>
      p.id === currentPhoto.id ? { ...p, caption: trimmed } : p
    );
    await onUpdatePhotos?.(item.id, nextPhotos);
  };

  const handleDownloadPhoto = async (photo) => {
    if (!photo?.url) return;
    const fileName =
      photo.name ||
      `bukti-${String(item.namaBarang || 'barang')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.jpg`;

    try {
      if (photo.url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const response = await fetch(photo.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(photo.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (canManage) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canManage) return;
    if (e.dataTransfer?.files?.length) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-lightbox-title"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !mt-0 z-[100] flex items-center justify-center bg-[#0A1936]/80 p-3 sm:p-5 overflow-y-auto"
    >
      <Card
        variant="white"
        shadow="lg"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header Modal */}
        <div className="px-4 sm:px-6 py-4 bg-[#132956] text-white border-b-2 border-[#0A1936] flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="mint" className="text-[11px]">
                {item.divisi}
              </Badge>
              <Badge variant={item.kategori} className="text-[11px]">
                {item.kategori}
              </Badge>
              <span className="text-xs font-bold text-[#BAE6FD]">
                {item.jumlahBarang} Unit • {item.tanggalPermintaan}
              </span>
            </div>
            <h3
              id="photo-lightbox-title"
              className="text-sm sm:text-lg font-black text-white mt-1 flex items-center gap-2"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8] shrink-0" />
              <span>
                Bukti Transaksi &amp; Dokumentasi — {item.namaBarang}
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white text-[#0A1936] border-2 border-[#0A1936] shadow-[2px_2px_0px_#38BDF8] hover:bg-[#FDA4AF] transition cursor-pointer shrink-0"
            aria-label="Tutup pratinjau foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Input File (Multiple) */}
        {canManage && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        )}

        <div className="p-4 sm:p-6 space-y-5 bg-[#F4F8FF] overflow-y-auto flex-1">
          {photos.length > 0 && currentPhoto ? (
            <>
              {/* Toolbar Atas Pratinjau */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border-2 border-[#0A1936] shadow-[3px_3px_0px_#0A1936]">
                <div className="flex items-center gap-2">
                  <Badge variant="dark">
                    Foto {safeIndex + 1} dari {photos.length}
                  </Badge>
                  <span className="text-xs font-extrabold text-[#0A1936] truncate max-w-[200px] sm:max-w-xs">
                    {currentPhoto.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 rounded-lg bg-[#DBEAFE] hover:bg-[#BAE6FD] text-[#0A1936] border-2 border-[#0A1936] text-xs font-extrabold cursor-pointer"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-[#DBEAFE] text-[#0A1936] border-2 border-[#0A1936] text-xs font-black cursor-pointer"
                    title="Reset Zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                    className="p-1.5 rounded-lg bg-[#DBEAFE] hover:bg-[#BAE6FD] text-[#0A1936] border-2 border-[#0A1936] text-xs font-extrabold cursor-pointer"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <Button
                    type="button"
                    variant="mint"
                    size="sm"
                    onClick={() => handleDownloadPhoto(currentPhoto)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </Button>

                  {canManage && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteCurrentPhoto}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Kanvas Gambar Utama */}
              <div className="relative rounded-xl border-2 border-[#0A1936] bg-[#0A1936] shadow-[4px_4px_0px_#0A1936] overflow-hidden flex items-center justify-center min-h-[280px] sm:min-h-[380px] max-h-[60vh]">
                <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
                  <img
                    src={currentPhoto.url}
                    alt={
                      currentPhoto.caption ||
                      `${item.namaBarang} - Bukti ${safeIndex + 1}`
                    }
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center',
                    }}
                    className="max-h-[52vh] max-w-full object-contain rounded-lg transition-transform duration-150 select-none"
                  />
                </div>

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex(
                          (prev) => (prev - 1 + photos.length) % photos.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white hover:bg-[#38BDF8] text-[#0A1936] border-2 border-[#0A1936] shadow-[3px_3px_0px_#0A1936] cursor-pointer"
                      aria-label="Foto sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => (prev + 1) % photos.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white hover:bg-[#38BDF8] text-[#0A1936] border-2 border-[#0A1936] shadow-[3px_3px_0px_#0A1936] cursor-pointer"
                      aria-label="Foto berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Informasi & Keterangan Foto */}
              <div className="bg-white p-3.5 rounded-xl border-2 border-[#0A1936] shadow-[3px_3px_0px_#0A1936] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600">
                  <span>
                    Diunggah oleh:{' '}
                    <strong className="text-[#0A1936]">
                      @{currentPhoto.uploadedBy || 'admin_perlap'}
                    </strong>
                  </span>
                  {currentPhoto.uploadedAt && (
                    <span>Waktu: {formatPhotoDate(currentPhoto.uploadedAt)}</span>
                  )}
                </div>

                {canManage ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                    <div className="flex-1">
                      <Input
                        id="lightbox-photo-caption"
                        label="Keterangan Struk / Pengeluaran (Opsional)"
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        placeholder="Contoh: Struk pembelian Tokopedia Rp 150.000 / Nota pelunasan..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleSaveCaption}
                      disabled={editingCaption.trim() === (currentPhoto.caption || '')}
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Keterangan</span>
                    </Button>
                  </div>
                ) : (
                  currentPhoto.caption && (
                    <div className="p-2.5 rounded-lg bg-[#DBEAFE] border-2 border-[#0A1936] text-xs font-bold text-[#0A1936]">
                      Keterangan: {currentPhoto.caption}
                    </div>
                  )
                )}
              </div>

              {/* Galeri Thumbnail & Tombol Tambah Foto */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, idx) => {
                    const isSelected = idx === safeIndex;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'border-[#0A1936] ring-2 ring-[#38BDF8] shadow-[3px_3px_0px_#0A1936] -translate-y-0.5'
                            : 'border-[#0A1936]/60 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-[#0A1936]/80 text-white text-[10px] font-black">
                          #{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {canManage && photos.length < MAX_PHOTOS_PER_ITEM && (
                  <Button
                    type="button"
                    variant="dashed"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isUploading
                        ? 'Mengunggah...'
                        : `+ Tambah Foto Bukti (${photos.length}/${MAX_PHOTOS_PER_ITEM})`}
                    </span>
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* Tampilan jika belum ada foto */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 sm:p-8 rounded-xl border-2 border-dashed transition-colors text-center space-y-4 ${
                isDragging
                  ? 'bg-[#BAE6FD] border-[#0A1936]'
                  : 'bg-white border-[#132956]'
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DBEAFE] border-2 border-[#0A1936] shadow-[3px_3px_0px_#0A1936] flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-[#132956]" />
              </div>

              {canManage ? (
                <>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-black text-[#0A1936]">
                      Belum Ada Foto Struk / Bukti Transaksi
                    </h4>
                    <p className="text-xs font-semibold text-slate-600">
                      Unggah foto struk pembelian, nota sewa, atau dokumentasi
                      pengeluaran untuk <strong>{item.namaBarang}</strong>. Anda
                      dapat memilih beberapa foto sekaligus.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto text-left">
                    <Input
                      id="upload-initial-caption"
                      label="Keterangan Struk / Pengeluaran (Opsional)"
                      value={defaultCaption}
                      onChange={(e) => setDefaultCaption(e.target.value)}
                      placeholder="Contoh: Nota pembelian toko fisik / Struk transfer..."
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {isUploading
                          ? 'Mengunggah Foto...'
                          : 'Pilih Foto Struk / Bukti (Bisa Multi-Foto)'}
                      </span>
                    </Button>
                    <p className="text-[11px] font-bold text-slate-500 mt-2">
                      Format: JPG, PNG, WEBP, GIF • Maks. 10 MB per file (Otomatis
                      dikompresi)
                    </p>
                  </div>
                </>
              ) : (
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-base font-black text-[#0A1936]">
                    Belum Ada Foto Bukti Transaksi
                  </h4>
                  <p className="text-xs font-semibold text-slate-600">
                    Admin Utama (Divisi Perlengkapan) belum mengunggah foto struk
                    atau dokumentasi pengeluaran untuk barang ini.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#DBEAFE] border-t-2 border-[#0A1936] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-bold text-[#132956]">
            {canManage
              ? 'Mode Admin Utama (Perlengkapan): Anda dapat menambah & mengelola foto bukti transaksi.'
              : 'Mode Pratinjau: Hanya Admin Utama (Perlengkapan) yang dapat mengelola foto bukti.'}
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </Card>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
