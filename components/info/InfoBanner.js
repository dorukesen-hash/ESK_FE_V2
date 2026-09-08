export function InfoBanner({ kicker, title, subtitle }) {
  return (
    <div className="relative overflow-hidden bg-ink">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-16 select-none text-[240px] font-black leading-none text-on-ink/[0.06] sm:text-[320px]"
      >
        e
      </span>

      <div className="relative mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">{kicker}</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-xl text-sm text-on-ink-muted sm:text-base">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
