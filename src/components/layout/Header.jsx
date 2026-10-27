import Navigation from './Navigation';
import { ROLE_LABELS, ROLES } from '../../features/auth/permissions';

export default function Header({
  activeView,
  onSelectView,
  totalItemsCount,
  profile,
  onLogout,
}) {
  const roleLabel = ROLE_LABELS[profile?.role] || 'Pengguna';
  const divisiText =
    profile?.role === ROLES.ADMIN
      ? 'Semua Divisi'
      : profile?.divisi || 'Divisi';

  return (
    <header className="bh-wave-header text-white border-b-[3px] border-[#0A1936] sticky top-0 z-30 shadow-[0_4px_0_#0A1936]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl bg-[#132956] border-2 border-white shadow-[4px_4px_0px_#0A1936] overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src="/logo-blue-horizon.jpg"
              alt="Logo Blue Horizon"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#38BDF8] text-[#0A1936] border-2 border-[#0A1936] text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#0A1936]">
                Blue Horizon
              </span>
              {profile && (
                <span className="px-2.5 py-0.5 rounded-md border-2 border-[#0A1936] text-[11px] font-black uppercase shadow-[2px_2px_0px_#0A1936] bg-[#5EEAD4] text-[#0A1936]">
                  @{profile.username} • {roleLabel} ({divisiText})
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white mt-1">
              Portal Logistik &amp; Peminjaman Barang Acara
            </h1>
            
          </div>
        </div>

        <Navigation
          activeView={activeView}
          onSelectView={onSelectView}
          totalItemsCount={totalItemsCount}
          profile={profile}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
