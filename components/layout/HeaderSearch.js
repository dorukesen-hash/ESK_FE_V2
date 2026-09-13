'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';

const MIN_QUERY_LENGTH = 3;
const PREVIEW_COUNT = 6;
const DEBOUNCE_MS = 300;

export function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const shouldPreview = debouncedValue.length >= MIN_QUERY_LENGTH;
  const { data, isLoading } = useSearch(debouncedValue, { enabled: shouldPreview });
  const showDropdown = open && shouldPreview;
  const previewResults = data?.results.slice(0, PREVIEW_COUNT) ?? [];

  function navigateToResults(query) {
    setOpen(false);
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigateToResults(value.trim());
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      // type="search" clears its value natively on Escape in Chromium/WebKit,
      // which re-fires onChange right after this handler closes the dropdown
      // and reopens it with the (now stale) debounced query. Suppress that.
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="header-search" className="sr-only">
          Search products
        </label>
        <div className="relative">
          <button
            type="submit"
            aria-label="Search"
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:text-primary"
          >
            <SearchIcon aria-hidden="true" className="h-4 w-4" />
          </button>
          <input
            id="header-search"
            name="q"
            type="search"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder="Search packaging products..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </form>

      {showDropdown && (
        <div className="animate-dropdown-in absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {isLoading && <p className="px-4 py-3 text-sm text-text-muted">Searching…</p>}

          {!isLoading && previewResults.length === 0 && (
            <p className="px-4 py-3 text-sm text-text-muted">
              No results for &quot;{debouncedValue}&quot;.
            </p>
          )}

          {!isLoading && previewResults.length > 0 && (
            <ul className="divide-y divide-border">
              {previewResults.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 transition-colors hover:bg-button-secondary-bg/40"
                  >
                    <p className="text-sm font-semibold text-text-primary">{result.title}</p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-text-muted">
                      {result.sku && <span>SKU: {result.sku}</span>}
                      <span>
                        {result.categoryName} / {result.subcategoryName}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && data && data.count > 0 && (
            <button
              type="button"
              onClick={() => navigateToResults(debouncedValue)}
              className="block w-full border-t border-border px-4 py-3 text-left text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              View all {data.count} results for &quot;{debouncedValue}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
