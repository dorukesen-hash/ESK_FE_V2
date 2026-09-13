'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { CartDrawer } from './CartDrawer';
import { LoginPopover } from './LoginPopover';
import { HeaderSearch } from './HeaderSearch';

export function Header() {
  const user = useAuthStore((state) => state.user);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);
  const openLoginModal = useUIStore((state) => state.openLoginModal);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/esk-icon-mini.png"
            alt="ESK Packaging"
            width={28}
            height={18}
            className="h-6 w-auto sm:hidden"
          />
          <Image
            src="/esk-icon.png"
            alt="ESK Packaging"
            width={168}
            height={24}
            className="hidden h-7 w-auto sm:block"
          />
        </Link>

        <HeaderSearch />

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <Link
              href="/account"
              aria-label="Account"
              className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
            >
              <User aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              aria-label="Login"
              className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
            >
              <User aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-accent-tint hover:text-primary"
          >
            <ShoppingCart aria-hidden="true" className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <CartDrawer />
      <LoginPopover />
    </header>
  );
}
