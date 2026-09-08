import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatOrderNumber,
  isCancelled,
  getItemRefundedQuantity,
  getItemRefundedAmount,
} from './orderHelpers';

describe('formatOrderNumber', () => {
  it('prefixes the order number with #', () => {
    expect(formatOrderNumber({ orderNumber: 'ESK-1001' })).toBe('#ESK-1001');
  });

  it('falls back to uniqueId when there is no orderNumber', () => {
    expect(formatOrderNumber({ uniqueId: 'abc123' })).toBe('#abc123');
  });

  it('returns a dash when neither is present', () => {
    expect(formatOrderNumber({})).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2026-01-15T00:00:00.000Z')).toBe('Jan 15, 2026');
  });

  it('returns a dash for a missing or invalid date', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('isCancelled', () => {
  it('is true only for the Cancelled status', () => {
    expect(isCancelled({ orderstatus: { name: 'Cancelled' } })).toBe(true);
    expect(isCancelled({ orderstatus: { name: 'Completed' } })).toBe(false);
    expect(isCancelled({})).toBe(false);
  });
});

describe('getItemRefundedQuantity / getItemRefundedAmount', () => {
  const item = {
    quantity: 3,
    order_item_refunds: [
      { quantity: 1, amount: '25.00' },
      { quantity: 1, amount: '25.00' },
    ],
  };

  it('sums quantity across all refund rows for the item', () => {
    expect(getItemRefundedQuantity(item)).toBe(2);
  });

  it('sums amount across all refund rows for the item', () => {
    expect(getItemRefundedAmount(item)).toBe(50);
  });

  it('returns 0 when there are no refund rows', () => {
    expect(getItemRefundedQuantity({ quantity: 3 })).toBe(0);
    expect(getItemRefundedAmount({ quantity: 3 })).toBe(0);
  });
});
