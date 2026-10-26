const VARIANT_CLASSES = {
  primary:
    'bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0A1936] border-2 border-[#0A1936] shadow-[4px_4px_0px_#0A1936] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1936]',
  blue:
    'bg-[#1E3E7A] hover:bg-[#132956] text-white border-2 border-[#0A1936] shadow-[4px_4px_0px_#0A1936] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1936]',
  mint:
    'bg-[#5EEAD4] hover:bg-[#2DD4BF] text-[#0A1936] border-2 border-[#0A1936] shadow-[4px_4px_0px_#0A1936] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1936]',
  danger:
    'bg-[#FDA4AF] hover:bg-[#FB7185] text-[#0A1936] border-2 border-[#0A1936] shadow-[3px_3px_0px_#0A1936] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0A1936]',
  secondary:
    'bg-white hover:bg-[#DBEAFE] text-[#0A1936] border-2 border-[#0A1936] shadow-[4px_4px_0px_#0A1936] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1936]',
  dark:
    'bg-[#132956] hover:bg-[#1E3E7A] text-white border-2 border-[#0A1936] shadow-[4px_4px_0px_#38BDF8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#38BDF8]',
  dashed:
    'bg-[#DBEAFE] hover:bg-[#BFDBFE] text-[#0A1936] border-2 border-dashed border-[#132956] shadow-[4px_4px_0px_#0A1936] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1936]',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm sm:text-base rounded-xl',
};

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const variantStyle = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeStyle = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-extrabold tracking-tight transition-all duration-100 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132956] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
