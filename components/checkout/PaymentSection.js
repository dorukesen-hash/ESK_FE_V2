'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function PaymentForm({ onConfirmed, isPlacingOrder }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsConfirming(true);
    setError(null);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    setIsConfirming(false);

    if (confirmError) {
      setError(confirmError.message ?? 'Payment could not be confirmed.');
      return;
    }
    onConfirmed(paymentIntent);
  }

  const isBusy = isConfirming || isPlacingOrder;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || isBusy}
        className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isBusy ? 'Processing…' : 'Place Order'}
      </button>
    </form>
  );
}

export function PaymentSection({ clientSecret, onConfirmed, isPlacingOrder }) {
  if (!stripePromise) {
    return (
      <div role="alert" className="rounded-md border border-border bg-button-secondary-bg p-4 text-sm text-text-muted">
        Payment is not configured yet. Add a real Stripe publishable key to{' '}
        <code className="rounded bg-surface-elevated px-1">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        </code>{' '}
        to enable checkout.
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm onConfirmed={onConfirmed} isPlacingOrder={isPlacingOrder} />
    </Elements>
  );
}
