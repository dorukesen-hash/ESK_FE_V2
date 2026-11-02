'use client';

import {
  Download,
  MapPin,
  Truck,
  RotateCcw,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { StatusPill } from './StatusPill';
import {
  formatDate,
  formatOrderNumber,
  isCancelled,
  getItemRefundedQuantity,
} from './orderHelpers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function OrderDetailCard({ order }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  const items = order.orderitems ?? [];
  const shipment = order.shipment;
  const billing = order.billing;
  const cancelled = isCancelled(order);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
    0
  );
  const amountRefunded = Number(order.amountRefunded ?? 0);

  function addItemToCart(item) {
    if (!item.variant_id) return;
    addItem(item.variant_id, item.quantity || 1, false);
    openCartDrawer();
  }

  function reorderAll() {
    const reorderable = items.filter((item) => item.variant_id);
    reorderable.forEach((item) => addItem(item.variant_id, item.quantity || 1, false));
    if (reorderable.length > 0) openCartDrawer();
  }

  const hasReorderableItems = items.some((item) => item.variant_id);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">My Account</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Order {formatOrderNumber(order)}
            </h1>
            <StatusPill status={order.orderstatus?.name} />
          </div>
        </div>

        {hasReorderableItems && (
          <button
            type="button"
            onClick={reorderAll}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Reorder all items
          </button>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-6 border-y border-border py-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-text-muted">Placed</dt>
          <dd className="mt-1 font-medium text-text-primary">{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-text-muted">
            <Truck aria-hidden="true" className="h-3.5 w-3.5" />
            Tracking
          </dt>
          <dd className="mt-1 font-medium text-text-primary">
            {shipment?.carrier?.name && (
              <span className="text-text-muted">{shipment.carrier.name} · </span>
            )}
            {shipment?.tracking ?? order.trackingNumber ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Items</dt>
          <dd className="mt-1 font-medium text-text-primary">{items.length || '—'}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Total</dt>
          <dd className="mt-1 font-medium text-text-primary">
            {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
          </dd>
        </div>
      </dl>

      {amountRefunded > 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700">
          <RotateCcw aria-hidden="true" className="h-4 w-4 shrink-0" />
          {order.amountRemaining > 0
            ? `$${amountRefunded.toFixed(2)} refunded, $${Number(order.amountRemaining).toFixed(2)} remaining.`
            : `$${amountRefunded.toFixed(2)} refunded in full.`}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Items
          </h2>
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 font-medium">Price</th>
                  <th className="py-2 font-medium">Line total</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const refundedQuantity = getItemRefundedQuantity(item);
                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className="py-3 text-text-primary">
                        {item.title}
                        {item.code && (
                          <span className="block text-xs text-text-muted">SKU: {item.code}</span>
                        )}
                        {refundedQuantity > 0 && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-purple-700">
                            <RotateCcw aria-hidden="true" className="h-3 w-3" />
                            {refundedQuantity} of {item.quantity} refunded
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-text-muted">{item.quantity}</td>
                      <td className="py-3 text-text-muted">
                        {item.price != null ? `$${Number(item.price).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 text-text-muted">
                        $
                        {(Number(item.price ?? 0) * Number(item.quantity ?? 0)).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        {item.variant_id && (
                          <button
                            type="button"
                            onClick={() => addItemToCart(item)}
                            className="group inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                          >
                            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                            Add to cart
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-right text-sm text-text-muted">
            Items subtotal: <span className="font-semibold text-text-primary">${subtotal.toFixed(2)}</span>
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {shipment && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              Shipping address
            </h2>
            <address className="mt-2 not-italic text-sm text-text-primary">
              {shipment.name && <p>{shipment.name}</p>}
              {shipment.firstline && <p>{shipment.firstline}</p>}
              {shipment.secondline && <p>{shipment.secondline}</p>}
              <p>
                {[shipment.city, shipment.state, shipment.zip].filter(Boolean).join(', ')}
              </p>
            </address>
          </div>
        )}

        {billing && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              Billing address
            </h2>
            <address className="mt-2 not-italic text-sm text-text-primary">
              {billing.name && <p>{billing.name}</p>}
              {billing.firstline && <p>{billing.firstline}</p>}
              {billing.secondline && <p>{billing.secondline}</p>}
              <p>
                {[billing.city, billing.state, billing.zip].filter(Boolean).join(', ')}
              </p>
            </address>
          </div>
        )}
      </div>

      {API_URL && !cancelled && (
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={`${API_URL}/invoices/pdf/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download invoice
          </a>
          <a
            href={`${API_URL}/invoices/packing-slip/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download packing slip
          </a>
        </div>
      )}

      {cancelled && (
        <p className="mt-8 text-sm text-text-muted">
          Invoice and packing slip are not available for cancelled orders.
        </p>
      )}
    </>
  );
}
