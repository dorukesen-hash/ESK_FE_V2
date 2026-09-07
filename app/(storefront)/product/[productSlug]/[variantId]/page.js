import { ProductView } from '@/components/catalog/ProductView';

export default async function ProductVariantPage({ params }) {
  const { variantId } = await params;
  return <ProductView variantId={variantId} />;
}
