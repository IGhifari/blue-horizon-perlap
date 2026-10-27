import { ShieldAlert, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ProtectedRoute({
  loading,
  isAuthenticated,
  profile,
  allowedRoles = [],
  fallbackLogin,
  onReturnAllowedView,
  children,
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2FF] p-4">
        <Card variant="white" className="p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#132956]" />
          <span className="text-sm font-black text-[#0A1936]">
            Memuat sesi autentikasi &amp; profil divisi...
          </span>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return fallbackLogin || null;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(profile.role)
  ) {
    return (
      <Card variant="pink" className="p-6 max-w-xl mx-auto my-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white border-2 border-[#0A1936]">
            <ShieldAlert className="w-6 h-6 text-[#0A1936]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#0A1936]">
              Akses Halaman Ditolak
            </h2>
            <p className="text-xs font-bold text-slate-800">
              Role akun Anda (<strong>{profile.role}</strong>) tidak memiliki izin untuk mengakses menu ini.
            </p>
          </div>
        </div>
        {onReturnAllowedView && (
          <Button type="button" variant="secondary" onClick={onReturnAllowedView}>
            Kembali ke Halaman Utama
          </Button>
        )}
      </Card>
    );
  }

  return children;
}
