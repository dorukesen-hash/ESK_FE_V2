'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/hooks/useLogout';
import { useAuthStore } from '@/stores/authStore';

const links = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/invoices', label: 'Invoices' },
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
    <nav className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-text-primary">My Account</span>
        <ul className="flex items-center gap-4">
          {links.map((link) => {
            const isActive =
              link.href === '/account'
                ? pathname === '/account'
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
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
        className="text-sm font-medium text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
      >
        {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
      </button>
    </nav>
  );
}
