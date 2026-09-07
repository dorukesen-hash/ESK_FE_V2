'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useAccountOrders } from '@/hooks/useAccountOrders';

const quickLinks = [
  { href: '/account/orders', label: 'Orders', description: 'Track and review past orders.' },
  { href: '/account/addresses', label: 'Addresses', description: 'Manage saved shipping addresses.' },
  { href: '/account/invoices', label: 'Invoices', description: 'Download invoices and packing slips.' },
];

export function AccountOverviewView() {
  const user = useAuthStore((state) => state.user);
  const { data: orders } = useAccountOrders();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-1 text-text-muted">{user?.email}</p>

      {orders && (
        <p className="mt-4 text-sm text-text-muted">
          {orders.length === 0
            ? "You haven't placed any orders yet."
            : `You have ${orders.length} order${orders.length === 1 ? '' : 's'} on file.`}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <p className="font-semibold text-text-primary">{link.label}</p>
            <p className="mt-1 text-sm text-text-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
