'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MapPin, FileText, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { useAuthStore } from '@/stores/authStore';

const links = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/invoices', label: 'Invoices', icon: FileText },
];

export function AccountNav() {
  const pathname = usePathname();
  const clearUser = useAuthStore((state) => state.clearUser);
  const logoutMutation = useLogout();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Cookies may already be gone; clear client state regardless.
    }
    // Don't also call router.push here: every /account route is wrapped
    // in AuthGuard, which already redirects to /login the instant `user`
    // goes null. A second, separately-timed navigation call from here
    // raced AuthGuard's and wasn't reliably last, sending logged-out
    // users to /login half the time and to / the other half. Let
    // AuthGuard own the redirect.
    clearUser();
  }

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <span className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.3em] text-accent sm:inline">
            My Account
          </span>

          <ul className="scrollbar-hide flex items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const isActive =
                link.href === '/account'
                  ? pathname === '/account'
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ink text-white'
                        : 'text-text-muted hover:bg-button-secondary-bg hover:text-text-primary'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </nav>
  );
}
