import { InfoBanner } from './InfoBanner';

export function LegalPage({ kicker = 'Policies', title, subtitle, meta, children }) {
  return (
    <main>
      <InfoBanner kicker={kicker} title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-3xl px-6 py-16">
        {meta && (
          <div className="mb-10 space-y-1 border-b border-border pb-8 text-sm text-text-muted">
            {meta}
          </div>
        )}
        <div className="space-y-8">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }) {
  const match = title?.match(/^(\d+)\.\s*(.+)$/);
  const number = match?.[1];
  const label = match ? match[2] : title;

  return (
    <section className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      {label && (
        <div className="flex items-baseline gap-4">
          {number && (
            <span aria-hidden="true" className="text-2xl font-black text-accent/30">
              {number.padStart(2, '0')}
            </span>
          )}
          <h2 className="text-lg font-bold text-text-primary">{label}</h2>
        </div>
      )}
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  );
}
