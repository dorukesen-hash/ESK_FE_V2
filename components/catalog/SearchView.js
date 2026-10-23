'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { Button } from '@/components/ui/Button';
import { SearchFilters } from './SearchFilters';

function buildSearchUrl({ q, categoryId, subcategoryId }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoryId) params.set('categoryId', String(categoryId));
  if (subcategoryId) params.set('subcategoryId', String(subcategoryId));
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

function SearchResultRow({ result }) {
  return (
    <li className="transition-colors hover:bg-button-secondary-bg/40">
      <Link href={result.href} className="block rounded-md px-3 py-4">
        <p className="text-sm font-semibold text-text-primary">{result.title}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          {result.sku && <span>SKU: {result.sku}</span>}
          <span>
            {result.categoryName} / {result.subcategoryName}
          </span>
        </div>
      </Link>
    </li>
  );
}

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;
  const subcategoryId = searchParams.get('subcategoryId')
    ? Number(searchParams.get('subcategoryId'))
    : undefined;
  const [inputValue, setInputValue] = useState(initialQuery);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearch(
    initialQuery,
    { categoryId, subcategoryId }
  );
  const { data: tree } = useCatalogTree();

  const activeCategory = tree?.find((node) => node.id === categoryId);
  const activeSubcategory = activeCategory?.children?.find(
    (child) => child.id === subcategoryId
  );
  const activeFilterName = activeSubcategory?.name ?? activeCategory?.name;

  function handleSubmit(event) {
    event.preventDefault();
    router.push(buildSearchUrl({ q: inputValue.trim(), categoryId, subcategoryId }));
  }

  function handleSelectCategory(id) {
    const next = categoryId === id && !subcategoryId ? undefined : id;
    router.push(buildSearchUrl({ q: initialQuery, categoryId: next }));
  }

  function handleSelectSubcategory(parentCategoryId, id) {
    if (subcategoryId === id) {
      router.push(buildSearchUrl({ q: initialQuery }));
    } else {
      router.push(buildSearchUrl({ q: initialQuery, categoryId: parentCategoryId, subcategoryId: id }));
    }
  }

  function handleClearFilters() {
    router.push(buildSearchUrl({ q: initialQuery }));
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Catalog</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        {initialQuery ? `Search results for "${initialQuery}"` : 'All Products'}
      </h1>

      <form onSubmit={handleSubmit} role="search" className="mt-6 max-w-xl">
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

      <div className="mt-10 flex flex-col gap-10 lg:flex-row">
        <SearchFilters
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
          onClear={handleClearFilters}
        />

        <div className="min-w-0 flex-1">
          {isLoading && <p className="text-sm text-text-muted">Searching…</p>}
          {isError && <p className="text-sm text-text-muted">Search is unavailable right now.</p>}
          {data && (
            <>
              <p className="text-sm text-text-muted">
                {data.count} {data.count === 1 ? 'result' : 'results'}
                {activeFilterName && <> in {activeFilterName}</>}
              </p>
              {data.results.length === 0 ? (
                <p className="mt-4 text-text-muted">No results. Try a different search term.</p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {data.results.map((result) => (
                    <SearchResultRow key={result.id} result={result} />
                  ))}
                </ul>
              )}
              {hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
