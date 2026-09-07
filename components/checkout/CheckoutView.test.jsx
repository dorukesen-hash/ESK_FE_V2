import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useShippingOptions } from '@/hooks/useShippingOptions';
import { useCreatePaymentIntent } from '@/hooks/useCreatePaymentIntent';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { CheckoutView } from './CheckoutView';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/hooks/useVariantsByIds', () => ({ useVariantsByIds: vi.fn() }));
vi.mock('@/hooks/useShippingOptions', () => ({ useShippingOptions: vi.fn() }));
vi.mock('@/hooks/useCreatePaymentIntent', () => ({ useCreatePaymentIntent: vi.fn() }));
vi.mock('@/hooks/useCreateOrder', () => ({ useCreateOrder: vi.fn() }));

async function fillAddressForm() {
  await userEvent.type(screen.getByLabelText('First name'), 'Jane');
  await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
  await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
  await userEvent.type(screen.getByLabelText('Phone'), '5551234567');
  await userEvent.type(screen.getByLabelText('Address'), '123 Main St');
  await userEvent.type(screen.getByLabelText('City'), 'Dallas');
  await userEvent.type(screen.getByLabelText('State'), 'TX');
  await userEvent.type(screen.getByLabelText('ZIP'), '75201');
}

describe('CheckoutView', () => {
  const mutate = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    useCartStore.getState().clear();
    mutate.mockClear();
    mutateAsync.mockClear();
    useVariantsByIds.mockReturnValue({ data: [] });
    useShippingOptions.mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      data: [],
    });
    useCreatePaymentIntent.mockReturnValue({ mutateAsync, isPending: false });
    useCreateOrder.mockReturnValue({ mutateAsync, isPending: false });
  });

  it('shows an empty-cart message when there is nothing to check out', () => {
    render(<CheckoutView />);
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('renders order summary lines from the cart and variant data', () => {
    useCartStore.getState().addItem(327, 2, false);
    useCartStore.getState().addItem(405, 1, false);
    useVariantsByIds.mockReturnValue({
      data: [
        { id: 327, title: 'Composite Strapping', price: 68, palletPrice: null, unit: 'Coils' },
        { id: 405, title: 'Wire Buckle', price: 5, palletPrice: null, unit: 'Each' },
      ],
    });
    render(<CheckoutView />);
    expect(screen.getByText('Composite Strapping × 2')).toBeInTheDocument();
    expect(screen.getByText('Wire Buckle × 1')).toBeInTheDocument();
    expect(screen.getByText('$136.00')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    // Subtotal and Total both show $141.00 here (no shipping selected yet,
    // so total === subtotal) - assert via their row labels instead of the
    // shared value text, which would otherwise match both rows.
    expect(
      screen.getByText('Subtotal').nextElementSibling
    ).toHaveTextContent('$141.00');
    expect(screen.getByText('Total').nextElementSibling).toHaveTextContent(
      '$141.00'
    );
  });

  it('requests shipping options with the entered address on submit', async () => {
    useCartStore.getState().addItem(327, 1, false);
    render(<CheckoutView />);

    await fillAddressForm();
    await userEvent.click(screen.getByRole('button', { name: 'Get Shipping Rates' }));

    expect(mutate).toHaveBeenCalledWith({
      recipient: {
        AddressLine: ['123 Main St'],
        City: 'Dallas',
        StateProvinceCode: 'TX',
        PostalCode: '75201',
      },
      items: [{ variantId: 327, quantity: 1, isPallet: false }],
    });
  });

  it('shows a message when no shipping options come back for the address', () => {
    useCartStore.getState().addItem(327, 1, false);
    useShippingOptions.mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: [],
    });
    render(<CheckoutView />);
    expect(
      screen.getByText('No shipping options are available for this address right now.')
    ).toBeInTheDocument();
  });

  it('creates a payment intent and reveals payment once a shipping option is chosen', async () => {
    useCartStore.getState().addItem(327, 1, false);
    useShippingOptions.mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: [{ carrierName: 'UPS Ground', priceTotal: 12.5 }],
    });
    mutateAsync.mockResolvedValue({ clientSecret: 'pi_123_secret' });
    render(<CheckoutView />);

    await userEvent.click(screen.getByRole('radio'));

    expect(mutateAsync).toHaveBeenCalledWith({
      items: [{ variantId: 327, quantity: 1, isPallet: false }],
      shipping: { price: 12.5 },
    });
    expect(await screen.findByText(/Payment is not configured yet/)).toBeInTheDocument();
  });
});
