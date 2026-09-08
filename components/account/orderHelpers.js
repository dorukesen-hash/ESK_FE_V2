export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatOrderNumber(order) {
  const number = order?.orderNumber ?? order?.uniqueId;
  return number ? `#${number}` : '—';
}

export function isCancelled(order) {
  return order?.orderstatus?.name === 'Cancelled';
}
