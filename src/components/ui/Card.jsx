const BG_VARIANTS = {
  white: 'bg-white',
  cream: 'bg-[#F4F8FF]',
  yellow: 'bg-[#DBEAFE]',
  blue: 'bg-[#E0F2FE]',
  mint: 'bg-[#CCFBF1]',
  pink: 'bg-[#E0E7FF]',
  navy: 'bg-[#132956] text-white',
};

export default function Card({
  children,
  variant = 'white',
  shadow = 'md',
  className = '',
  ...props
}) {
  const bgClass = BG_VARIANTS[variant] || BG_VARIANTS.white;
  const shadowClass =
    shadow === 'lg'
      ? 'shadow-[6px_6px_0px_#0A1936]'
      : shadow === 'sm'
      ? 'shadow-[3px_3px_0px_#0A1936]'
      : 'shadow-[4px_4px_0px_#0A1936]';

  return (
    <div
      className={`rounded-xl border-2 border-[#0A1936] ${bgClass} ${shadowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
