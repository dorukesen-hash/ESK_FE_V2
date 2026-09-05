export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Category: {categorySlug}</h1>
      <p className="text-slate-600">Subcategory/product listing placeholder.</p>
    </main>
  );
}
