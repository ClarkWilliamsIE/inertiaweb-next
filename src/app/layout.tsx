import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: {
    default: 'Inertia Ed',
    template: '%s · Inertia Ed',
  },
  description: 'Hands on science and learning. Practical kits for classrooms across Aotearoa.',
  icons: { icon: '/favicon.ico' },
  metadataBase: new URL('https://inertiaed.org'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-surface text-ink antialiased">
        <div className="min-h-screen grid grid-rows-[auto,1fr,auto]">
          <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur border-b border-base-200">
            <div className="container flex items-center justify-between py-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-brand flex items-center justify-center text-white font-bold">IE</div>
                <span className="font-semibold tracking-tight">Inertia Ed</span>
              </Link>
              <nav className="hidden sm:flex items-center gap-3">
                <Link href="/#kits" className="navlink">Kits</Link>
                <Link href="/#how" className="navlink">How it works</Link>
                <Link href="/#impact" className="navlink">Impact</Link>
                <Link href="/#contact" className="btn btn-secondary">Contact</Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-base-200">
            <div className="container py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-brand text-white grid place-items-center font-bold">IE</div>
                  <div className="text-sm text-base-600">Inertia Ed, not for profit</div>
                </div>
                <div className="text-sm text-base-500">© {new Date().getFullYear()} Inertia Ed</div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
