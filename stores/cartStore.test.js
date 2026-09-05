import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('adds a new item', () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    expect(useCartStore.getState().items).toEqual([
      { variantId: 'variant-1', quantity: 2, isPallet: false },
    ]);
  });

  it('increments quantity when adding the same variant/isPallet combination again', () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    useCartStore.getState().addItem('variant-1', 3, false);
    expect(useCartStore.getState().items).toEqual([
      { variantId: 'variant-1', quantity: 5, isPallet: false },
    ]);
  });

  it('treats the same variant as a separate line when isPallet differs', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().addItem('variant-1', 1, true);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('updates quantity for a specific line', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().updateQuantity('variant-1', 9, false);
    expect(useCartStore.getState().items[0].quantity).toBe(9);
  });

  it('removes a specific line', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().addItem('variant-2', 1, false);
    useCartStore.getState().removeItem('variant-1', false);
    expect(useCartStore.getState().items).toEqual([
      { variantId: 'variant-2', quantity: 1, isPallet: false },
    ]);
  });

  it('clears all items', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
