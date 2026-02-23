import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Laboratory OS — Sidharth\'s Digital Lab',
  description: 'An immersive portfolio OS with biometric access, neural eraser, and lab-grade developer tools.',
  keywords: ['portfolio', 'developer', 'laboratory', 'neural', 'OS', 'Sidharth'],
  openGraph: {
    title: 'Laboratory OS',
    description: 'Biometric access. Neural tools. Lab-grade portfolio.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
