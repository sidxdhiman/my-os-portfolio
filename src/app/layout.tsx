import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dev Lab — Sidharth\'s Portfolio',
  description: 'An interactive developer portfolio with live tools: PDF editor, whiteboard, neural eraser, and more.',
  keywords: ['portfolio', 'developer', 'lab', 'tools', 'Sidharth'],
  openGraph: {
    title: 'Dev Lab — Sidharth\'s Portfolio',
    description: 'Interactive developer portfolio with live tools.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
