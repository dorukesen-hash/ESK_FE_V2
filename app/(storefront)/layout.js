import { Footer } from '@/components/layout/Footer';

export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 p-4">
        <p className="font-semibold">ESK Packaging</p>
      </header>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
