import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useValidateDiscountCode } from '@/hooks/useValidateDiscountCode';
import { CartDrawer } from './CartDrawer';

vi.mock('@/hooks/useVariantsByIds', () => ({
  useVariantsByIds: vi.fn(),
}));

vi.mock('@/hooks/useValidateDiscountCode', () => ({
  useValidateDiscountCode: vi.fn(),
}));

describe('CartDrawer', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
    useVariantsByIds.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    useValidateDiscountCode.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
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
          sku: 'CC40/2',
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
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Composite Strapping from cart' })
    );
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('closes the drawer via the close button', async () => {
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Close cart' }));
    expect(useUIStore.getState().isCartDrawerOpen).toBe(false);
  });

  it('shows how much more is needed for free shipping when under the threshold', () => {
    useCartStore.getState().addItem(327, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [{ id: 327, title: 'Composite Strapping', price: 500 }],
      isLoading: false,
      isError: false,
    });
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('Add $1500.00 more for free shipping')).toBeInTheDocument();
  });

  it('shows free shipping unlocked once the threshold is met', () => {
    useCartStore.getState().addItem(327, 5, false);
    useVariantsByIds.mockReturnValue({
      data: [{ id: 327, title: 'Composite Strapping', price: 500 }],
      isLoading: false,
      isError: false,
    });
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText("You've unlocked free shipping")).toBeInTheDocument();
  });

  it('applies a valid coupon and shows the discount against the subtotal', async () => {
    useCartStore.getState().addItem(327, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [{ id: 327, title: 'Composite Strapping', price: 500 }],
      isLoading: false,
      isError: false,
    });
    const mutateAsync = vi.fn().mockResolvedValue({
      code: 'SAVE10',
      type: 'percent',
      value: 10,
      applied: true,
      discountAmount: 50,
      message: null,
    });
    useValidateDiscountCode.mockReturnValue({ mutateAsync, isPending: false });
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);

    await userEvent.type(screen.getByLabelText('Discount code'), 'save10');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(mutateAsync).toHaveBeenCalledWith({
      items: [{ variantId: 327, quantity: 1 }],
      discountCode: 'save10',
    });
    expect(await screen.findByText('SAVE10 applied')).toBeInTheDocument();
    expect(screen.getByText('Discount (SAVE10)')).toBeInTheDocument();
    expect(screen.getByText('-$50.00')).toBeInTheDocument();
    expect(useCartStore.getState().discountCode).toEqual({
      code: 'SAVE10',
      type: 'percent',
      value: 10,
      applied: true,
      discountAmount: 50,
      message: null,
    });
  });

  it('shows an error when the coupon code is invalid', async () => {
    useCartStore.getState().addItem(327, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [{ id: 327, title: 'Composite Strapping', price: 500 }],
      isLoading: false,
      isError: false,
    });
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Invalid discount code.' } },
    });
    useValidateDiscountCode.mockReturnValue({ mutateAsync, isPending: false });
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);

    await userEvent.type(screen.getByLabelText('Discount code'), 'BADCODE');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid discount code.');
    expect(useCartStore.getState().discountCode).toBeNull();
  });

  it('lets the applied coupon be removed', async () => {
    useCartStore.getState().addItem(327, 1, false);
    useCartStore.getState().applyDiscountCode({
      code: 'SAVE10',
      type: 'percent',
      value: 10,
      discountAmount: 50,
    });
    useVariantsByIds.mockReturnValue({
      data: [{ id: 327, title: 'Composite Strapping', price: 500 }],
      isLoading: false,
      isError: false,
    });
    useUIStore.setState({ isCartDrawerOpen: true });
    render(<CartDrawer />);

    expect(screen.getByText('SAVE10 applied')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(useCartStore.getState().discountCode).toBeNull();
  });
});
