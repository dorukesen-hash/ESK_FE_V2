'use client';

import { useQuery } from '@tanstack/react-query';
import { CATALOG_TREE_QUERY_KEY, fetchCatalogTree } from '@/hooks/useCatalogTree';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';

// Homepage curation is admin-driven and open-ended - cap how many render
// here so the section can't grow into an unbounded page-length list if
// someone marks many variants featured.
const FEATURED_LIMIT = 8;

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function toFeaturedProduct(variant, node) {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    price: variant.one_four_units ? Number(variant.one_four_units) : null,
    unit: variant.unit,
    position: variant.featured_position ?? 0,
    image: nodeImage(node),
    href: `/product/${slugify(node.name)}/${variant.id}`,
  };
}

function collectFeaturedProducts(tree) {
  const featured = [];

  function walk(nodes) {
    for (const node of nodes) {
      for (const variant of node.variants ?? []) {
        if (variant.featured) {
          featured.push(toFeaturedProduct(variant, node));
        }
      }
      walk(node.children ?? []);
    }
  }
  walk(tree);

  return featured.sort((a, b) => a.position - b.position).slice(0, FEATURED_LIMIT);
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: CATALOG_TREE_QUERY_KEY,
    queryFn: fetchCatalogTree,
    select: collectFeaturedProducts,
    staleTime: 5 * 60 * 1000,
  });
}
