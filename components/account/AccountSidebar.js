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

function getInitials(user) {
  if (user?.name) {
    return `${user.name[0]}${user.surname?.[0] ?? ''}`.toUpperCase();
  }
  return user?.email?.[0]?.toUpperCase() ?? '?';
}

export function AccountSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
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
    <aside className="lg:w-64 lg:shrink-0">
      <div className="lg:sticky lg:top-32">
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
            {getInitials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-text-primary">
              {user?.name ? `${user.name} ${user.surname ?? ''}`.trim() : 'Your Account'}
            </p>
            <p className="truncate text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1">
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
                  className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
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

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="mt-4 flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-button-secondary-bg hover:text-text-primary disabled:opacity-50"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </aside>
  );
}
