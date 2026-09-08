export function StatusPill({ status }) {
  if (!status) return <span className="text-text-muted">—</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-accent-tint px-2.5 py-1 text-xs font-semibold text-accent-hover">
      {status}
    </span>
  );
}
