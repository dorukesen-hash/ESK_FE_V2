import { LegalPage, LegalSection } from './LegalPage';

export function ShippingPolicyView() {
  return (
    <LegalPage
      kicker="Fast, Reliable Freight"
      title="Shipping Policy"
      subtitle="How your order moves from our dock to your door."
    >
      <LegalSection>
        <p>
          At ESK Packaging, we are committed to fast, reliable shipping. We
          process all orders within 1–2 business days after you receive your
          order confirmation email. Once your order ships, you&apos;ll
          receive a notification with tracking information. Please note that
          tracking details may take up to 48 hours to activate in the
          carrier&apos;s system.
        </p>
        <p>
          We ship via FedEx, UPS, or common carrier based on your
          order&apos;s size, weight, and destination. Our logistics team
          selects the most efficient shipping method for your specific
          needs. Special handling services — such as liftgate, residential
          delivery, or scheduled delivery — may incur additional charges,
          which will appear itemized on your invoice.
        </p>
        <p>
          Once your order is in transit, title and risk of loss transfer to
          you under our standard FOB Origin terms. We are not responsible for
          carrier-caused delays, loss, or damage after dispatch. If you
          receive visibly damaged goods, notify the delivery driver
          immediately and contact our support team within 48 hours. We may
          require photos and documentation to initiate a freight claim.
        </p>
        <p>
          If you haven&apos;t received your order within five business days
          of your shipping confirmation, please contact us at{' '}
          <a
            href="mailto:sales@eskpackaging.com"
            className="text-primary hover:text-primary-hover"
          >
            sales@eskpackaging.com
          </a>{' '}
          with your name and order number. We&apos;ll promptly investigate
          and resolve the issue.
        </p>
        <p>
          Shipping timelines are estimates that may vary due to carrier
          volume, weather, or other factors beyond our control. Nevertheless,
          we ensure all shipments leave our facilities promptly and securely.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
