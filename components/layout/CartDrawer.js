'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Truck, CheckCircle2, Tag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useValidateDiscountCode } from '@/hooks/useValidateDiscountCode';
import { QuantityInput } from '@/components/catalog/QuantityInput';

const FREE_SHIPPING_THRESHOLD = 2000;

function lineTotal(line, quantity, isPallet) {
  const unitPrice = isPallet && line.palletPrice != null ? line.palletPrice : line.price;
  return unitPrice != null ? unitPrice * quantity : null;
}

function FreeShippingBar({ subtotal }) {
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);
  const qualifies = remaining === 0;

  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
        {qualifies ? (
          <>
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-accent" />
            You&apos;ve unlocked free shipping
          </>
        ) : (
          <>
            <Truck aria-hidden="true" className="h-4 w-4 text-text-muted" />
            Add ${remaining.toFixed(2)} more for free shipping
          </>
        )}
      </p>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free shipping"
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-button-secondary-bg"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function CouponForm({ items }) {
  const discountCode = useCartStore((state) => state.discountCode);
  const applyDiscountCode = useCartStore((state) => state.applyDiscountCode);
  const clearDiscountCode = useCartStore((state) => state.clearDiscountCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const validateDiscountCode = useValidateDiscountCode();

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const result = await validateDiscountCode.mutateAsync({
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        discountCode: trimmed,
      });
      if (!result.applied) {
        setError(result.message ?? 'This code did not apply any discount.');
        return;
      }
      applyDiscountCode(result);
      setCode('');
    } catch (mutationError) {
      setError(mutationError?.response?.data?.message ?? 'Could not apply that code.');
    }
  }

  if (discountCode) {
    return (
      <div className="flex items-center justify-between rounded-md bg-accent-tint px-3 py-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-text-primary">
          <Tag aria-hidden="true" className="h-4 w-4 text-accent" />
          {discountCode.code} applied
        </span>
        <button
          type="button"
          onClick={clearDiscountCode}
          className="text-xs font-semibold text-text-muted transition-colors hover:text-red-600"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="cart-coupon" className="sr-only">
          Discount code
        </label>
        <input
          id="cart-coupon"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Discount code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'cart-coupon-error' : undefined}
          className="h-10 min-w-0 flex-1 rounded-md border border-border px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={validateDiscountCode.isPending || !code.trim()}
          className="h-10 shrink-0 rounded-md border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {validateDiscountCode.isPending ? 'Checking…' : 'Apply'}
        </button>
      </form>
      {error && (
        <p id="cart-coupon-error" role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartDrawerOpen);
  const closeCartDrawer = useUIStore((state) => state.closeCartDrawer);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const discountCode = useCartStore((state) => state.discountCode);

  const { data: lines } = useVariantsByIds(items.map((item) => item.variantId));
  const linesByVariantId = new Map((lines ?? []).map((line) => [line.id, line]));

  const subtotal = items.reduce((total, item) => {
    const line = linesByVariantId.get(item.variantId);
    if (!line) return total;
    return total + (lineTotal(line, item.quantity, item.isPallet) ?? 0);
  }, 0);
  const discountAmount = discountCode?.discountAmount ?? 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeCartDrawer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-black/40 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <Dialog.Content className="fixed right-0 top-0 z-20 flex h-full w-full max-w-sm flex-col bg-surface p-6 shadow-lg focus:outline-none data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Your Cart
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close cart"
              className="flex h-11 w-11 items-center justify-center text-text-muted transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {items.length > 0 && <FreeShippingBar subtotal={subtotal} />}

          <div className="mt-6 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-text-muted">Your cart is empty.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const line = linesByVariantId.get(item.variantId);
                  return (
                    <li
                      key={`${item.variantId}-${item.isPallet}`}
                      className="flex items-start gap-3 py-4 first:pt-0"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-button-secondary-bg">
                        {line?.image && (
                          <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-text-primary">
                            {line?.title ?? `Item ${item.variantId}`}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId, item.isPallet)}
                            aria-label={`Remove ${line?.title ?? 'item'} from cart`}
                            className="-mr-2.5 -mt-2.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-text-muted transition-colors hover:text-red-600"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                        {line?.sku && (
                          <p className="text-xs text-text-muted">SKU: {line.sku}</p>
                        )}
                        {item.isPallet && (
                          <p className="text-xs text-text-muted">Pallet</p>
                        )}
                        <label className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                          Qty
                          <QuantityInput
                            value={item.quantity}
                            onChange={(quantity) =>
                              updateQuantity(item.variantId, quantity, item.isPallet)
                            }
                            className="h-8 w-14 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border pt-4">
              <CouponForm items={items} />

              <div className="mt-4 flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-semibold text-text-primary">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="mt-1 flex justify-between text-sm text-green-700">
                  <span>Discount ({discountCode.code})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <p className="mt-1 text-xs text-text-muted">
                Shipping and tax are calculated at checkout.
              </p>
            </div>
          )}

          <Link
            href="/cart"
            onClick={closeCartDrawer}
            className="mt-4 flex h-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Go to Cart
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
