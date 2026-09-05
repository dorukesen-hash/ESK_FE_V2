export default function SubcategoryPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">
        {params.categorySlug} / {params.subcategorySlug}
      </h1>
      <p className="text-slate-600">Product grid placeholder.</p>
    </main>
  );
}
