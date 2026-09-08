export function AuthDivider() {
  return (
    <div className="relative my-6 flex items-center">
      <div className="h-px flex-1 bg-border" />
      <span className="px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
        or
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
