'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { QuantityInput } from './QuantityInput';

function lineTotal(line, quantity, isPallet) {
  const unitPrice = isPallet && line.palletPrice != null ? line.palletPrice : line.price;
  return unitPrice != null ? unitPrice * quantity : null;
}

export function CartView() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const variantIds = items.map((item) => item.variantId);
  const { data: lines, isLoading, isError } = useVariantsByIds(variantIds);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <ShoppingBag aria-hidden="true" className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-text-primary">
          Your cart is empty
        </h1>
        <Link
          href="/search"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          Browse products
        </Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.variantId}-${item.isPallet}`}
                className="h-24 animate-pulse rounded-lg bg-button-secondary-bg"
              />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-lg bg-button-secondary-bg" />
        </div>
      </main>
    );
  }

  if (isError || !lines) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-text-muted">We couldn&apos;t load your cart right now.</p>
      </main>
    );
  }

  const linesByVariantId = new Map(lines.map((line) => [line.id, line]));
  const cartLines = items
    .map((item) => {
      const line = linesByVariantId.get(item.variantId);
      if (!line) return null;
      return { ...line, quantity: item.quantity, isPallet: item.isPallet };
    })
    .filter(Boolean);

  const subtotal = cartLines.reduce((total, line) => {
    const amount = lineTotal(line, line.quantity, line.isPallet);
    return total + (amount ?? 0);
  }, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Cart</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Your Cart
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <ul className="divide-y divide-border">
          {cartLines.map((line) => {
            const amount = lineTotal(line, line.quantity, line.isPallet);
            return (
              <li key={`${line.id}-${line.isPallet}`} className="flex gap-4 py-6 first:pt-0">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-button-secondary-bg">
                  {line.image && (
                    <Image src={line.image} alt="" fill sizes="96px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={line.href}
                      className="text-sm font-semibold text-text-primary transition-colors hover:text-primary"
                    >
                      {line.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(line.id, line.isPallet)}
                      aria-label={`Remove ${line.title} from cart`}
                      className="-mr-2.5 -mt-2.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-text-muted transition-colors hover:text-red-600"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                  {line.sku && (
                    <p className="mt-0.5 text-xs text-text-muted">SKU: {line.sku}</p>
                  )}
                  {line.isPallet && (
                    <p className="mt-0.5 text-xs text-text-muted">Full pallet</p>
                  )}
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs text-text-muted">
                      Qty
                      <QuantityInput
                        value={line.quantity}
                        onChange={(quantity) => updateQuantity(line.id, quantity, line.isPallet)}
                        className="h-9 w-16 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    {amount != null && (
                      <p className="text-sm font-semibold text-text-primary">
                        ${amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="helper-sticky lg:self-start">
          <div className="overflow-hidden rounded-lg border border-border">
            <div aria-hidden="true" className="h-1 bg-accent" />
            <div className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">
                Order Summary
              </h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-semibold text-text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Shipping and tax are calculated at checkout.
              </p>
              <Link
                href="/checkout"
                className="mt-6 flex h-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
