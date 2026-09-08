'use client';

import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { StatusPill } from './StatusPill';

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
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">My Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Order history
      </h1>

      {isLoading && <p className="mt-6 text-sm text-text-muted">Loading orders…</p>}

      {isError && (
        <p className="mt-6 text-sm text-red-600" role="alert">
          We couldn&apos;t load your orders. Please try again later.
        </p>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
          <Package aria-hidden="true" className="h-8 w-8 text-accent" />
          <p className="mt-3 text-sm text-text-muted">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/search"
            className="mt-3 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Browse products
          </Link>
        </div>
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
              <tr
                key={order.id}
                className="border-b border-border transition-colors hover:bg-button-secondary-bg/40"
              >
                <td className="py-3 font-medium text-text-primary">
                  {order.orderNumber ?? order.uniqueId}
                </td>
                <td className="py-3 text-text-muted">{formatDate(order.createdAt)}</td>
                <td className="py-3">
                  <StatusPill status={order.orderstatus?.name} />
                </td>
                <td className="py-3 text-text-muted">
                  {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/account/orders/${order.orderNumber ?? order.uniqueId}`}
                    className="group inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    View
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    />
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
