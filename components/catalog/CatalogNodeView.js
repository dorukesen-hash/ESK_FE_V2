'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useElementHeightVar } from '@/hooks/useElementHeightVar';
import {
  findNodeBySlug,
  findAncestors,
  canonicalPath,
  countDescendantVariants,
} from '@/lib/catalogNodeTree';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';
import { Breadcrumbs } from './Breadcrumbs';
import { VariantsTable } from './VariantsTable';
import { CategorySidebar } from './CategorySidebar';

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

export function CatalogNodeView({ path }) {
  const router = useRouter();
  const { data: tree, isLoading, isError } = useCatalogTree();
  const slug = path[path.length - 1];
  const node = tree ? findNodeBySlug(tree, slug) : null;
  // The sidebar lists every department, so its own content can be much
  // taller than any one category's actual page content. Measuring this
  // column's real height and capping the sidebar to it (CategorySidebar's
  // lg:max-h-[var(--category-content-height,none)]) is what stops the
  // sidebar from ever being the thing that decides how tall the page is -
  // lg:self-start below is what makes that measurement trustworthy: without
  // it, this column would itself stretch to match the grid row (which the
  // sidebar's own height also feeds into), feeding the inflated number
  // straight back into the cap.
  const contentRef = useElementHeightVar('--category-content-height');
  // Every subcategory card is the same height (aspect-square, driven by
  // its own width, not its content) - measuring just the first one gives
  // a real per-row height to build a "stay at least 2 rows tall" floor
  // from, instead of a guessed px/vw value that would drift the moment
  // the column widths or card text wrapping changed. Each card also
  // needs its own self-start (see below) for the same reason the
  // content column needs lg:self-start above: without it, the measured
  // card stretches to fill whatever min-height the measurement itself
  // just produced, doubling on every resize and running away (caught
  // this empirically - the height shot past 33,000,000px).
  const firstCardRef = useElementHeightVar('--category-card-height');

  useEffect(() => {
    if (!tree || !node) return;
    const canonical = canonicalPath(tree, node.id);
    if (canonical.join('/') !== path.join('/')) {
      router.replace(`/category/${canonical.join('/')}`);
    }
  }, [tree, node, path, router]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
          <div className="hidden lg:block" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isError || !tree || !node) {
    return (
      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <p className="text-text-muted">We couldn&apos;t find that category.</p>
        <Link href="/search" className="mt-2 inline-block text-primary hover:text-primary-hover">
          Browse all products
        </Link>
      </main>
    );
  }

  const ancestors = findAncestors(tree, node.id);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: `/category/${canonicalPath(tree, ancestor.id).join('/')}`,
    })),
    { label: node.name },
  ];

  const children = node.children ?? [];
  const variants = node.variants ?? [];

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <div className="hidden lg:block">
          <CategorySidebar tree={tree} currentNodeId={node.id} />
        </div>

        <div data-testid="category-main" ref={contentRef} className="lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            {ancestors[0]?.name ?? 'Category'}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            {node.name}
          </h1>

          {children.length > 0 && (
            <>
              <p className="mt-2 text-text-muted">
                {children.length} {children.length === 1 ? 'subcategory' : 'subcategories'}
              </p>
              <div className="mt-10 grid min-h-[calc(var(--category-card-height,0px)*2_+_1.5rem)] grid-cols-2 gap-6 sm:grid-cols-4">
                {children.map((child, index) => {
                  const image = nodeImage(child);
                  const productCount = countDescendantVariants(child);
                  return (
                    <Link
                      key={child.id}
                      ref={index === 0 ? firstCardRef : undefined}
                      href={`/category/${canonicalPath(tree, child.id).join('/')}`}
                      className="group flex flex-col self-start"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg">
                        {image && (
                          <Image
                            src={image}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 25vw, 50vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-text-primary">
                        {child.name}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {productCount} {productCount === 1 ? 'product' : 'products'}
                      </p>
                      <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {variants.length > 0 && (
            <>
              <p className="mt-10 text-text-muted">
                {variants.length} {variants.length === 1 ? 'product' : 'products'}
              </p>
              <div className="mt-4">
                <VariantsTable
                  variants={variants}
                  productSlug={slugify(node.name) || String(node.id)}
                  displayFields={node.displayFields}
                />
              </div>
            </>
          )}

          {children.length === 0 && variants.length === 0 && (
            <p className="mt-10 text-text-muted">Nothing here yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
