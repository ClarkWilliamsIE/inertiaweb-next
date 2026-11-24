import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Inertia Education | Moving Barriers',
  description:
    "A not-for-profit moving the barriers that keep young people in Aotearoa from reaching their potential.",
  icons: {
    icon: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    title: 'Inertia Education | Moving Barriers',
    description: "A not-for-profit moving the barriers that keep young people in Aotearoa from reaching their potential.",
    images: ['/images/og.jpg'],
    type: 'website',
    locale: 'en_NZ',
    siteName: 'Inertia Education',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inertia Education | Moving Barriers',
    description: "A not-for-profit moving the barriers that keep young people in Aotearoa from reaching their potential.",
    images: ['/images/og.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NZ" className="motion-safe:scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
