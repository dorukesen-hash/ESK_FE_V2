'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/lib/slugify';

export function CategoryShowcase() {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg"
          />
        ))}
      </div>
    );
  }

  if (isError || !categories) {
    return <p className="text-sm text-text-muted">Categories unavailable.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${slugify(category.name)}`}
          className="group relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg"
        >
          {category.image && (
            <Image
              src={category.image}
              alt=""
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
