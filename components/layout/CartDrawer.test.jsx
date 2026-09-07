import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { CartDrawer } from './CartDrawer';

vi.mock('@/hooks/useVariantsByIds', () => ({
  useVariantsByIds: vi.fn(),
}));

describe('CartDrawer', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
    useVariantsByIds.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  });

  it('renders nothing when closed', () => {
    render(<CartDrawer />);
    expect(screen.queryByText('Your Cart')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no items', () => {
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('shows a fallback label while variant details are still loading', () => {
    useCartStore.getState().addItem(327, 2, false);
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('Item 327')).toBeInTheDocument();
  });

  it('shows the real title/image once loaded, and removes the line on click', async () => {
    useCartStore.getState().addItem(327, 2, false);
    useVariantsByIds.mockReturnValue({
      data: [
        {
          id: 327,
          title: 'Composite Strapping',
          image: 'https://cdn.example.com/a.jpg',
          href: '/product/composite-strapping/327',
        },
      ],
      isLoading: false,
      isError: false,
    });
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('Composite Strapping')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('closes the drawer via the close button', async () => {
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Close cart' }));
    expect(useUIStore.getState().isCartDrawerOpen).toBe(false);
  });
});
