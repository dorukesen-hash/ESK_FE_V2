import { CategoryView } from '@/components/catalog/CategoryView';

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;
  return <CategoryView categorySlug={categorySlug} />;
}
