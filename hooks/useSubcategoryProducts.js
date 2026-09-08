'use client';

import { useQuery } from '@tanstack/react-query';
import { CATALOG_QUERY_KEY, fetchCatalog } from '@/hooks/useCategories';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';

function imageForProduct(product) {
  const url = product?.product_images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function imageForSubcategory(subcategory) {
  const url = subcategory.subcategory_images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function toListing(variant, { subcategory, product }) {
  const groupName = product?.name || subcategory.name;
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    price: variant.one_four_units ? Number(variant.one_four_units) : null,
    unit: variant.unit,
    image: (product && imageForProduct(product)) || imageForSubcategory(subcategory),
    href: `/product/${slugify(groupName)}/${variant.id}`,
  };
}

function makeSelector(categorySlug, subcategorySlug) {
  return (categories) => {
    const category = categories.find((c) => slugify(c.name) === categorySlug);
    const subcategory = category?.subcategories?.find(
      (s) => slugify(s.name) === subcategorySlug
    );
    if (!category || !subcategory) return null;

    const products = [];
    for (const variant of subcategory.variants ?? []) {
      products.push(toListing(variant, { subcategory }));
    }
    for (const product of subcategory.products ?? []) {
      for (const variant of product.variants ?? []) {
        products.push(toListing(variant, { subcategory, product }));
      }
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      id: subcategory.id,
      name: subcategory.name,
      products,
    };
  };
}

export function useSubcategoryProducts(categorySlug, subcategorySlug) {
  return useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: fetchCatalog,
    select: makeSelector(categorySlug, subcategorySlug),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(categorySlug && subcategorySlug),
  });
}
