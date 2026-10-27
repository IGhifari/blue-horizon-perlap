import {
  PlusCircle,
  Table2,
  CalendarClock,
  LogOut,
} from 'lucide-react';
import { ROLES } from '../../features/auth/permissions';

export default function Navigation({
  activeView,
  onSelectView,
  totalItemsCount,
  profile,
  onLogout,
}) {
  const role = profile?.role;
  const isMainAdmin = role === ROLES.ADMIN;
  const isAdminDivisi = role === ROLES.ADMIN_DIVISI;

  const navItems = [
    {
      id: 'form',
      label: '+ Form Pengajuan',
      icon: PlusCircle,
      activeBg: 'bg-[#38BDF8]',
      visible: true,
    },
    {
      id: 'rekap',
      label: isMainAdmin
        ? 'Rekap Per Divisi'
        : `Rekap ${profile?.divisi || 'Divisi'}`,
      icon: Table2,
      badge: totalItemsCount,
      activeBg: 'bg-[#7CC4FA]',
      visible: isMainAdmin || isAdminDivisi,
    },
    {
      id: 'timeline',
      label: 'Timeline Kerja',
      icon: CalendarClock,
      activeBg: 'bg-[#5EEAD4]',
      visible: isMainAdmin,
    },
  ].filter((item) => item.visible);

  return (
    <nav
      aria-label="Navigasi Utama"
      className="flex flex-wrap items-center gap-2 self-start lg:self-auto"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView(item.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border-2 border-[#0A1936] transition-all duration-100 inline-flex items-center gap-2 cursor-pointer select-none ${
              isActive
                ? `${item.activeBg} text-[#0A1936] shadow-[4px_4px_0px_#0A1936] -translate-y-[1px]`
                : 'bg-[#1E3E7A] hover:bg-[#274E96] text-white border-white/80 shadow-[3px_3px_0px_#0A1936] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {typeof item.badge === 'number' && (
              <span
                className={`px-2 py-0.5 text-[11px] rounded-md border-2 border-[#0A1936] font-black ${
                  isActive
                    ? 'bg-white text-[#0A1936]'
                    : 'bg-[#38BDF8] text-[#0A1936]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border-2 border-[#0A1936] bg-[#FDA4AF] hover:bg-[#FB7185] text-[#0A1936] shadow-[3px_3px_0px_#0A1936] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100 inline-flex items-center gap-1.5 cursor-pointer select-none"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar</span>
        </button>
      )}
    </nav>
  );
}
