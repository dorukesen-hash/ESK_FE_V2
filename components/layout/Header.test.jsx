import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { Header } from './Header';

describe('Header', () => {
  beforeEach(() => {
    push.mockClear();
    useAuthStore.setState({ user: null, isLoading: false });
    useCartStore.getState().clear();
  });

  it('links to login when there is no user', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('links to account when a user is present', () => {
    useAuthStore.setState({ user: { id: '1' }, isLoading: false });
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account'
    );
  });

  it('hides the cart badge when the cart is empty', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Cart' })).toBeInTheDocument();
  });

  it('shows the total item count on the cart badge', () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    useCartStore.getState().addItem('variant-2', 1, false);
    render(<Header />);
    expect(
      screen.getByRole('link', { name: 'Cart, 3 items' })
    ).toBeInTheDocument();
  });

  it('navigates to the search page with the query on submit', () => {
    render(<Header />);
    const input = screen.getByLabelText('Search products');
    fireEvent.change(input, { target: { value: 'stretch wrap' } });
    fireEvent.submit(input.closest('form'));
    expect(push).toHaveBeenCalledWith('/search?q=stretch%20wrap');
  });
});
