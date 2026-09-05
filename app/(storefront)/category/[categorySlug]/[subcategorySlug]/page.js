export default async function SubcategoryPage({ params }) {
  const { categorySlug, subcategorySlug } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">
        {categorySlug} / {subcategorySlug}
      </h1>
      <p className="text-slate-600">Product grid placeholder.</p>
    </main>
  );
}
