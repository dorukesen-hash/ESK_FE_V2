'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search } from 'lucide-react';
import { useOrderLookup } from '@/hooks/useOrderLookup';
import { OrderDetailCard } from '@/components/account/OrderDetailCard';
import { StatusPill } from '@/components/account/StatusPill';
import { formatDate, formatOrderNumber } from '@/components/account/orderHelpers';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  orderNumber: yup.string().optional(),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

function ResultsList({ orders, onSelect }) {
  return (
    <ul className="mt-6 divide-y divide-border">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between gap-4 py-4 text-sm">
          <div>
            <p className="font-medium text-text-primary">{formatOrderNumber(order)}</p>
            <p className="text-text-muted">{formatDate(order.createdAt)}</p>
          </div>
          <StatusPill status={order.orderstatus?.name} />
          <span className="text-text-primary">
            {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
          </span>
          <button
            type="button"
            onClick={() => onSelect(order)}
            className="font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            View
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TrackOrderView() {
  const lookupMutation = useOrderLookup();
  const [results, setResults] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchedOrderNumber, setSearchedOrderNumber] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setSelectedOrder(null);
    setSearchedOrderNumber(values.orderNumber ?? '');
    const orders = await lookupMutation.mutateAsync({
      email: values.email,
      orderNumber: values.orderNumber ?? '',
    });
    setResults(orders);
    if (orders.length === 1) setSelectedOrder(orders[0]);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Order Status</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Track your order
      </h1>
      <p className="mt-2 text-text-muted">
        Enter the email you used at checkout. If you have your order number too, add it to
        jump straight to that order.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input id="email" type="email" {...register('email')} className={fieldClass} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="orderNumber" className="text-sm font-medium text-text-primary">
            Order number (optional)
          </label>
          <input id="orderNumber" {...register('orderNumber')} className={fieldClass} />
        </div>

        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          {lookupMutation.isPending ? 'Searching…' : 'Find my order(s)'}
        </button>
      </form>

      {results && results.length === 0 && (
        <p className="mt-8 text-text-muted">
          We couldn&apos;t find any orders for that email
          {searchedOrderNumber ? ' matching that order number' : ''}.
        </p>
      )}

      {results && results.length > 1 && !selectedOrder && (
        <ResultsList orders={results} onSelect={setSelectedOrder} />
      )}

      {selectedOrder && (
        <div className="mt-8">
          {results && results.length > 1 && (
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              ← Back to results
            </button>
          )}
          <OrderDetailCard order={selectedOrder} />
        </div>
      )}
    </main>
  );
}
