import { OrderDetailView } from '@/components/account/OrderDetailView';

export default async function AccountOrderDetailPage({ params }) {
  const { orderNumber } = await params;
  return <OrderDetailView orderNumber={orderNumber} />;
}
