'use client';

import { useQuery } from '@tanstack/react-query';
import { CATALOG_QUERY_KEY, fetchCatalog } from '@/hooks/useCategories';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';

// Homepage curation is admin-driven and open-ended - cap how many render
// here so the section can't grow into an unbounded page-length list if
// someone marks many variants featured. The grid itself has no bento-style
// spans, so any count below this still lays out safely; this is purely
// about keeping the homepage a reasonable length.
const FEATURED_LIMIT = 8;

function imageForProduct(product) {
  const url = product?.product_images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function imageForSubcategory(subcategory) {
  const url = subcategory.subcategory_images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function toFeaturedProduct(variant, { subcategory, product }) {
  const groupName = product?.name || subcategory.name;
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    price: variant.one_four_units ? Number(variant.one_four_units) : null,
    unit: variant.unit,
    position: variant.featured_position ?? 0,
    image: (product && imageForProduct(product)) || imageForSubcategory(subcategory),
    href: `/product/${slugify(groupName)}/${variant.id}`,
  };
}

function collectFeaturedProducts(categories) {
  const featured = [];

  for (const category of categories) {
    for (const subcategory of category.subcategories ?? []) {
      for (const variant of subcategory.variants ?? []) {
        if (variant.featured) {
          featured.push(toFeaturedProduct(variant, { subcategory }));
        }
      }
      for (const product of subcategory.products ?? []) {
        for (const variant of product.variants ?? []) {
          if (variant.featured) {
            featured.push(toFeaturedProduct(variant, { subcategory, product }));
          }
        }
      }
    }
  }

  return featured.sort((a, b) => a.position - b.position).slice(0, FEATURED_LIMIT);
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: fetchCatalog,
    select: collectFeaturedProducts,
    staleTime: 5 * 60 * 1000,
  });
}
