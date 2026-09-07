export function LegalPage({ title, meta, children }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{title}</h1>
      {meta && <div className="mt-2 space-y-1 text-sm text-text-muted">{meta}</div>}
      <div className="mt-8 space-y-8">{children}</div>
    </main>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      {title && (
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      )}
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  );
}
