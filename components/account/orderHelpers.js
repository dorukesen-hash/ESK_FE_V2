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

// Item-level refunds are an immutable log (ESK_API's OrderItemRefund) - the
// OrderItem's own quantity/price never change, so "how much of this line was
// refunded" is always the sum of its refund rows, computed here rather than
// stored anywhere.
export function getItemRefundedQuantity(item) {
  const refunds = item?.order_item_refunds ?? [];
  return refunds.reduce((sum, refund) => sum + Number(refund.quantity ?? 0), 0);
}

export function getItemRefundedAmount(item) {
  const refunds = item?.order_item_refunds ?? [];
  return refunds.reduce((sum, refund) => sum + Number(refund.amount ?? 0), 0);
}
