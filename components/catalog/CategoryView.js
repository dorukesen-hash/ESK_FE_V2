'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCategoryDetail } from '@/hooks/useCategoryDetail';
import { Breadcrumbs } from './Breadcrumbs';

export function CategoryView({ categorySlug }) {
  const { data: category, isLoading, isError } = useCategoryDetail(categorySlug);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg"
            />
          ))}
        </div>
      </main>
    );
  }

  if (isError || !category) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-text-muted">
          We couldn&apos;t find that category.
        </p>
        <Link href="/search" className="mt-2 inline-block text-primary hover:text-primary-hover">
          Browse all products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: category.name }]} />

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        {category.name}
      </h1>
      <p className="mt-2 text-text-muted">
        {category.subcategories.length}{' '}
        {category.subcategories.length === 1 ? 'subcategory' : 'subcategories'}
      </p>

      {category.subcategories.length === 0 ? (
        <p className="mt-10 text-text-muted">No subcategories yet.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {category.subcategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              href={`/category/${categorySlug}/${subcategory.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg">
                {subcategory.image && (
                  <Image
                    src={subcategory.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-text-primary">
                {subcategory.name}
              </h3>
              <p className="text-xs text-text-muted">
                {subcategory.productCount}{' '}
                {subcategory.productCount === 1 ? 'product' : 'products'}
              </p>
              <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
