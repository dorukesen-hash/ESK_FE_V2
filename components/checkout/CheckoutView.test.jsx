import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAddresses } from '@/hooks/useAddresses';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useShippingOptions } from '@/hooks/useShippingOptions';
import { useCreatePaymentIntent } from '@/hooks/useCreatePaymentIntent';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { CheckoutView } from './CheckoutView';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/hooks/useAddresses', () => ({ useAddresses: vi.fn() }));
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
    useAuthStore.setState({ user: null, isLoading: false });
    useAddresses.mockReturnValue({ data: undefined });
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
        { id: 327, title: 'Composite Strapping', sku: 'CC40/2', price: 68, palletPrice: null, unit: 'Coils' },
        { id: 405, title: 'Wire Buckle', sku: 'WB-100', price: 5, palletPrice: null, unit: 'Each' },
      ],
    });
    render(<CheckoutView />);
    expect(screen.getByText('Composite Strapping × 2')).toBeInTheDocument();
    expect(screen.getByText('Wire Buckle × 1')).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('SKU: WB-100')).toBeInTheDocument();
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

  it('leaves the form blank for a guest (not logged in)', () => {
    useCartStore.getState().addItem(327, 1, false);
    render(<CheckoutView />);
    expect(screen.getByLabelText('First name')).toHaveValue('');
    expect(useAddresses).toHaveBeenCalledWith({ enabled: false });
  });

  it("prefills name/email from the logged-in user and the most recently saved address", () => {
    useCartStore.getState().addItem(327, 1, false);
    useAuthStore.setState({
      user: { id: 1, name: 'Jane', surname: 'Doe', email: 'jane@example.com' },
      isLoading: false,
    });
    useAddresses.mockReturnValue({
      data: [
        { id: 2, title: 'Office', firstline: '2 Office Pkwy', city: 'Garland', state: 'TX', zip: '75042', phone: '5559876543' },
        { id: 1, title: 'Warehouse', firstline: '1 Dock Rd', city: 'Dallas', state: 'TX', zip: '75201', phone: '5551234567' },
      ],
    });
    render(<CheckoutView />);

    expect(screen.getByLabelText('First name')).toHaveValue('Jane');
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
    // addresses[0] is the most recently added (useAddresses/getShippingprofiles
    // now returns newest-first - Task 9) - its fields prefill, not any other entry's.
    expect(screen.getByLabelText('Address')).toHaveValue('2 Office Pkwy');
    expect(useAddresses).toHaveBeenCalledWith({ enabled: true });
  });

  it('does not crash prefilling for a logged-in user with zero saved addresses', () => {
    useCartStore.getState().addItem(327, 1, false);
    useAuthStore.setState({ user: { id: 1, name: 'Jane', surname: 'Doe', email: 'jane@example.com' }, isLoading: false });
    useAddresses.mockReturnValue({ data: [] });
    render(<CheckoutView />);
    expect(screen.getByLabelText('First name')).toHaveValue('Jane');
    expect(screen.getByLabelText('Address')).toHaveValue('');
  });
});
