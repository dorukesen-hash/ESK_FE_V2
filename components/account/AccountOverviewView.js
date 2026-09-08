'use client';

import Link from 'next/link';
import { Package, MapPin, FileText, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAccountOrders } from '@/hooks/useAccountOrders';

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

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">My Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
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
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <Icon aria-hidden="true" className="h-5 w-5 text-accent" />
            <p className="mt-3 flex items-center gap-1.5 font-semibold text-text-primary">
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
    </div>
  );
}
