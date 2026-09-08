'use client';

import Link from 'next/link';
import { Package, MapPin, FileText, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { StatusPill } from './StatusPill';
import { formatDate, formatOrderNumber } from './orderHelpers';

const quickLinks = [
  {
    href: '/account/orders',
    label: 'Orders',
    description: 'Track and review past orders.',
    icon: Package,
  },
  {
    href: '/account/addresses',
    label: 'Addresses',
    description: 'Manage saved shipping addresses.',
    icon: MapPin,
  },
  {
    href: '/account/invoices',
    label: 'Invoices',
    description: 'Download invoices and packing slips.',
    icon: FileText,
  },
];

export function AccountOverviewView() {
  const user = useAuthStore((state) => state.user);
  const { data: orders } = useAccountOrders();
  const recentOrders = (orders ?? []).slice(0, 3);

  return (
    <div>
      <div className="rounded-lg border border-border bg-accent-tint p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-text-muted">{user?.email}</p>
        {orders && (
          <p className="mt-3 text-sm font-medium text-text-primary">
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : `You have ${orders.length} order${orders.length === 1 ? '' : 's'} on file.`}
          </p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
              <Icon aria-hidden="true" className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-semibold text-text-primary">
              {label}
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              />
            </p>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Recent Orders</h2>
          {orders && orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              View all
            </Link>
          )}
        </div>

        {orders && recentOrders.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-border py-14 text-center">
            <ShoppingBag aria-hidden="true" className="h-7 w-7 text-accent" />
            <p className="mt-3 text-sm text-text-muted">No orders to show yet.</p>
            <Link
              href="/search"
              className="mt-3 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Browse products
            </Link>
          </div>
        )}

        {recentOrders.length > 0 && (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber ?? order.uniqueId}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-button-secondary-bg/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {formatOrderNumber(order)}
                    </p>
                    <p className="text-sm text-text-muted">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <StatusPill status={order.orderstatus?.name} />
                    <span className="font-semibold text-text-primary">
                      {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
