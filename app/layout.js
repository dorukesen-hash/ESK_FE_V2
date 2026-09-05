import './globals.css';

export const metadata = {
  title: 'ESK Packaging',
  description: 'Industrial packaging products storefront.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
