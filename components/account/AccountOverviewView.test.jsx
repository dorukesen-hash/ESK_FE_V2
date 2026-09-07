import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { AccountOverviewView } from './AccountOverviewView';

vi.mock('@/hooks/useAccountOrders', () => ({
  useAccountOrders: vi.fn(),
}));

describe('AccountOverviewView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, name: 'Jane', email: 'jane@example.com' },
      isLoading: false,
    });
  });

  it('greets the user by name and shows their email', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: true });
    render(<AccountOverviewView />);
    expect(screen.getByRole('heading', { name: 'Welcome back, Jane' })).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows an order count when orders have loaded', () => {
    useAccountOrders.mockReturnValue({
      data: [{ id: 1 }, { id: 2 }],
      isLoading: false,
    });
    render(<AccountOverviewView />);
    expect(screen.getByText('You have 2 orders on file.')).toBeInTheDocument();
  });

  it('shows a no-orders message for an empty order history', () => {
    useAccountOrders.mockReturnValue({ data: [], isLoading: false });
    render(<AccountOverviewView />);
    expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
  });

  it('links to orders, addresses, and invoices', () => {
    useAccountOrders.mockReturnValue({ data: [], isLoading: false });
    render(<AccountOverviewView />);
    expect(screen.getByRole('link', { name: /Orders/ })).toHaveAttribute('href', '/account/orders');
    expect(screen.getByRole('link', { name: /Addresses/ })).toHaveAttribute('href', '/account/addresses');
    expect(screen.getByRole('link', { name: /Invoices/ })).toHaveAttribute('href', '/account/invoices');
  });
});
