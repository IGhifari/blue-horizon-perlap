import { Trash2, Pencil } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ItemsTable({
  items,
  isAdmin,
  onEditItem,
  onDeleteItem,
}) {
  const totalCols = isAdmin ? 10 : 9;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[960px]">
        <thead>
          <tr className="bg-[#132956] text-white text-[11px] uppercase tracking-wider border-b-2 border-[#0A1936]">
            <th className="py-3.5 px-3.5 font-extrabold">Divisi</th>
            <th className="py-3.5 px-3.5 font-extrabold">Nama Barang</th>
            <th className="py-3.5 px-3.5 font-extrabold text-right">
              Jumlah Barang
            </th>
            <th className="py-3.5 px-3.5 font-extrabold text-center">
              Kategori
            </th>
            <th className="py-3.5 px-3.5 font-extrabold">Jika Membeli</th>
            <th className="py-3.5 px-3.5 font-extrabold">Jika Menyewa</th>
            <th className="py-3.5 px-3.5 font-extrabold">Jika Meminjam</th>
            <th className="py-3.5 px-3.5 font-extrabold">Catatan Opsional</th>
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
