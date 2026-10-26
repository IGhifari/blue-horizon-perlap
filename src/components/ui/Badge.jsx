const BADGE_VARIANTS = {
  // Kategori pengadaan (Blue Horizon Theme)
  Pinjam: 'bg-[#7CC4FA] text-[#0A1936]',
  Sewa: 'bg-[#BAE6FD] text-[#0A1936]',
  Beli: 'bg-[#C7D2FE] text-[#0A1936]',
  'Sudah Tersedia di Divisi': 'bg-[#5EEAD4] text-[#0A1936]',

  // Status ketersediaan di Divisi Perlap
  'Sudah Ada': 'bg-[#5EEAD4] text-[#0A1936]',
  'Belum Ada': 'bg-[#FDA4AF] text-[#0A1936]',

  // Status timeline
  Selesai: 'bg-[#5EEAD4] text-[#0A1936]',
  'Sedang Berjalan': 'bg-[#38BDF8] text-[#0A1936]',
  'Belum Mulai': 'bg-[#DBEAFE] text-[#0A1936]',

  // Umum
  dark: 'bg-[#132956] text-white',
  yellow: 'bg-[#38BDF8] text-[#0A1936]',
  blue: 'bg-[#7CC4FA] text-[#0A1936]',
  mint: 'bg-[#5EEAD4] text-[#0A1936]',
  pink: 'bg-[#FDA4AF] text-[#0A1936]',
  white: 'bg-white text-[#0A1936]',
};

export default function Badge({
  children,
  variant = 'white',
  className = '',
}) {
  const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.white;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border-2 border-[#0A1936] text-xs font-extrabold tracking-tight shadow-[2px_2px_0px_#0A1936] ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}
