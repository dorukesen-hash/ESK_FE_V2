'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/lib/slugify';

export function Navbar() {
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <nav aria-label="Categories" className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <ul className="flex items-center gap-6 overflow-x-auto py-3 text-sm">
          {isLoading && (
            <li className="text-text-muted" aria-live="polite">
              Loading categories…
            </li>
          )}
          {isError && (
            <li className="text-text-muted" role="alert">
              Categories unavailable.
            </li>
          )}
          {categories?.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                href={`/category/${slugify(category.name)}`}
                className="whitespace-nowrap text-text-primary hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
