import { Package, Layers, Handshake, ShoppingBag } from 'lucide-react';
import Card from '../ui/Card';

export default function SummaryCards({ filteredItems, activeDivisiTab }) {
  const totalJenis = filteredItems.length;
  const totalUnits = filteredItems.reduce(
    (acc, cur) => acc + (Number(cur.jumlahBarang) || 0),
    0
  );
  const pinjamSewaCount = filteredItems.filter(
    (i) => i.kategori === 'Pinjam' || i.kategori === 'Sewa'
  ).length;
  const beliCount = filteredItems.filter(
    (i) => i.kategori === 'Beli'
  ).length;

  const activeScopeLabel =
    activeDivisiTab === 'ALL'
      ? 'Semua Divisi'
      : `Sheet: Rekap - ${activeDivisiTab}`;

  const cards = [
    {
      title: 'Total Jenis Barang',
      value: String(totalJenis),
      subtitle: activeScopeLabel,
      variant: 'yellow',
      icon: Package,
    },
    {
      title: 'Total Jumlah Unit',
      value: String(totalUnits),
      subtitle: 'Akumulasi unit dibutuhkan',
      variant: 'blue',
      icon: Layers,
    },
    {
      title: 'Pinjam & Sewa',
      value: `${pinjamSewaCount} Item`,
      subtitle: 'Perlu koordinasi vendor/peminjam',
      variant: 'pink',
      icon: Handshake,
    },
    {
      title: 'Kebutuhan Beli',
      value: `${beliCount} Item`,
      subtitle: 'Pengadaan barang baru',
      variant: 'mint',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.title}
            variant={c.variant}
            className="p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#0A1936]">
                {c.title}
              </p>
              <div className="p-1.5 rounded-lg bg-white border-2 border-[#0A1936] shadow-[2px_2px_0px_#0A1936]">
                <Icon className="w-4 h-4 text-[#132956]" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#0A1936] mt-2">
              {c.value}
            </p>
            <p className="text-xs font-bold text-slate-700 mt-1">
              {c.subtitle}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
