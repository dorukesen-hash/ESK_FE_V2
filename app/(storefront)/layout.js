import { ChromeStack } from '@/components/layout/ChromeStack';
import { Footer } from '@/components/layout/Footer';

export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ChromeStack />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
