import { AuthGuard } from '@/components/layout/AuthGuard';

export default function AccountLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 p-4">
          <p className="font-semibold">My Account</p>
        </header>
        <div className="flex-1 p-8">{children}</div>
      </div>
    </AuthGuard>
  );
}
