import { LegalPage, LegalSection } from './LegalPage';

export function TermsAndConditionsView() {
  return (
    <LegalPage
      title="Terms and Conditions of Sale and Website Use"
      meta={
        <>
          <p>Effective Date: July 10, 2025</p>
          <p>
            <strong className="text-text-primary">Company:</strong> ESK
            Packaging LLC (&quot;ESK,&quot; &quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;)
          </p>
        </>
      }
    >
      <LegalSection title="1. Legal Agreement and Acceptance">
        <p>
          These Terms and Conditions (&quot;Agreement&quot;) govern your
          access to and use of ESK&apos;s website and apply to all sales of
          goods and services by ESK to the Customer (&quot;you,&quot;
          &quot;your,&quot; or &quot;Buyer&quot;). This Agreement forms a
          legally binding contract between the parties and supersedes all
          prior proposals, communications, representations, or agreements,
          whether oral or written. No waiver, modification, or addition to
          this Agreement will be binding unless expressly agreed to in
          writing and executed by an authorized representative of ESK.
        </p>
        <p>
          By accessing the website or submitting an order to ESK, you
          acknowledge that you have read, understood, and agreed to be bound
          by this Agreement in its entirety.
        </p>
      </LegalSection>

      <LegalSection title="2. Order Acceptance, Modification, and Cancellation">
        <p>
          All quotations, proposals, and price lists issued by ESK are
          non-binding and subject to withdrawal or revision without notice.
          Orders submitted by Buyer are deemed offers to purchase and do not
          bind ESK until ESK provides written acknowledgment or begins
          performance. ESK reserves the right to reject, cancel, or limit
          quantities of any order, in whole or in part, at its sole
          discretion.
        </p>
        <p>
          Orders for custom-manufactured goods or goods not regularly stocked
          are non-cancellable and non-returnable upon acceptance.
          Modifications to confirmed orders must be submitted in writing and
          require express written consent from ESK to be binding.
        </p>
      </LegalSection>

      <LegalSection title="3. Prices, Taxes, and Payment Terms">
        <p>
          All prices are quoted in U.S. Dollars and exclude all applicable
          federal, state, and local taxes, freight charges, and other
          assessments unless expressly stated otherwise. All such amounts
          shall be paid by Buyer.
        </p>
        <p>
          Unless otherwise agreed in writing, payment terms are Net 30 days
          from invoice date for approved commercial accounts. All other
          orders require payment in full at the time of order. Past-due
          amounts accrue interest at 1.5% per month (18% annually) or the
          maximum permitted by law, whichever is less. Buyer is responsible
          for all collection costs, attorneys&apos; fees, and court expenses
          incurred by ESK in recovering overdue amounts.
        </p>
      </LegalSection>

      <LegalSection title="4. Delivery, Title, and Risk of Loss">
        <p>
          Delivery shall be FOB Origin from ESK&apos;s shipping facility
          unless otherwise stated. Title and risk of loss transfer to Buyer
          upon delivery to the carrier. Delivery dates provided by ESK are
          estimates only and not guaranteed. ESK is not liable for any delay
          in delivery or failure to perform due to causes beyond its
          reasonable control, including carrier delays, material shortages,
          strikes, labor disputes, natural disasters, force majeure events,
          or governmental actions.
        </p>
      </LegalSection>

      <LegalSection title="5. Returns, Claims, and Defective Goods">
        <p>
          No goods may be returned to ESK without prior written authorization
          and issuance of a Return Material Authorization (RMA) number.
          Returns must be initiated within thirty (30) days of receipt and
          must reference the RMA number on all packaging and documentation.
          Returned goods must be in new, unused, and resalable condition in
          their original packaging. Unauthorized returns will be refused. See
          our{' '}
          <a
            href="/return-refund-policy"
            className="text-primary hover:text-primary-hover"
          >
            Return &amp; Refund Policy
          </a>{' '}
          for full details.
        </p>
        <p>
          Claims for shortages, visible damage, or nonconforming products
          must be made in writing to ESK within forty-eight (48) hours of
          delivery and must include photographic evidence and documentation.
          Failure to notify ESK within this timeframe constitutes unqualified
          acceptance of the goods.
        </p>
      </LegalSection>

      <LegalSection title="6. Limited Warranty and Disclaimer">
        <p>
          ESK warrants solely that the goods sold will conform to the
          specifications set forth in the applicable invoice or product
          documentation at the time of shipment. This limited warranty
          extends for thirty (30) days from delivery.
        </p>
        <p className="font-semibold text-text-primary">
          This warranty is expressly made in lieu of all other warranties,
          express or implied, including without limitation any warranty of
          merchantability or fitness for a particular purpose, which are
          hereby disclaimed to the maximum extent permitted by law.
        </p>
        <p>
          Buyer&apos;s sole and exclusive remedy for breach of this warranty
          shall be, at ESK&apos;s option, repair or replacement of the
          defective goods, or credit not exceeding the original purchase
          price. Under no circumstances will ESK be liable for consequential,
          incidental, special, exemplary, or punitive damages of any kind.
        </p>
      </LegalSection>

      <LegalSection title="7. Online Accounts, Security, and Conduct">
        <p>
          If you register for an account on our website, you are responsible
          for maintaining the confidentiality of your login credentials and
          for all activity conducted under your account. You agree to notify
          ESK immediately of any unauthorized access or use.
        </p>
        <p>
          You agree not to access or use the website for any unlawful,
          malicious, or disruptive activity, including introducing viruses or
          malware, attempting to access other user data, or interfering with
          website performance. ESK reserves the right to suspend or terminate
          accounts at any time for violation of these Terms or applicable
          law.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property Rights">
        <p>
          All content, materials, trade dress, logos, product designs,
          specifications, technical documentation, software code, and other
          intellectual property displayed or distributed via the website are
          the exclusive property of ESK or its licensors. No license is
          granted to use any intellectual property except as required for
          standard purchasing or informational activities.
        </p>
        <p>
          Reproduction, modification, distribution, or commercial
          exploitation of any content on this website without prior written
          authorization from ESK is strictly prohibited and may result in
          civil or criminal liability.
        </p>
      </LegalSection>

      <LegalSection title="9. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless ESK, its
          officers, directors, employees, affiliates, and agents from and
          against any liabilities, losses, damages, claims, demands, costs,
          and expenses (including reasonable attorneys&apos; fees) arising
          from your breach of this Agreement, your use of our website, or
          your misuse of our goods.
        </p>
      </LegalSection>

      <LegalSection title="10. Force Majeure">
        <p>
          ESK shall not be liable for any failure or delay in performing its
          obligations under this Agreement arising from acts, events,
          omissions, or accidents beyond its reasonable control, including
          strikes, lockouts, labor disturbances, natural disasters,
          pandemics, equipment failures, cyberattacks, supplier delays, or
          transportation breakdowns.
        </p>
      </LegalSection>

      <LegalSection title="11. Severability and Waiver">
        <p>
          If any provision of this Agreement is held invalid or unenforceable
          by a court of competent jurisdiction, such provision shall be
          severed from the Agreement, and the remainder shall remain in full
          force and effect. No waiver of any breach or default shall be
          deemed a waiver of any subsequent breach or default.
        </p>
      </LegalSection>

      <LegalSection title="12. Entire Agreement">
        <p>
          This Agreement constitutes the entire understanding between the
          parties and supersedes all prior discussions, agreements, or
          representations, whether oral or written. Any additional terms
          provided by Buyer on purchase orders or other documents are
          rejected unless separately negotiated and accepted in writing by an
          authorized officer of ESK.
        </p>
      </LegalSection>

      <LegalSection title="13. Notices">
        <p>
          All notices required under this Agreement shall be in writing and
          shall be deemed given when delivered by hand, certified mail, or
          email with confirmation, to:
        </p>
        <p>
          <strong className="text-text-primary">ESK Packaging LLC</strong>
          <br />
          2050 Forest Ln #350, Garland, TX 75042
          <br />
          <a
            href="mailto:sales@eskpackaging.com"
            className="text-primary hover:text-primary-hover"
          >
            sales@eskpackaging.com
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
