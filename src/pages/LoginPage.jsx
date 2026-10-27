import LoginForm from '../components/auth/LoginForm';

export default function LoginPage({ onLogin, authError }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#EAF2FF] text-[#0A1936]">
      {/* Top Banner */}
      <header className="bh-wave-header text-white border-b-[3px] border-[#0A1936] shadow-[0_4px_0_#0A1936]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#132956] border-2 border-white shadow-[3px_3px_0px_#0A1936] overflow-hidden shrink-0">
            <img
              src="/logo-blue-horizon.jpg"
              alt="Logo Blue Horizon"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded-md bg-[#38BDF8] text-[#0A1936] border-2 border-[#0A1936] text-[10px] font-black uppercase tracking-wider">
              Blue Horizon
            </span>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Portal Logistik &amp; Peminjaman Barang Acara
            </h1>
          </div>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <LoginForm onLogin={onLogin} externalError={authError} />
      </main>

      <footer className="py-4 text-center text-xs font-bold text-slate-600 border-t-2 border-[#0A1936] bg-white">
        Sistem Terpadu Divisi Perlengkapan • Blue Horizon
      </footer>
    </div>
  );
}
