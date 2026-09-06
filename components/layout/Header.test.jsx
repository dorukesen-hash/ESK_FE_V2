import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';

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
    useUIStore.setState({ isCartDrawerOpen: false, isLoginModalOpen: false });
  });

  it('shows a Login button when there is no user', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('links to account when a user is present', () => {
    useAuthStore.setState({ user: { id: '1' }, isLoading: false });
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account'
    );
  });

  it('opens the login popover when the Login button is clicked', async () => {
    render(<Header />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(useUIStore.getState().isLoginModalOpen).toBe(true);
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('opens the cart drawer when the cart button is clicked', async () => {
    render(<Header />);
    await userEvent.click(screen.getByRole('button', { name: 'Cart' }));
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('shows the total item count on the cart button', () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    useCartStore.getState().addItem('variant-2', 1, false);
    render(<Header />);
    expect(
      screen.getByRole('button', { name: 'Cart, 3 items' })
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
