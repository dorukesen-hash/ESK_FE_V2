'use client';

import Link from 'next/link';
import { useAccountOrders } from '@/hooks/useAccountOrders';

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

export function OrdersListView() {
  const { data: orders, isLoading, isError } = useAccountOrders();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
        Order history
      </h1>

      {isLoading && <p className="mt-6 text-sm text-text-muted">Loading orders…</p>}

      {isError && (
        <p className="mt-6 text-sm text-red-600" role="alert">
          We couldn&apos;t load your orders. Please try again later.
        </p>
      )}

      {orders && orders.length === 0 && (
        <p className="mt-6 text-sm text-text-muted">
          You haven&apos;t placed any orders yet.
        </p>
      )}

      {orders && orders.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="py-2 font-medium">Order</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border">
                <td className="py-3 font-medium text-text-primary">
                  {order.orderNumber ?? order.uniqueId}
                </td>
                <td className="py-3 text-text-muted">{formatDate(order.createdAt)}</td>
                <td className="py-3 text-text-muted">
                  {order.orderstatus?.name ?? '—'}
                </td>
                <td className="py-3 text-text-muted">
                  {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/account/orders/${order.orderNumber ?? order.uniqueId}`}
                    className="font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
