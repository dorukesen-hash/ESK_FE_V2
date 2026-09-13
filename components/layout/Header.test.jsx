import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useLogin } from '@/hooks/useLogin';
import { useSearch } from '@/hooks/useSearch';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useVariantsByIds', () => ({
  useVariantsByIds: vi.fn(),
}));

vi.mock('@/hooks/useLogin', () => ({
  useLogin: vi.fn(),
}));

vi.mock('@/hooks/useSearch', () => ({
  useSearch: vi.fn(),
}));

import { Header } from './Header';

describe('Header', () => {
  beforeEach(() => {
    push.mockClear();
    useAuthStore.setState({ user: null, isLoading: false });
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false, isLoginModalOpen: false });
    useVariantsByIds.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useSearch.mockReturnValue({ data: undefined, isLoading: false });
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

  it('navigates to the search page when the search button is clicked', () => {
    render(<Header />);
    const input = screen.getByLabelText('Search products');
    fireEvent.change(input, { target: { value: 'tape' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(push).toHaveBeenCalledWith('/search?q=tape');
  });

  it('does not show a preview dropdown for fewer than 3 characters', async () => {
    useSearch.mockReturnValue({
      data: { count: 1, results: [{ id: 1, title: 'Strap', href: '/product/strap/1', categoryName: 'A', subcategoryName: 'B' }] },
      isLoading: false,
    });
    render(<Header />);
    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'st' } });

    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(screen.queryByRole('link', { name: /Strap/ })).not.toBeInTheDocument();
  });

  it('shows a preview dropdown with results once 3+ characters are typed', async () => {
    useSearch.mockReturnValue({
      data: {
        count: 42,
        results: [
          {
            id: 327,
            title: 'Composite Strapping',
            sku: 'CC40/2',
            categoryName: 'CORD STRAPPING',
            subcategoryName: 'Composite Strapping',
            href: '/product/composite-strapping/327',
          },
        ],
      },
      isLoading: false,
    });
    render(<Header />);
    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'strap' } });

    await waitFor(
      () => expect(screen.getByRole('link', { name: /Composite Strapping/ })).toHaveAttribute(
        'href',
        '/product/composite-strapping/327'
      ),
      { timeout: 1000 }
    );
    expect(screen.getByRole('button', { name: 'View all 42 results for "strap"' })).toBeInTheDocument();
  });

  it('navigates to the full results page when "View all results" is clicked', async () => {
    useSearch.mockReturnValue({
      data: { count: 10, results: [{ id: 1, title: 'Strap', href: '/product/strap/1', categoryName: 'A', subcategoryName: 'B' }] },
      isLoading: false,
    });
    render(<Header />);
    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'strap' } });

    const viewAll = await screen.findByRole('button', { name: /View all 10 results/ }, { timeout: 1000 });
    await userEvent.click(viewAll);

    expect(push).toHaveBeenCalledWith('/search?q=strap');
  });

  it('closes the dropdown on Escape', async () => {
    useSearch.mockReturnValue({
      data: { count: 1, results: [{ id: 1, title: 'Strap', href: '/product/strap/1', categoryName: 'A', subcategoryName: 'B' }] },
      isLoading: false,
    });
    render(<Header />);
    const input = screen.getByLabelText('Search products');
    fireEvent.change(input, { target: { value: 'strap' } });

    await screen.findByRole('link', { name: /Strap/ }, { timeout: 1000 });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: /Strap/ })).not.toBeInTheDocument();
  });

  it('closes the dropdown on outside click', async () => {
    useSearch.mockReturnValue({
      data: { count: 1, results: [{ id: 1, title: 'Strap', href: '/product/strap/1', categoryName: 'A', subcategoryName: 'B' }] },
      isLoading: false,
    });
    render(<Header />);
    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'strap' } });

    await screen.findByRole('link', { name: /Strap/ }, { timeout: 1000 });
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('link', { name: /Strap/ })).not.toBeInTheDocument();
  });
});
