import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { OrdersListView } from './OrdersListView';

vi.mock('@/hooks/useAccountOrders', () => ({
  useAccountOrders: vi.fn(),
}));

describe('OrdersListView', () => {
  it('shows a loading state', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<OrdersListView />);
    expect(screen.getByText('Loading orders…')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<OrdersListView />);
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't load your orders");
  });

  it('shows an empty state', () => {
    useAccountOrders.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<OrdersListView />);
    expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
  });

  it('lists orders with a link to the detail page', () => {
    useAccountOrders.mockReturnValue({
      data: [
        {
          id: 1,
          orderNumber: 'ESK-1001',
          createdAt: '2026-01-15T00:00:00.000Z',
          price: '129.50',
          orderstatus: { id: 3, name: 'Completed' },
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<OrdersListView />);

    expect(screen.getByText('#ESK-1001')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('$129.50')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/account/orders/ESK-1001'
    );
  });

  it('shows a refunded amount when the order has one', () => {
    useAccountOrders.mockReturnValue({
      data: [
        {
          id: 1,
          orderNumber: 'ESK-1002',
          createdAt: '2026-01-15T00:00:00.000Z',
          price: '129.50',
          amountRefunded: 40,
          orderstatus: { id: 3, name: 'Completed' },
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<OrdersListView />);

    expect(screen.getByText('$40.00 refunded')).toBeInTheDocument();
  });
});
