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
      <body>{children}</body>
    </html>
  );
}
