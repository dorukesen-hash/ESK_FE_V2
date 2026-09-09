'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { QuantityInput } from '@/components/catalog/QuantityInput';

export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartDrawerOpen);
  const closeCartDrawer = useUIStore((state) => state.closeCartDrawer);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const { data: lines } = useVariantsByIds(items.map((item) => item.variantId));
  const linesByVariantId = new Map((lines ?? []).map((line) => [line.id, line]));

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeCartDrawer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-20 flex h-full w-full max-w-sm flex-col bg-surface p-6 shadow-lg focus:outline-none">
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

          <div className="mt-6 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-text-muted">Your cart is empty.</p>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => {
                  const line = linesByVariantId.get(item.variantId);
                  return (
                    <li
                      key={`${item.variantId}-${item.isPallet}`}
                      className="flex items-center gap-3 border-b border-border pb-4"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-button-secondary-bg">
                        {line?.image && (
                          <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          {line?.title ?? `Item ${item.variantId}`}
                        </p>
                        {line?.sku && (
                          <p className="text-xs text-text-muted">SKU: {line.sku}</p>
                        )}
                        {item.isPallet && (
                          <p className="text-xs text-text-muted">Pallet</p>
                        )}
                        <label className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                          Qty
                          <QuantityInput
                            value={item.quantity}
                            onChange={(quantity) =>
                              updateQuantity(item.variantId, quantity, item.isPallet)
                            }
                            className="w-14 rounded border border-border px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId, item.isPallet)}
                        className="self-start text-xs text-text-muted transition-colors hover:text-primary"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/cart"
            onClick={closeCartDrawer}
            className="mt-6 flex min-h-11 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Go to Cart
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
