import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const isError = t.type === 'error';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-[#0A1936] shadow-[4px_4px_0px_#0A1936] text-xs sm:text-sm font-extrabold transition-all ${
              isError
                ? 'bg-[#FDA4AF] text-[#0A1936]'
                : 'bg-[#132956] text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isError ? (
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#0A1936]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#38BDF8]" />
              )}
              <span>{t.message}</span>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="p-1 rounded-lg border border-[#0A1936] bg-white text-[#0A1936] hover:bg-[#DBEAFE] transition cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
