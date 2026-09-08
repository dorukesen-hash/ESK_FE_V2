import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { OrderDetailView } from './OrderDetailView';

vi.mock('@/hooks/useAccountOrders', () => ({
  useAccountOrders: vi.fn(),
}));

const order = {
  id: 42,
  orderNumber: 'ESK-1001',
  createdAt: '2026-01-15T00:00:00.000Z',
  price: '162.50',
  trackingNumber: 'TRACK123',
  orderstatus: { id: 3, name: 'Completed' },
  orderitems: [
    { id: 1, title: 'Cord Strapping', quantity: 2, price: '50.00', variant_id: 327 },
    { id: 2, title: 'Corner Board', quantity: 1, price: '50.00', variant_id: 405 },
  ],
  shipment: {
    name: 'Jane Doe',
    firstline: '123 Main St',
    secondline: null,
    city: 'Garland',
    state: 'TX',
    zip: '75042',
    tracking: 'TRACK123',
    carrier: { id: 1, name: 'UPS' },
  },
  billing: {
    name: 'Jane Doe',
    firstline: '123 Main St',
    secondline: null,
    city: 'Garland',
    state: 'TX',
    zip: '75042',
  },
};

describe('OrderDetailView', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
  });

  it('shows a loading state', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);
    expect(screen.getByText('Loading order…')).toBeInTheDocument();
  });

  it('shows an order-not-found state when no order matches', () => {
    useAccountOrders.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-9999" />);
    expect(screen.getByRole('heading', { name: 'Order not found' })).toBeInTheDocument();
  });

  it('renders order items, addresses, status, carrier, and total', () => {
    useAccountOrders.mockReturnValue({ data: [order], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    expect(
      screen.getByRole('heading', { name: 'Order #ESK-1001' })
    ).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cord Strapping')).toBeInTheDocument();
    expect(screen.getByText('Corner Board')).toBeInTheDocument();
    expect(screen.getByText('UPS ·')).toBeInTheDocument();
    expect(screen.getAllByText('TRACK123').length).toBeGreaterThan(0);
    expect(screen.getByText('$162.50')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getAllByText(/Garland, TX, 75042/).length).toBeGreaterThan(0);
  });

  it('shows a refund notice when the order has a refund', () => {
    useAccountOrders.mockReturnValue({
      data: [{ ...order, amountRefunded: 50, amountRemaining: 112.5 }],
      isLoading: false,
      isError: false,
    });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    expect(
      screen.getByText('$50.00 refunded, $112.50 remaining.')
    ).toBeInTheDocument();
  });

  it('shows a full-refund notice when nothing remains', () => {
    useAccountOrders.mockReturnValue({
      data: [{ ...order, amountRefunded: 162.5, amountRemaining: 0 }],
      isLoading: false,
      isError: false,
    });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    expect(screen.getByText('$162.50 refunded in full.')).toBeInTheDocument();
  });

  it('hides invoice/packing-slip downloads for a cancelled order', () => {
    useAccountOrders.mockReturnValue({
      data: [{ ...order, orderstatus: { id: 5, name: 'Cancelled' } }],
      isLoading: false,
      isError: false,
    });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    expect(screen.queryByRole('link', { name: /Download invoice/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Download packing slip/ })).not.toBeInTheDocument();
    expect(
      screen.getByText('Invoice and packing slip are not available for cancelled orders.')
    ).toBeInTheDocument();
  });

  it('adds a single item back to the cart and opens the cart drawer', async () => {
    useAccountOrders.mockReturnValue({ data: [order], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    await userEvent.click(screen.getAllByRole('button', { name: /Add to cart/ })[0]);

    expect(useCartStore.getState().items).toEqual([{ variantId: 327, quantity: 2, isPallet: false }]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('reorders every item in the order at once', async () => {
    useAccountOrders.mockReturnValue({ data: [order], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    await userEvent.click(screen.getByRole('button', { name: 'Reorder all items' }));

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 2, isPallet: false },
      { variantId: 405, quantity: 1, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });
});
