import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'ESK Packaging',
  description: 'Industrial packaging products storefront.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
