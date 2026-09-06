'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/lib/slugify';

// Asymmetric bento rhythm instead of a uniform grid: the first tile is a
// large feature block, the sixth spans two columns, the rest are standard
// squares. Keyed by index so the pattern stays stable across renders.
const SPAN_BY_INDEX = {
  0: 'sm:col-span-2 sm:row-span-2',
  5: 'sm:col-span-2',
};

function CategoryTile({ category, index }) {
  const categorySlug = slugify(category.name);

  return (
    <Link
      href={`/category/${categorySlug}`}
      className={`group flex flex-col ${SPAN_BY_INDEX[index] ?? ''}`}
    >
      <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-button-secondary-bg sm:aspect-auto">
        {category.image && (
          <Image
            src={category.image}
            alt=""
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute -bottom-6 -left-6 h-16 w-16 rotate-45 bg-ink" />
        <span className="absolute bottom-2 left-2 text-xs font-bold text-accent">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-text-primary">
        {category.name}
      </h3>
      <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
    </Link>
  );
}

export function CategoryShowcase() {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:auto-rows-[180px]">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={`aspect-square animate-pulse rounded-lg bg-button-secondary-bg sm:aspect-auto ${SPAN_BY_INDEX[index] ?? ''}`}
          />
        ))}
      </div>
    );
  }

  if (isError || !categories) {
    return <p className="text-sm text-text-muted">Categories unavailable.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:auto-rows-[180px] sm:[grid-auto-flow:dense]">
      {categories.map((category, index) => (
        <CategoryTile key={category.id} category={category} index={index} />
      ))}
    </div>
  );
}
