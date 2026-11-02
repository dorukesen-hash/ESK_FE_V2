import { ChromeStack } from '@/components/layout/ChromeStack';
import { Footer } from '@/components/layout/Footer';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AccountSidebar } from '@/components/account/AccountSidebar';

export default function AccountLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ChromeStack />

      <AuthGuard>
        <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          <div className="flex flex-col gap-8 lg:flex-row">
            <AccountSidebar />
            <div className="min-w-0 flex-1 pb-16">{children}</div>
          </div>
        </div>
      </AuthGuard>

      <Footer />
    </div>
  );
}
