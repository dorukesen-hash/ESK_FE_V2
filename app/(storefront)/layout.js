import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-20">
        <Header />
        <Navbar />
      </div>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
