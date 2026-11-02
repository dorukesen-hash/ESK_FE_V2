import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useLastOrderStore } from '@/stores/lastOrderStore';
import { OrderConfirmationView } from './OrderConfirmationView';

describe('OrderConfirmationView', () => {
  beforeEach(() => {
    useLastOrderStore.getState().clear();
  });

  it('shows a not-found message when there is no matching last order', () => {
    render(<OrderConfirmationView orderNumber="100001" />);
    expect(screen.getByText("We couldn't find that order")).toBeInTheDocument();
  });

  it('links to order lookup when no matching order is in local state', () => {
    render(<OrderConfirmationView orderNumber="100001" />);
    expect(screen.getByRole('link', { name: 'Look up your order' })).toHaveAttribute(
      'href',
      '/track-order'
    );
  });

  it('shows a not-found message when the order number does not match the stored order', () => {
    useLastOrderStore.getState().setLastOrder({ orderNumber: '100001', lines: [] });
    render(<OrderConfirmationView orderNumber="999999" />);
    expect(screen.getByText("We couldn't find that order")).toBeInTheDocument();
  });

  it('renders the order items and totals when the order number matches', () => {
    useLastOrderStore.getState().setLastOrder({
      orderNumber: '100001',
      lines: [
        { id: 327, title: 'Composite Strapping', sku: 'CC40/2', quantity: 2, lineTotal: 136, isPallet: false },
        { id: 405, title: 'Wire Buckle', sku: 'WB-100', quantity: 1, lineTotal: 5, isPallet: false },
      ],
      shippingOption: { carrierName: 'UPS Ground', priceTotal: 12.5 },
    });
    render(<OrderConfirmationView orderNumber="100001" />);

    expect(screen.getByText('Order #100001 — a confirmation has been sent to your email.')).toBeInTheDocument();
    expect(screen.getByText('Composite Strapping × 2')).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('SKU: WB-100')).toBeInTheDocument();
    // Line totals 136 and 5, subtotal 141, total with $12.50 shipping is
    // 153.50 - all distinct values, so each assertion is unambiguous.
    expect(screen.getByText('$136.00')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('$141.00')).toBeInTheDocument();
    expect(screen.getByText('$153.50')).toBeInTheDocument();
  });
});
