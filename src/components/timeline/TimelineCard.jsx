import { TIMELINE_STATUSES } from '../../data/initialData';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function TimelineCard({
  item,
  index,
  onChangeStatus,
  onChangeProgress,
}) {
  const progressColor =
    item.status === 'Selesai'
      ? 'bg-[#5EEAD4]'
      : item.status === 'Sedang Berjalan'
      ? 'bg-[#38BDF8]'
      : 'bg-[#93C5FD]';

  return (
    <Card
      variant="white"
      className="p-4 sm:p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="dark" className="text-xs px-3 py-1">
            Tahap {index + 1} • {item.rentang}
          </Badge>
          <Badge variant={item.status}>{item.status}</Badge>
        </div>

        <p className="text-sm sm:text-base font-black text-[#0A1936] pt-1 leading-snug">
          {item.target}
        </p>

        <div className="inline-block px-3 py-1.5 rounded-lg bg-[#DBEAFE] border-2 border-[#0A1936] text-xs font-bold text-[#0A1936]">
          Output: <strong className="font-black">{item.output}</strong>
        </div>
      </div>

      <div className="pt-3 border-t-2 border-[#0A1936] space-y-2.5">
        {/* Progress Bar Visual */}
        <div className="w-full h-3 bg-[#EAF2FF] rounded-md border-2 border-[#0A1936] overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-200`}
            style={{ width: `${item.progres}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor={`tl-status-${item.id}`}
            className="font-extrabold text-[#0A1936]"
          >
            Ubah Status &amp; Progres:
          </label>
          <span className="font-black text-sm px-2 py-0.5 rounded bg-[#132956] border border-[#0A1936] text-white">
            {item.progres}%
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            id={`tl-status-${item.id}`}
            value={item.status}
            onChange={(e) => onChangeStatus(item.id, e.target.value)}
            className="rounded-xl border-2 border-[#0A1936] bg-white px-3 py-2 text-xs font-extrabold text-[#0A1936] shadow-[2px_2px_0px_#0A1936] cursor-pointer focus:outline-none focus:bg-[#F4F8FF]"
          >
            {TIMELINE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <input
            type="range"
            min="0"
            max="100"
            step="10"
            aria-label={`Progres Tahap ${index + 1}`}
            value={item.progres}
            onChange={(e) => onChangeProgress(item.id, Number(e.target.value))}
            className="neo-range flex-1 w-full cursor-pointer"
          />
        </div>
      </div>
    </Card>
  );
}
