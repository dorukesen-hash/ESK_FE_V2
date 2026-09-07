import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAccountOrders } from '@/hooks/useAccountOrders';
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
  orderstatus: { id: 2, name: 'Shipped' },
  orderitems: [
    { id: 1, title: 'Cord Strapping', quantity: 2, price: '50.00' },
    { id: 2, title: 'Corner Board', quantity: 1, price: '50.00' },
  ],
  shipment: {
    name: 'Jane Doe',
    firstline: '123 Main St',
    secondline: null,
    city: 'Garland',
    state: 'TX',
    zip: '75042',
    tracking: 'TRACK123',
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

  it('renders order items, addresses, status, and total', () => {
    useAccountOrders.mockReturnValue({ data: [order], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);

    expect(
      screen.getByRole('heading', { name: 'Order ESK-1001' })
    ).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Cord Strapping')).toBeInTheDocument();
    expect(screen.getByText('Corner Board')).toBeInTheDocument();
    expect(screen.getAllByText('TRACK123').length).toBeGreaterThan(0);
    expect(screen.getByText('$162.50')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getAllByText(/Garland, TX, 75042/).length).toBeGreaterThan(0);
  });
});
