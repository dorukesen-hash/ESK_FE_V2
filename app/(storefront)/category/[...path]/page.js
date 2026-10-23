import { CatalogNodeView } from '@/components/catalog/CatalogNodeView';

export default async function CatalogNodePage({ params }) {
  const { path } = await params;
  return <CatalogNodeView path={path} />;
}
