'use client';

import { useQuery } from '@tanstack/react-query';
import { CATALOG_QUERY_KEY, fetchCatalog } from '@/hooks/useCategories';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';

function subcategoryImage(subcategory) {
  const url = subcategory.subcategory_images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function countVariants(subcategory) {
  const direct = subcategory.variants?.length ?? 0;
  const viaProducts = (subcategory.products ?? []).reduce(
    (total, product) => total + (product.variants?.length ?? 0),
    0
  );
  return direct + viaProducts;
}

function makeSelector(categorySlug) {
  return (categories) => {
    const category = categories.find((c) => slugify(c.name) === categorySlug);
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      subcategories: (category.subcategories ?? []).map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        slug: slugify(subcategory.name),
        image: subcategoryImage(subcategory),
        productCount: countVariants(subcategory),
      })),
    };
  };
}

export function useCategoryDetail(categorySlug) {
  return useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: fetchCatalog,
    select: makeSelector(categorySlug),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(categorySlug),
  });
}
