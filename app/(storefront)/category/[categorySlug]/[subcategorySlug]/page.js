import { SubcategoryView } from '@/components/catalog/SubcategoryView';

export default async function SubcategoryPage({ params }) {
  const { categorySlug, subcategorySlug } = await params;
  return (
    <SubcategoryView categorySlug={categorySlug} subcategorySlug={subcategorySlug} />
  );
}
