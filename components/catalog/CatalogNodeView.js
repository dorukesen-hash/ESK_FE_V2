'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCatalogTree } from '@/hooks/useCatalogTree';
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

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

export function CatalogNodeView({ path }) {
  const router = useRouter();
  const { data: tree, isLoading, isError } = useCatalogTree();
  const slug = path[path.length - 1];
  const node = tree ? findNodeBySlug(tree, slug) : null;

  useEffect(() => {
    if (!tree || !node) return;
    const canonical = canonicalPath(tree, node.id);
    if (canonical.join('/') !== path.join('/')) {
      router.replace(`/category/${canonical.join('/')}`);
    }
  }, [tree, node, path, router]);

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

  if (isError || !tree || !node) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
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
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Breadcrumbs items={breadcrumbItems} />

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-accent">
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
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {children.map((child) => {
              const image = nodeImage(child);
              const productCount = countDescendantVariants(child);
              return (
                <Link
                  key={child.id}
                  href={`/category/${canonicalPath(tree, child.id).join('/')}`}
                  className="group flex flex-col"
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
            <VariantsTable variants={variants} productSlug={slugify(node.name)} />
          </div>
        </>
      )}

      {children.length === 0 && variants.length === 0 && (
        <p className="mt-10 text-text-muted">Nothing here yet.</p>
      )}
    </main>
  );
}
