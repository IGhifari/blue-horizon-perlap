import { Trash2 } from 'lucide-react';
import { CATEGORIES, formatRupiah } from '../../data/initialData';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function ItemFormCard({
  row,
  index,
  canRemove,
  error = {},
  onChangeField,
  onRemove,
}) {
  const { draftId } = row;

  return (
    <Card variant="cream" className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#0A1936] pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="dark" className="text-xs sm:text-sm px-3 py-1">
            Barang {index + 1}
          </Badge>
          <span className="text-xs font-bold text-[#132956]">
            Isi rincian kebutuhan untuk Barang {index + 1}
          </span>
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onRemove(draftId)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Barang {index + 1}</span>
          </Button>
        )}
      </div>

      {/* Baris 1: Nama Barang, Jumlah, Harga Satuan, Total */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-5">
          <Input
            id={`namaBarang-${draftId}`}
            label="Nama Barang / Alat"
            required
            value={row.namaBarang}
            error={error.namaBarang}
            onChange={(e) => onChangeField(draftId, 'namaBarang', e.target.value)}
            placeholder="Contoh: Microphone Wireless, Kabel Roll, HT..."
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            id={`jumlahBarang-${draftId}`}
            label="Jumlah"
            type="number"
            min="1"
            required
            value={row.jumlahBarang}
            error={error.jumlahBarang}
            onChange={(e) => onChangeField(draftId, 'jumlahBarang', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            id={`hargaSatuan-${draftId}`}
            label="Harga Satuan (Rp)"
            type="number"
            min="0"
            value={row.hargaSatuan === '' ? '' : (row.hargaSatuan ?? 0)}
            onChange={(e) => onChangeField(draftId, 'hargaSatuan', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="sm:col-span-3">
          <Input
            id={`totalHarga-${draftId}`}
            label="Total (Rp)"
            value={formatRupiah(
              row.totalHarga ??
                (Number(row.jumlahBarang) || 0) * (Number(row.hargaSatuan) || 0)
            )}
            readOnly
            disabled
            className="bg-[#EDF2F7] cursor-not-allowed font-black text-[#0A1936]"
          />
        </div>
      </div>

      {/* Baris 2: Kategori, Informasi Pembelian, Penyewaan, Peminjaman */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-3">
          <Select
            id={`kategori-${draftId}`}
            label="Kategori Pengadaan"
            required
            value={row.kategori}
            options={CATEGORIES}
            onChange={(e) => onChangeField(draftId, 'kategori', e.target.value)}
          />
        </div>

        <div className="sm:col-span-3">
          <Input
            id={`jikaMembeli-${draftId}`}
            label="Jika Membeli (Tempat Beli)"
            value={row.jikaMembeli}
            onChange={(e) => onChangeField(draftId, 'jikaMembeli', e.target.value)}
            placeholder="Contoh: Toko ATK / Tokopedia"
          />
        </div>

        <div className="sm:col-span-3">
          <Input
            id={`jikaMenyewa-${draftId}`}
            label="Jika Menyewa (Tempat Sewa)"
            value={row.jikaMenyewa}
            onChange={(e) => onChangeField(draftId, 'jikaMenyewa', e.target.value)}
            placeholder="Contoh: Rental Sound Bogor"
          />
        </div>

        <div className="sm:col-span-3">
          <Input
            id={`jikaMeminjam-${draftId}`}
            label="Jika Meminjam (Pihak Peminjam)"
            value={row.jikaMeminjam}
            onChange={(e) => onChangeField(draftId, 'jikaMeminjam', e.target.value)}
            placeholder="Contoh: Budi (Logistik Kampus)"
          />
        </div>
      </div>

      {/* Baris 3: Catatan Opsional */}
      <div>
        <Input
          id={`catatanOpsional-${draftId}`}
          label="Catatan Opsional (Keterangan Ketersediaan dari Divisi)"
          value={row.catatanOpsional}
          onChange={(e) => onChangeField(draftId, 'catatanOpsional', e.target.value)}
          placeholder="Jika barang sudah tersedia dari divisi masing-masing, beri keterangan di sini..."
        />
      </div>
    </Card>
  );
}
