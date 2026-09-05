export default async function AccountOrderDetailPage({ params }) {
  const { orderNumber } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Order {orderNumber}</h1>
      <p className="text-slate-600">Order detail placeholder.</p>
    </div>
  );
}
