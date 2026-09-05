export default function CategoryPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Category: {params.categorySlug}</h1>
      <p className="text-slate-600">Subcategory/product listing placeholder.</p>
    </main>
  );
}
