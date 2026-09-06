import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { CartDrawer } from './CartDrawer';

describe('CartDrawer', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
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

  it('lists cart items and removes one on click', async () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('variant-1')).toBeInTheDocument();

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
