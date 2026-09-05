export default async function ProductVariantPage({ params }) {
  const { productSlug, variantId } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{productSlug}</h1>
      <p className="text-slate-600">Variant {variantId} detail placeholder.</p>
    </main>
  );
}
