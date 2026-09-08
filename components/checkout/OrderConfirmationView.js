'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useLastOrderStore } from '@/stores/lastOrderStore';

export function OrderConfirmationView({ orderNumber }) {
  const order = useLastOrderStore((state) => state.order);

  if (!order || String(order.orderNumber) !== String(orderNumber)) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          We couldn&apos;t find that order
        </h1>
        <p className="mt-2 text-text-muted">
          This page only shows the order right after you place it.
        </p>
        <Link href="/search" className="mt-4 inline-block text-primary hover:text-primary-hover">
          Continue shopping
        </Link>
      </main>
    );
  }

  const subtotal = (order.lines ?? []).reduce(
    (total, line) => total + (line.lineTotal ?? 0),
    0
  );
  const shippingPrice = order.shippingOption?.priceTotal ?? 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
        <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-accent" />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-accent">
        Order Confirmed
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Thank you for your order
      </h1>
      <p className="mt-2 text-text-muted">
        Order #{order.orderNumber} — a confirmation has been sent to your email.
      </p>

      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">
          Items
        </h2>
        <ul className="mt-4 space-y-2">
          {(order.lines ?? []).map((line) => (
            <li key={`${line.id}-${line.isPallet}`} className="flex justify-between text-sm">
              <span className="text-text-muted">
                {line.title} × {line.quantity}
              </span>
              <span className="text-text-primary">
                {line.lineTotal != null ? `$${line.lineTotal.toFixed(2)}` : '—'}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Subtotal</span>
            <span className="text-text-primary">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Shipping</span>
            <span className="text-text-primary">${shippingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary">${(subtotal + shippingPrice).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Link
        href="/search"
        className="mt-8 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
      >
        Continue shopping
      </Link>
    </main>
  );
}
