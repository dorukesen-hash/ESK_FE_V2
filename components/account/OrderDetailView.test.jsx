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
  orderstatus: { id: 3, name: 'Completed' },
  orderitems: [],
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

  it('shows an error state', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<OrderDetailView orderNumber="ESK-1001" />);
    expect(
      screen.getByText("We couldn't load this order. Please try again later.")
    ).toBeInTheDocument();
  });

  it('finds the matching order and renders its detail via OrderDetailCard', () => {
    useAccountOrders.mockReturnValue({ data: [order], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);
    expect(screen.getByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to order history/ })).toHaveAttribute(
      'href',
      '/account/orders'
    );
  });
});
