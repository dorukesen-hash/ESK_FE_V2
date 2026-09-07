'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';

function SearchResultRow({ result }) {
  return (
    <li className="border-b border-border py-4">
      <Link
        href={result.href}
        className="text-sm font-semibold text-text-primary transition-colors hover:text-primary"
      >
        {result.title}
      </Link>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
        {result.sku && <span>SKU: {result.sku}</span>}
        <span>
          {result.categoryName} / {result.subcategoryName}
        </span>
      </div>
    </li>
  );
}

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const { data, isLoading, isError } = useSearch(initialQuery);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        {initialQuery ? `Search results for "${initialQuery}"` : 'All Products'}
      </h1>

      <form onSubmit={handleSubmit} role="search" className="mt-6">
        <label htmlFor="search-input" className="sr-only">
          Search products
        </label>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          />
          <input
            id="search-input"
            type="search"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search packaging products..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </form>

      <div className="mt-8">
        {isLoading && <p className="text-sm text-text-muted">Searching…</p>}
        {isError && <p className="text-sm text-text-muted">Search is unavailable right now.</p>}
        {data && (
          <>
            <p className="text-sm text-text-muted">
              {data.count} {data.count === 1 ? 'result' : 'results'}
            </p>
            {data.results.length === 0 ? (
              <p className="mt-4 text-text-muted">
                No results. Try a different search term.
              </p>
            ) : (
              <ul className="mt-2">
                {data.results.map((result) => (
                  <SearchResultRow key={result.id} result={result} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
