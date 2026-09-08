export function CheckoutStep({ number, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
        >
          {number}
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">
          {title}
        </h2>
      </div>
      <div className="mt-4 pl-10">{children}</div>
    </section>
  );
}
