'use client';

import Link from 'next/link';
import { useSubcategoryProducts } from '@/hooks/useSubcategoryProducts';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductCard } from './ProductCard';

export function SubcategoryView({ categorySlug, subcategorySlug }) {
  const { data: subcategory, isLoading, isError } = useSubcategoryProducts(
    categorySlug,
    subcategorySlug
  );

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

  if (isError || !subcategory) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-text-muted">We couldn&apos;t find that subcategory.</p>
        <Link href="/search" className="mt-2 inline-block text-primary hover:text-primary-hover">
          Browse all products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: subcategory.categoryName, href: `/category/${categorySlug}` },
          { label: subcategory.name },
        ]}
      />

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-accent">
        {subcategory.categoryName}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        {subcategory.name}
      </h1>
      <p className="mt-2 text-text-muted">
        {subcategory.products.length}{' '}
        {subcategory.products.length === 1 ? 'product' : 'products'}
      </p>

      {subcategory.products.length === 0 ? (
        <p className="mt-10 text-text-muted">No products in this subcategory yet.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {subcategory.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}

