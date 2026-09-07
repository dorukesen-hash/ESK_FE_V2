import { OrderConfirmationView } from '@/components/checkout/OrderConfirmationView';

export default async function OrderConfirmationPage({ params }) {
  const { orderNumber } = await params;
  return <OrderConfirmationView orderNumber={orderNumber} />;
}
