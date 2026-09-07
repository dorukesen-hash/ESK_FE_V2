import { AuthGuard } from '@/components/layout/AuthGuard';
import { AccountNav } from '@/components/account/AccountNav';

export default function AccountLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AccountNav />
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
