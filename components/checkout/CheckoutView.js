'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useLastOrderStore } from '@/stores/lastOrderStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useShippingOptions } from '@/hooks/useShippingOptions';
import { useCreatePaymentIntent } from '@/hooks/useCreatePaymentIntent';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { ShoppingBag } from 'lucide-react';
import { AddressForm } from './AddressForm';
import { PaymentSection } from './PaymentSection';
import { CheckoutStep } from './CheckoutStep';

function OrderSummary({ lines, shippingPrice }) {
  const subtotal = lines.reduce((total, line) => total + (line.lineTotal ?? 0), 0);
  const total = subtotal + (shippingPrice ?? 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div aria-hidden="true" className="h-1 bg-accent" />
      <div className="p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">
        Order Summary
      </h2>
      <ul className="mt-4 space-y-2">
        {lines.map((line) => (
          <li key={`${line.id}-${line.isPallet}`} className="flex justify-between text-sm">
            <span className="text-text-muted">
              {line.title} × {line.quantity}
            </span>
            <span className="text-text-primary">
              {line.lineTotal != null ? `$${line.lineTotal.toFixed(2)}` : '—'}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Subtotal</span>
          <span className="text-text-primary">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Shipping</span>
          <span className="text-text-primary">
            {shippingPrice != null ? `$${shippingPrice.toFixed(2)}` : 'Select a rate'}
          </span>
        </div>
        <div className="flex justify-between pt-2 text-base font-bold">
          <span className="text-text-primary">Total</span>
          <span className="text-text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Tax is calculated and confirmed at payment.
      </p>
      </div>
    </div>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const setLastOrder = useLastOrderStore((state) => state.setLastOrder);

  const { data: lines } = useVariantsByIds(cartItems.map((item) => item.variantId));
  const shippingMutation = useShippingOptions();
  const paymentIntentMutation = useCreatePaymentIntent();
  const orderMutation = useCreateOrder();

  const [address, setAddress] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderError, setOrderError] = useState(null);

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <ShoppingBag aria-hidden="true" className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-text-primary">
          Your cart is empty
        </h1>
        <Link
          href="/search"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          Browse products
        </Link>
      </main>
    );
  }

  const cartLines = (lines ?? []).map((line) => {
    const item = cartItems.find((i) => i.variantId === line.id);
    const quantity = item?.quantity ?? 1;
    const unitPrice =
      item?.isPallet && line.palletPrice != null ? line.palletPrice : line.price;
    return {
      ...line,
      quantity,
      isPallet: item?.isPallet ?? false,
      lineTotal: unitPrice != null ? unitPrice * quantity : null,
    };
  });

  async function handleAddressSubmit(values) {
    setAddress(values);
    setSelectedOption(null);
    setClientSecret(null);
    shippingMutation.mutate({
      recipient: {
        AddressLine: [values.addressLine],
        City: values.city,
        StateProvinceCode: values.state.toUpperCase(),
        PostalCode: values.postalCode,
      },
      items: cartItems,
    });
  }

  async function handleSelectShipping(option) {
    setSelectedOption(option);
    setClientSecret(null);
    const result = await paymentIntentMutation.mutateAsync({
      items: cartItems,
      shipping: { price: option.priceTotal },
    });
    setClientSecret(result.clientSecret);
  }

  async function handlePaymentConfirmed(paymentIntent) {
    setOrderError(null);
    try {
      // POST /orders expects a shape distinct from the shipping-options call
      // above: items key off `id` (not `variantId`) and carry a
      // server-comparable line-total `price`; recipient/billing use
      // firstline/city/state/zip, not the UPS-style AddressLine/City/
      // StateProvinceCode/PostalCode the rate-quote endpoint needs. Verified
      // against ESK_API's controller/orderController.js directly - the two
      // endpoints are genuinely inconsistent, not a guess.
      const order = await orderMutation.mutateAsync({
        billing: {
          firstname: address.firstName,
          lastname: address.lastName,
          email: address.email,
          phone: address.phone,
          firstline: address.addressLine,
          city: address.city,
          state: address.state.toUpperCase(),
          zip: address.postalCode,
        },
        items: cartLines.map((line) => ({
          id: line.id,
          quantity: line.quantity,
          price: line.lineTotal,
        })),
        recipient: {
          name: `${address.firstName} ${address.lastName}`,
          address: address.addressLine,
          firstline: address.addressLine,
          email: address.email,
          phone: address.phone,
          city: address.city,
          state: address.state.toUpperCase(),
          zip: address.postalCode,
        },
        shipping: {
          carrier: selectedOption.carrierName,
          price: selectedOption.priceTotal,
        },
        paymentIntent: { id: paymentIntent.id, amount: paymentIntent.amount },
      });
      // The raw Order model instance from the API isn't guaranteed to carry
      // its line items back (createOrder returns the bare Order row); attach
      // the client's own snapshot of what was purchased so the confirmation
      // page has reliable data regardless of the response shape.
      setLastOrder({ ...order, lines: cartLines, shippingOption: selectedOption });
      clearCart();
      router.push(`/order-confirmation/${order.orderNumber}`);
    } catch (error) {
      setOrderError(
        error?.response?.data?.message ??
          "We couldn't finalize your order. Please try again."
      );
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
        Almost There
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Checkout
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-8">
          <CheckoutStep number="1" title="Shipping Address">
            <AddressForm
              onSubmit={handleAddressSubmit}
              isSubmitting={shippingMutation.isPending}
            />
          </CheckoutStep>

          {shippingMutation.isSuccess && (
            <CheckoutStep number="2" title="Shipping Options">
              <div className="space-y-2">
                {shippingMutation.data.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    No shipping options are available for this address right now.
                  </p>
                ) : (
                  shippingMutation.data.map((option, index) => (
                    <label
                      key={`${option.carrierName}-${index}`}
                      className="flex items-center justify-between rounded-md border border-border p-3 text-sm transition-colors has-[:checked]:border-primary"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping-option"
                          checked={selectedOption === option}
                          onChange={() => handleSelectShipping(option)}
                          className="h-4 w-4 accent-accent"
                        />
                        {option.carrierName}
                      </span>
                      <span className="font-semibold text-text-primary">
                        {option.priceTotal != null ? `$${Number(option.priceTotal).toFixed(2)}` : '—'}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </CheckoutStep>
          )}

          {shippingMutation.isError && (
            <p className="text-sm text-red-600">
              We couldn&apos;t get shipping rates for that address. Please check it and try again.
            </p>
          )}

          {selectedOption && (
            <CheckoutStep number="3" title="Payment">
              <PaymentSection
                clientSecret={clientSecret}
                onConfirmed={handlePaymentConfirmed}
                isPlacingOrder={orderMutation.isPending}
              />
              {orderError && (
                <p className="mt-3 text-sm text-red-600">{orderError}</p>
              )}
            </CheckoutStep>
          )}
        </div>

        <div>
          <OrderSummary lines={cartLines} shippingPrice={selectedOption?.priceTotal ?? null} />
        </div>
      </div>
    </main>
  );
}
