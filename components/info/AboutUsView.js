export function AboutUsView() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
        Who We Are at ESK Packaging
      </h1>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-text-muted">
        <p>
          Established in 2021, ESK Packaging is more than a packaging materials
          supplier — we&apos;re your partner in delivering quality and value. We
          specialize in supplying businesses across the country with the highest
          quality industrial packaging materials.
        </p>
        <p>
          From humble beginnings in a small warehouse, we&apos;ve grown into a
          trusted supplier for businesses big and small across the nation. Our
          focus has always been on quality, affordability, and exceptional
          customer service. We&apos;re proud of the reputation we&apos;ve built
          and are committed to continually improving our products and services
          to better serve our customers.
        </p>
        <p>
          We offer a wide range of product lines, from strapping and stretch
          film through to edge &amp; corner protectors, tools, and accessories.
        </p>
      </div>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-text-primary">What Sets Us Apart</h2>
        <ul className="mt-4 space-y-4 text-sm text-text-muted">
          <li>
            <strong className="text-text-primary">Low Price Guarantee</strong>
            <p className="mt-1">
              We&apos;ll meet or beat any total order price for the identical
              product and quantity. Don&apos;t be misled by the &quot;free
              shipping&quot; some competitors offer — the freight costs are
              padded back into the price of the product.
            </p>
          </li>
          <li>
            <strong className="text-text-primary">Fast Shipping</strong>
            <p className="mt-1">
              Fast and reliable shipping on all orders. Most stock orders placed
              by 2:00 p.m. EST ship the very same day. If your order requires
              faster service, let us know.
            </p>
          </li>
          <li>
            <strong className="text-text-primary">100% Satisfaction Guarantee</strong>
            <p className="mt-1">
              If you&apos;re not 100% satisfied with your order, we accept
              returns within 30 days of the delivery date. Contact Customer
              Service and we&apos;ll help you arrange the return and provide a
              replacement. Non-defective returns are subject to a 15%
              restocking fee.
            </p>
          </li>
          <li>
            <strong className="text-text-primary">Quality Assurance</strong>
            <p className="mt-1">
              We understand that our customers&apos; trust hinges on the
              quality of our products. That&apos;s why quality assurance
              isn&apos;t just a process — it&apos;s a promise that every
              product we sell is designed and manufactured to meet the highest
              standards of performance and reliability.
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-text-primary">Mission</h2>
        <ul className="mt-4 space-y-4 text-sm text-text-muted">
          <li>
            <strong className="text-text-primary">Our Goal</strong>
            <p className="mt-1">
              To deliver high-quality, affordable products that meet your
              packaging needs.
            </p>
          </li>
          <li>
            <strong className="text-text-primary">Our Commitment</strong>
            <p className="mt-1">
              Our customer-centric approach is the backbone of our operations.
              We strive for excellence in everything we do, ensuring the best
              service, the best products, and the best prices.
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-text-primary">Get in Touch</h2>
        <p className="mt-2 text-sm text-text-muted">
          2050 Forest Ln #350, Garland, TX 75042
          <br />
          <a href="tel:+14699922447" className="hover:text-text-primary">
            469-992-2447
          </a>
          {' · '}
          <a href="mailto:sales@eskpackaging.com" className="hover:text-text-primary">
            sales@eskpackaging.com
          </a>
        </p>
      </section>
    </main>
  );
}
