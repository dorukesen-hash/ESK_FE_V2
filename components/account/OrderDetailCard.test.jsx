import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { OrderDetailCard } from './OrderDetailCard';

const order = {
  id: 42,
  orderNumber: 'ESK-1001',
  createdAt: '2026-01-15T00:00:00.000Z',
  price: '162.50',
  trackingNumber: 'TRACK123',
  orderstatus: { id: 3, name: 'Completed' },
  orderitems: [
    { id: 1, title: 'Cord Strapping', code: 'CC40/2', quantity: 2, price: '50.00', variant_id: 327 },
    { id: 2, title: 'Corner Board', code: 'CB-4x4', quantity: 1, price: '50.00', variant_id: 405 },
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

describe('OrderDetailCard', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
  });

  it('renders order items, addresses, status, carrier, and total', () => {
    render(<OrderDetailCard order={order} />);

    expect(screen.getByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cord Strapping')).toBeInTheDocument();
    expect(screen.getByText('Corner Board')).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('SKU: CB-4x4')).toBeInTheDocument();
    expect(screen.getByText('UPS ·')).toBeInTheDocument();
    expect(screen.getAllByText('TRACK123').length).toBeGreaterThan(0);
    expect(screen.getByText('$162.50')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getAllByText(/Garland, TX, 75042/).length).toBeGreaterThan(0);
  });

  it('shows a refund notice when the order has a refund', () => {
    render(<OrderDetailCard order={{ ...order, amountRefunded: 50, amountRemaining: 112.5 }} />);
    expect(screen.getByText('$50.00 refunded, $112.50 remaining.')).toBeInTheDocument();
  });

  it('shows a full-refund notice when nothing remains', () => {
    render(<OrderDetailCard order={{ ...order, amountRefunded: 162.5, amountRemaining: 0 }} />);
    expect(screen.getByText('$162.50 refunded in full.')).toBeInTheDocument();
  });

  it('hides invoice/packing-slip downloads for a cancelled order', () => {
    render(<OrderDetailCard order={{ ...order, orderstatus: { id: 5, name: 'Cancelled' } }} />);
    expect(screen.queryByRole('link', { name: /Download invoice/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Download packing slip/ })).not.toBeInTheDocument();
    expect(
      screen.getByText('Invoice and packing slip are not available for cancelled orders.')
    ).toBeInTheDocument();
  });

  it('adds a single item back to the cart and opens the cart drawer', async () => {
    render(<OrderDetailCard order={order} />);
    await userEvent.click(screen.getAllByRole('button', { name: /Add to cart/ })[0]);
    expect(useCartStore.getState().items).toEqual([{ variantId: 327, quantity: 2, isPallet: false }]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('reorders every item in the order at once', async () => {
    render(<OrderDetailCard order={order} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reorder all items' }));
    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 2, isPallet: false },
      { variantId: 405, quantity: 1, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('shows a per-item refund note when a line item has one', () => {
    const orderWithItemRefund = {
      ...order,
      orderitems: [
        { ...order.orderitems[0], order_item_refunds: [{ id: 1, quantity: 1, amount: '25.00' }] },
        order.orderitems[1],
      ],
    };
    render(<OrderDetailCard order={orderWithItemRefund} />);
    expect(screen.getByText('1 of 2 refunded')).toBeInTheDocument();
  });
});
