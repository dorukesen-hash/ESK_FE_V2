export default function ProductVariantPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{params.productSlug}</h1>
      <p className="text-slate-600">Variant {params.variantId} detail placeholder.</p>
    </main>
  );
}
