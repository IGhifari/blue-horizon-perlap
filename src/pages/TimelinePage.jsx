import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import TimelineCard from '../components/timeline/TimelineCard';

export default function TimelinePage({
  timeline,
  onChangeStatus,
  onChangeProgress,
}) {
  const avgProgress = useMemo(() => {
    if (!timeline.length) return 0;
    const sum = timeline.reduce(
      (acc, cur) => acc + Number(cur.progres || 0),
      0
    );
    return Math.round(sum / timeline.length);
  }, [timeline]);

  return (
    <section className="space-y-6">
      {/* Header Timeline & Rata-rata Progres (Blue Horizon Navy Banner) */}
      <Card
        variant="navy"
        shadow="lg"
        className="bh-wave-header p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">
            Timeline &amp; Target Kerja Divisi Perlengkapan (21 Okt – 15 Nov)
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#BAE6FD] mt-1">
            Klik status atau geser progres pada setiap tahapan kerja untuk memperbarui capaian tim Perlengkapan.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border-2 border-[#0A1936] shadow-[4px_4px_0px_#38BDF8] px-4 py-3 rounded-xl self-start sm:self-auto shrink-0">
          <div className="p-2 rounded-lg bg-[#38BDF8] border-2 border-[#0A1936]">
            <TrendingUp className="w-5 h-5 text-[#0A1936]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
              Rata-rata Progres
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#0A1936]">
              {avgProgress}%
            </p>
          </div>
        </div>
      </Card>

      {/* Daftar Tahapan Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {timeline.map((item, idx) => (
          <TimelineCard
            key={item.id}
            item={item}
            index={idx}
            onChangeStatus={onChangeStatus}
            onChangeProgress={onChangeProgress}
          />
        ))}
      </div>
    </section>
  );
}
