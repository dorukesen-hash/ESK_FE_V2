'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { resolveImageUrl } from '@/lib/cdn';
import { canonicalPath } from '@/lib/catalogNodeTree';

// Asymmetric bento rhythm instead of a uniform grid: the first tile is a
// large 2x2 feature block, the sixth spans two columns, the rest are
// standard squares. Both spans are gated on having enough remaining tiles
// to fully fill the row/rows they reserve — with a 4-column grid, a 2x2
// tile needs >=4 more tiles to fill its two rows, and a 2-col-wide tile
// needs 2 more tiles after it to fill its own row. Below those thresholds
// the pattern is skipped entirely so the grid never renders a gap; it just
// falls back to a plain uniform grid. This keeps the layout safe as
// categories are added or removed from the catalog.
const FEATURE_MIN_COUNT = 5;
const WIDE_MIN_COUNT = 8;

function getSpanClass(index, total) {
  if (index === 0 && total >= FEATURE_MIN_COUNT) {
    return 'sm:col-span-2 sm:row-span-2';
  }
  if (index === 5 && total >= WIDE_MIN_COUNT) {
    return 'sm:col-span-2';
  }
  return '';
}

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

// Root nodes never had their own image in the legacy data model - borrow
// the first child's image, same fallback the old useCategories hook did
// for categories via their subcategories.
function tileImage(node) {
  return nodeImage(node) || (node.children ?? []).map(nodeImage).find(Boolean) || null;
}

function CategoryTile({ tree, node, index, total }) {
  const image = tileImage(node);

  return (
    <Link
      href={`/category/${canonicalPath(tree, node.id).join('/')}`}
      className={`group flex flex-col ${getSpanClass(index, total)}`}
    >
      <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-button-secondary-bg sm:aspect-auto">
        {image && (
          <Image
            src={image}
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
        {node.name}
      </h3>
      <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
    </Link>
  );
}

export function CategoryShowcase() {
  const { data: tree, isLoading, isError } = useCatalogTree();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg"
          />
        ))}
      </div>
    );
  }

  if (isError || !tree) {
    return <p className="text-sm text-text-muted">Categories unavailable.</p>;
  }

  if (tree.length === 0) {
    return <p className="text-sm text-text-muted">No categories available yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:auto-rows-[180px] sm:[grid-auto-flow:dense]">
      {tree.map((node, index) => (
        <CategoryTile key={node.id} tree={tree} node={node} index={index} total={tree.length} />
      ))}
    </div>
  );
}
