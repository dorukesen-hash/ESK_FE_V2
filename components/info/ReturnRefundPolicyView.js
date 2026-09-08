import { LegalPage, LegalSection } from './LegalPage';

export function ReturnRefundPolicyView() {
  return (
    <LegalPage
      kicker="100% Satisfaction Guarantee"
      title="Return & Refund Policy"
      subtitle="Not quite right? Here's how returns, restocking, and refunds work."
    >
      <LegalSection>
        <p>
          If you&apos;re not 100% satisfied with your order, we accept
          returns within 30 days of the delivery date. This page covers how
          returns and refunds work; our{' '}
          <a
            href="/terms-and-conditions"
            className="text-primary hover:text-primary-hover"
          >
            Terms and Conditions
          </a>{' '}
          govern the full sale.
        </p>
      </LegalSection>

      <LegalSection title="Starting a Return">
        <p>
          Email{' '}
          <a
            href="mailto:sales@eskpackaging.com"
            className="text-primary hover:text-primary-hover"
          >
            sales@eskpackaging.com
          </a>{' '}
          with your order number and return reason. We&apos;ll provide a
          Return Material Authorization (RMA) number and instructions — no
          goods may be returned without one, and the RMA number must appear
          on all return packaging and documentation.
        </p>
        <p>
          Returned items must be unused, in resalable condition, and in their
          original packaging. Custom or made-to-order items cannot be
          returned unless defective.
        </p>
      </LegalSection>

      <LegalSection title="Return Shipping and Restocking">
        <p>
          Customers are responsible for return shipping costs unless the item
          is defective or was shipped in error. A 15% restocking fee applies
          to non-defective returns.
        </p>
      </LegalSection>

      <LegalSection title="Damaged or Incorrect Shipments">
        <p>
          If you receive visibly damaged goods, notify the delivery driver
          immediately and contact us within 48 hours of delivery. We may
          require photos and documentation to process a freight claim or
          replacement — no restocking fee applies to defective or
          incorrectly shipped items.
        </p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>
          Refunds are processed within 7–10 business days after we inspect
          the returned items, back to your original payment method.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          Reach our team at{' '}
          <a
            href="mailto:sales@eskpackaging.com"
            className="text-primary hover:text-primary-hover"
          >
            sales@eskpackaging.com
          </a>{' '}
          or{' '}
          <a href="tel:+14699922447" className="text-primary hover:text-primary-hover">
            469-992-2447
          </a>{' '}
          and we&apos;ll help you sort it out.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
