'use client';

import Link from 'next/link';
import { useAccountOrders } from '@/hooks/useAccountOrders';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function OrderDetailView({ orderNumber }) {
  const { data: orders, isLoading, isError } = useAccountOrders();

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading order…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        We couldn&apos;t load this order. Please try again later.
      </p>
    );
  }

  const order = orders?.find(
    (candidate) =>
      candidate.orderNumber === orderNumber || candidate.uniqueId === orderNumber
  );

  if (!order) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Order not found
        </h1>
        <p className="mt-2 text-text-muted">
          We couldn&apos;t find an order matching {orderNumber}.
        </p>
        <Link
          href="/account/orders"
          className="mt-4 inline-block text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          Back to order history
        </Link>
      </div>
    );
  }

  const items = order.orderitems ?? [];
  const shipment = order.shipment;
  const billing = order.billing;
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Order {order.orderNumber ?? order.uniqueId}
        </h1>
        <Link
          href="/account/orders"
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          Back to order history
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-text-muted">Placed</dt>
          <dd className="font-medium text-text-primary">{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Status</dt>
          <dd className="font-medium text-text-primary">{order.orderstatus?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Tracking</dt>
          <dd className="font-medium text-text-primary">
            {shipment?.tracking ?? order.trackingNumber ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Total</dt>
          <dd className="font-medium text-text-primary">
            {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
          </dd>
        </div>
      </dl>

      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Items
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Price</th>
                <th className="py-2 font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-3 text-text-primary">{item.title}</td>
                  <td className="py-3 text-text-muted">{item.quantity}</td>
                  <td className="py-3 text-text-muted">
                    {item.price != null ? `$${Number(item.price).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 text-text-muted">
                    $
                    {(Number(item.price ?? 0) * Number(item.quantity ?? 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-right text-sm text-text-muted">
            Items subtotal: <span className="font-semibold text-text-primary">${subtotal.toFixed(2)}</span>
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {shipment && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
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

      {API_URL && (
        <div className="mt-8 flex gap-4">
          <a
            href={`${API_URL}/invoices/pdf/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary"
          >
            Download invoice
          </a>
          <a
            href={`${API_URL}/invoices/packing-slip/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary"
          >
            Download packing slip
          </a>
        </div>
      )}
    </div>
  );
}
