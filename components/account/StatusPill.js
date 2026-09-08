// Matches the real orderstatus table (verified against ESK_API's
// orderController.js: id 1-6 are Pending, In Progress, Completed, On Hold,
// Cancelled, Refunded).
const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Completed: 'bg-green-50 text-green-700',
  'On Hold': 'bg-orange-50 text-orange-700',
  Cancelled: 'bg-red-50 text-red-700',
  Refunded: 'bg-purple-50 text-purple-700',
};

export function StatusPill({ status }) {
  if (!status) return <span className="text-text-muted">—</span>;
  const style = STATUS_STYLES[status] ?? 'bg-accent-tint text-accent-hover';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  );
}
