'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

function SearchForm({ className = '' }) {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.toString().trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full ${className}`} role="search">
      <label htmlFor="header-search" className="sr-only">
        Search products
      </label>
      <div className="relative w-full">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
        <input
          id="header-search"
          name="q"
          type="search"
          placeholder="Search packaging products..."
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </form>
  );
}

export function Header() {
  const user = useAuthStore((state) => state.user);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
        <Link href="/" className="shrink-0">
          <Image src="/esk-icon.png" alt="ESK Packaging" width={140} height={20} className="h-5 w-auto" />
        </Link>

        <SearchForm className="order-3 basis-full sm:order-none sm:basis-auto sm:flex-1" />

        <div className="ml-auto flex items-center gap-4">
          <Link
            href={user ? '/account' : '/login'}
            aria-label={user ? 'Account' : 'Login'}
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 text-text-primary hover:text-primary"
          >
            <User aria-hidden="true" className="h-5 w-5" />
            <span className="hidden text-sm sm:inline">{user ? 'Account' : 'Login'}</span>
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}
            className="relative flex min-h-11 min-w-11 items-center justify-center text-text-primary hover:text-primary"
          >
            <ShoppingCart aria-hidden="true" className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
