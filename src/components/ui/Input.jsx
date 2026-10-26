export default function Input({
  id,
  label,
  required = false,
  error = '',
  className = '',
  icon: Icon,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-extrabold uppercase tracking-wider text-[#0A1936] mb-1.5"
        >
          {label} {required && <span className="text-[#E11D48]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-[#132956] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          id={id}
          required={required}
          className={`w-full rounded-xl border-2 border-[#0A1936] bg-white ${
            Icon ? 'pl-10 pr-3.5' : 'px-3.5'
          } py-2.5 text-xs sm:text-sm font-semibold text-[#0A1936] placeholder:text-slate-400 placeholder:font-normal shadow-[2px_2px_0px_#0A1936] transition-all focus:outline-none focus:bg-[#F4F8FF] focus:border-[#132956] focus:shadow-[4px_4px_0px_#132956] ${
            error ? 'border-[#E11D48] bg-[#FFF0F3]' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs font-bold text-[#E11D48]">{error}</p>
      )}
    </div>
  );
}
