import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentSection } from './PaymentSection';

// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is empty in this project's real
// .env.local today, so the "not configured" branch is the actual current
// production behavior, not a hypothetical - this is the meaningful case to
// cover without pulling in Stripe.js's iframe-dependent Elements internals.
describe('PaymentSection', () => {
  it('shows a clear notice instead of a broken payment form when no Stripe key is configured', () => {
    render(<PaymentSection clientSecret={null} onConfirmed={() => {}} isPlacingOrder={false} />);
    expect(
      screen.getByText(/Payment is not configured yet/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place Order' })).not.toBeInTheDocument();
  });
});
