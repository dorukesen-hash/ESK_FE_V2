'use client';

const VARIANT_CLASSES = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'bg-button-secondary-bg text-text-primary hover:bg-accent-tint',
  outline: 'border border-border text-text-primary hover:bg-accent-tint hover:text-primary',
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
