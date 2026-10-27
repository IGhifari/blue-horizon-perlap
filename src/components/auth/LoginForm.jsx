import { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function LoginForm({ onLogin, externalError = '' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = localError || externalError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setLocalError('Username wajib diisi.');
      return;
    }
    if (!password) {
      setLocalError('Password wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await onLogin(cleanUsername, password);
    } catch (err) {
      setLocalError(err?.message || 'Gagal masuk. Periksa username & password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="white" shadow="lg" className="w-full max-w-md overflow-hidden">
      <div className="p-5 bg-[#DBEAFE] border-b-2 border-[#0A1936] flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#132956] border-2 border-[#0A1936] shadow-[3px_3px_0px_#38BDF8] overflow-hidden shrink-0 flex items-center justify-center">
          <img
            src="/logo-blue-horizon.jpg"
            alt="Logo Blue Horizon"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-[#38BDF8] text-[#0A1936] border-2 border-[#0A1936] text-[10px] font-black uppercase tracking-wider mb-1">
            Blue Horizon
          </span>
          <h2 className="text-base sm:text-lg font-black text-[#0A1936] leading-tight">
            Login Portal Logistik
          </h2>
          <p className="text-xs font-bold text-slate-700">
            Masuk menggunakan akun divisi yang terdaftar
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4" noValidate>
        {displayError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FDA4AF] border-2 border-[#0A1936] shadow-[2px_2px_0px_#0A1936] flex items-start gap-2.5 text-xs font-extrabold text-[#0A1936]"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        <Input
          id="login-username"
          label="Username"
          type="text"
          autoComplete="username"
          required
          disabled={submitting}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (localError) setLocalError('');
          }}
          placeholder="Contoh: admin_perlap, acara_01..."
        />

        <div className="w-full">
          <label
            htmlFor="login-password"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0A1936] mb-1.5"
          >
            Password <span className="text-[#E11D48]">*</span>
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={submitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (localError) setLocalError('');
              }}
              placeholder="Masukkan password akun..."
              className="w-full rounded-xl border-2 border-[#0A1936] bg-white pl-3.5 pr-11 py-2.5 text-xs sm:text-sm font-semibold text-[#0A1936] placeholder:text-slate-400 placeholder:font-normal shadow-[2px_2px_0px_#0A1936] transition-all focus:outline-none focus:bg-[#F4F8FF] focus:border-[#132956] focus:shadow-[4px_4px_0px_#132956]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#132956] hover:bg-[#DBEAFE] transition cursor-pointer"
              aria-label={
                showPassword ? 'Sembunyikan password' : 'Tampilkan password'
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="blue"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Memverifikasi Sesi...' : 'Masuk ke Portal'}</span>
          </Button>
        </div>

        <div className="pt-3 border-t-2 border-[#0A1936] text-[11px] font-bold text-slate-600 leading-relaxed">
          Akun dikelola secara terpusat oleh <strong>Admin Utama Perlengkapan</strong>.
          Hubungi Admin Utama apabila Anda belum memiliki akun atau lupa password.
        </div>
      </form>
    </Card>
  );
}
