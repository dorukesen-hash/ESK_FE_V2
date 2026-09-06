import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
