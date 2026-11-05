import { Trash2, Pencil, Camera, Eye } from 'lucide-react';
import { formatRupiah } from '../../data/initialData';
import { normalizePhotoList } from '../../utils/photoUtils';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ItemsTable({
  items,
  isAdmin,
  canManagePhotos = false,
  onEditItem,
  onDeleteItem,
  onOpenPhotos,
}) {
  const totalCols = isAdmin ? 13 : 12;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1240px]">
        <thead>
          <tr className="bg-[#132956] text-white text-[11px] uppercase tracking-wider border-b-2 border-[#0A1936]">
            <th className="py-3.5 px-3.5 font-extrabold">Divisi</th>
            <th className="py-3.5 px-3.5 font-extrabold">Nama Barang</th>
            <th className="py-3.5 px-3.5 font-extrabold text-right">
              Jumlah Barang
            </th>
            <th className="py-3.5 px-3.5 font-extrabold text-right">
              Harga Satuan
            </th>
            <th className="py-3.5 px-3.5 font-extrabold text-right">
              Total
            </th>
            <th className="py-3.5 px-3.5 font-extrabold text-center">
              Kategori
            </th>
            <th className="py-3.5 px-3.5 font-extrabold">Jika Membeli</th>
            <th className="py-3.5 px-3.5 font-extrabold">Jika Menyewa</th>
            <th className="py-3.5 px-3.5 font-extrabold">Jika Meminjam</th>
            <th className="py-3.5 px-3.5 font-extrabold">Catatan Opsional</th>
            <th className="py-3.5 px-3.5 font-extrabold text-center">
              Bukti Foto / Struk
            </th>
            <th className="py-3.5 px-3.5 font-extrabold text-center">
              Tanggal Permintaan
            </th>
            {isAdmin && (
              <th className="py-3.5 px-3.5 font-extrabold text-center">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-[#0A1936] text-xs sm:text-sm bg-white">
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="py-12 px-4 text-center text-[#0A1936] font-bold bg-[#F4F8FF]"
              >
                Belum ada data barang pada filter ini. Klik tab{' '}
                <strong className="underline">+ Form Pengajuan</strong> untuk
                menambah barang.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const photos = normalizePhotoList(item.fotoBukti);
              const firstPhoto = photos[0] || null;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[#EAF2FF] transition-colors"
                >
                  <td className="py-3 px-3.5 font-black text-[#132956] whitespace-nowrap">
                    {item.divisi}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0A1936]">
                    {item.namaBarang}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-[#0A1936]">
                    {item.jumlahBarang}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-[#0A1936] whitespace-nowrap">
                    {formatRupiah(item.hargaSatuan || 0)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-[#132956] whitespace-nowrap">
                    {formatRupiah(
                      item.totalHarga !== undefined && item.totalHarga !== null
                        ? item.totalHarga
                        : (Number(item.jumlahBarang) || 0) * (Number(item.hargaSatuan) || 0)
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <Badge variant={item.kategori}>{item.kategori}</Badge>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-700">
                    {item.jikaMembeli}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-700">
                    {item.jikaMenyewa}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-700">
                    {item.jikaMeminjam}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-700">
                    {item.catatanOpsional}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {photos.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenPhotos?.(item, 0)}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#DBEAFE] hover:bg-[#BAE6FD] text-[#0A1936] border-2 border-[#0A1936] shadow-[2px_2px_0px_#0A1936] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                        title="Lihat & kelola foto bukti transaksi"
                      >
                        {firstPhoto && (
                          <img
                            src={firstPhoto.url}
                            alt={firstPhoto.name}
                            className="w-7 h-7 rounded-md object-cover border border-[#0A1936] bg-white shrink-0"
                          />
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold">
                          <Eye className="w-3.5 h-3.5 text-[#132956]" />
                          <span>{photos.length} Foto</span>
                        </span>
                      </button>
                    ) : canManagePhotos ? (
                      <Button
                        type="button"
                        variant="mint"
                        size="sm"
                        onClick={() => onOpenPhotos?.(item, 0)}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>+ Upload Bukti</span>
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Belum ada
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-center font-bold text-slate-600 whitespace-nowrap">
                    {item.tanggalPermintaan}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => onEditItem(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
