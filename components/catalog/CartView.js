'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
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
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.variantId}-${item.isPallet}`}
              className="h-24 animate-pulse rounded-lg bg-button-secondary-bg"
            />
          ))}
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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Cart</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Your Cart
      </h1>

      <ul className="mt-8 divide-y divide-border">
        {cartLines.map((line) => {
          const amount = lineTotal(line, line.quantity, line.isPallet);
          return (
            <li key={`${line.id}-${line.isPallet}`} className="flex gap-4 py-6">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-button-secondary-bg">
                {line.image && (
                  <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link
                  href={line.href}
                  className="text-sm font-semibold text-text-primary transition-colors hover:text-primary"
                >
                  {line.title}
                </Link>
                {line.sku && (
                  <p className="mt-0.5 text-xs text-text-muted">SKU: {line.sku}</p>
                )}
                {line.isPallet && (
                  <p className="mt-0.5 text-xs text-text-muted">Full pallet</p>
                )}
                <label className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                  Qty
                  <QuantityInput
                    value={line.quantity}
                    onChange={(quantity) => updateQuantity(line.id, quantity, line.isPallet)}
                    className="w-16 rounded border border-border px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>
              <div className="flex flex-col items-end justify-between">
                {amount != null && (
                  <p className="text-sm font-semibold text-text-primary">
                    ${amount.toFixed(2)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(line.id, line.isPallet)}
                  className="text-xs text-text-muted transition-colors hover:text-primary"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <span className="text-sm font-medium text-text-primary">Subtotal</span>
        <span className="text-lg font-bold text-text-primary">${subtotal.toFixed(2)}</span>
      </div>

      <Link
        href="/checkout"
        className="mt-6 flex h-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        Proceed to Checkout
      </Link>
    </main>
  );
}
