import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AccountNav } from '@/components/account/AccountNav';

export default function AccountLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-10">
        <Header />
        <Navbar />
      </div>

      <AuthGuard>
        <AccountNav />
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </div>
      </AuthGuard>

      <Footer />
    </div>
  );
}
