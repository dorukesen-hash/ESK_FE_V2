const VARIANT_CLASSES = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 text-slate-900 hover:bg-slate-50',
};

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
