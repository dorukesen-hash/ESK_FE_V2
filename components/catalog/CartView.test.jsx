import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { CartView } from './CartView';

vi.mock('@/hooks/useVariantsByIds', () => ({
  useVariantsByIds: vi.fn(),
}));

describe('CartView', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('shows an empty-cart message when there are no items', () => {
    useVariantsByIds.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<CartView />);
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('renders a line per cart item with quantity, price and subtotal', () => {
    useCartStore.getState().addItem(327, 2, false);
    useCartStore.getState().addItem(405, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [
        {
          id: 327,
          title: 'Composite Strapping',
          sku: 'CC40/2',
          price: 68,
          palletPrice: 53,
          unit: 'Coils',
          image: null,
          href: '/product/composite-strapping/327',
        },
        {
          id: 405,
          title: 'Wire Buckle',
          sku: 'WB1',
          price: 5,
          palletPrice: null,
          unit: 'Each',
          image: null,
          href: '/product/wire-buckle/405',
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CartView />);

    expect(screen.getByRole('link', { name: 'Composite Strapping' })).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
    expect(screen.getAllByLabelText('Qty')[0]).toHaveValue(2);
    // Line totals: 68*2=136 and 5*1=5; subtotal is their sum, 141 - all
    // distinct values so each assertion targets exactly one element.
    expect(screen.getByText('$136.00')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('$141.00')).toBeInTheDocument();
  });

  it('removes a line when Remove is clicked', async () => {
    useCartStore.getState().addItem(327, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [
        { id: 327, title: 'A', sku: null, price: 10, palletPrice: null, unit: null, image: null, href: '/x' },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CartView />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('updates quantity via the qty input', async () => {
    useCartStore.getState().addItem(327, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [
        { id: 327, title: 'A', sku: null, price: 10, palletPrice: null, unit: null, image: null, href: '/x' },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CartView />);

    const qtyInput = screen.getByLabelText('Qty');
    await userEvent.clear(qtyInput);
    await userEvent.type(qtyInput, '5');

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });
});
