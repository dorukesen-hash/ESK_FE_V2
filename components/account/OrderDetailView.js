'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { OrderDetailCard } from './OrderDetailCard';

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
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to order history
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Back to order history
      </Link>

      <OrderDetailCard order={order} />
    </div>
  );
}
