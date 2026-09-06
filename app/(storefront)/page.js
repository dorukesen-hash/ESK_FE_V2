import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';

export default function HomePage() {
  return (
    <main>
      <HeroBanner />

      <section id="categories" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          Shop by category
        </h2>
        <p className="mt-2 text-text-muted">
          Browse our full catalog of industrial packaging supplies.
        </p>
        <div className="mt-8">
          <CategoryShowcase />
        </div>
      </section>
    </main>
  );
}
