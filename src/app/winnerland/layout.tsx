import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Public_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import './winnerland.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--wl-font-display', weight: ['500', '700', '800'] });
const text = Public_Sans({ subsets: ['latin'], variable: '--wl-font-text', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: { default: 'Winnerland', template: '%s | Winnerland' },
  description: 'The members’ fund dashboard.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1714' },
  ],
};

export default function WinnerlandLayout({ children }: { children: ReactNode }) {
  return <div className={`wl ${display.variable} ${text.variable}`}>{children}</div>;
}
