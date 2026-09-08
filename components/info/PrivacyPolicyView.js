import { LegalPage, LegalSection } from './LegalPage';

export function PrivacyPolicyView() {
  return (
    <LegalPage
      kicker="Trust & Transparency"
      title="Privacy Policy"
      subtitle="How we collect, use, and safeguard your information."
    >
      <LegalSection>
        <p>
          At ESK Packaging LLC (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;), your privacy and trust are our highest priorities.
          This Privacy Policy explains how we collect, use, and safeguard your
          information when you visit our website or use our services. By
          using our website, you agree to these terms.
        </p>
      </LegalSection>

      <LegalSection title="1. Information We Collect">
        <p>We collect personal information that you voluntarily provide when you:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Place an order through our website</li>
          <li>Create an account or log in</li>
          <li>Subscribe to email communications</li>
          <li>Submit a contact form or reach out to customer service</li>
        </ul>
        <p>
          This may include your name, company, email address, shipping and
          billing address, phone number, and order history.
        </p>
        <p>
          We also automatically collect anonymous information through
          cookies, including your IP address, browser type, device data, and
          site activity. This helps us improve site performance and enhance
          your customer experience.
        </p>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Process and fulfill orders</li>
          <li>Provide order updates and shipment tracking</li>
          <li>Respond to customer service requests</li>
          <li>Analyze trends and optimize website performance</li>
          <li>Prevent fraud and ensure security</li>
          <li>Comply with applicable legal and tax obligations</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Payment Security and Processing">
        <p className="font-semibold text-text-primary">
          We do not store or retain any payment card details on our servers.
        </p>
        <p>
          All payments made through our website are processed securely via{' '}
          <strong className="text-text-primary">Stripe</strong>, a trusted,
          PCI-DSS-compliant payment processor. When you enter payment
          information at checkout, it is encrypted and transmitted directly
          to Stripe&apos;s secure platform, completely bypassing our systems.
        </p>
        <p>
          Stripe uses end-to-end encryption, tokenization, and fraud
          protection to keep your information safe. Learn more about
          Stripe&apos;s security at{' '}
          <a
            href="https://stripe.com/docs/security"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover"
          >
            stripe.com/docs/security
          </a>
          .
        </p>
        <p>
          By using our services, you authorize Stripe to process your payment
          and agree to their privacy and security terms.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-Party Services">
        <p>We partner with select trusted third-party providers to help run our business, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stripe (payment processing)</li>
          <li>FedEx, UPS, and common carriers (shipping)</li>
          <li>Email and CRM tools</li>
        </ul>
        <p>
          These partners access only the information necessary to perform
          their specific functions and must keep your data confidential.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies and Tracking">
        <p>
          Our website uses cookies to remember your preferences, monitor
          traffic, and improve usability. You may disable cookies in your
          browser settings, though this might limit your ability to use
          certain features.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain only information necessary for completing transactions
          and supporting customer accounts. You may request deletion of your
          data at any time by contacting{' '}
          <a href="mailto:sales@eskpackaging.com" className="text-primary hover:text-primary-hover">
            sales@eskpackaging.com
          </a>
          , unless we&apos;re legally required to retain it (for tax or
          regulatory compliance).
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p>
          California residents may request access to, correction of, or
          deletion of personal data we hold under the California Consumer
          Privacy Act (CCPA). We do not sell personal information.
        </p>
        <p>
          To make a request, email us at{' '}
          <a href="mailto:sales@eskpackaging.com" className="text-primary hover:text-primary-hover">
            sales@eskpackaging.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy">
        <p>
          Our services are not intended for children under 13. We do not
          knowingly collect personal information from minors. If you believe
          a child has provided personal data, please contact us for prompt
          deletion.
        </p>
      </LegalSection>

      <LegalSection title="9. Policy Updates">
        <p>
          This Privacy Policy may be updated periodically. Changes will be
          posted on this page with a new effective date. Your continued use
          of the website after updates constitutes acceptance of those
          changes.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
        <p>
          <strong className="text-text-primary">ESK Packaging LLC</strong>
          <br />
          <a href="mailto:sales@eskpackaging.com" className="text-primary hover:text-primary-hover">
            sales@eskpackaging.com
          </a>
          <br />
          2050 Forest Ln #350, Garland, TX 75042
        </p>
      </LegalSection>
    </LegalPage>
  );
}
