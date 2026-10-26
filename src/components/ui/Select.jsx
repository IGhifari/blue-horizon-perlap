export default function Select({
  id,
  label,
  required = false,
  options = [],
  className = '',
  children,
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
      <select
        id={id}
        required={required}
        className={`w-full rounded-xl border-2 border-[#0A1936] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#0A1936] shadow-[2px_2px_0px_#0A1936] transition-all cursor-pointer focus:outline-none focus:bg-[#F4F8FF] focus:border-[#132956] focus:shadow-[4px_4px_0px_#132956] ${className}`}
        {...props}
      >
        {children
          ? children
          : options.map((opt) => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const text = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={value} value={value}>
                  {text}
                </option>
              );
            })}
      </select>
    </div>
  );
}
