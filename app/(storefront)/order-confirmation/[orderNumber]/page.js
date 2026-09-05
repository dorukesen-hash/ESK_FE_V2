export default function OrderConfirmationPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Order {params.orderNumber} confirmed</h1>
      <p className="text-slate-600">Order confirmation placeholder.</p>
    </main>
  );
}
