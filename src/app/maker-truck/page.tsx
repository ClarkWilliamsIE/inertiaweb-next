import type { Metadata } from 'next';

import Budget from '@/components/site/Budget';
import Footer from '@/components/site/Footer';
import Hero from '@/components/site/Hero';
import Impact from '@/components/site/Impact';
import Partner from '@/components/site/Partner';
import Projects from '@/components/site/Projects';
import SiteNav from '@/components/site/SiteNav';
import Vision from '@/components/site/Vision';
import { MAKER_TRUCK_NAV_LINKS } from '@/content/site';

const TITLE = 'The Maker Truck | Inertia Education';
const DESCRIPTION =
  "A mobile innovation lab creating equitable STEAM pathways for Aotearoa's youth. A programme of Inertia Education.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, images: ['/images/og.jpg'] },
  twitter: { title: TITLE, description: DESCRIPTION, images: ['/images/og.jpg'] },
};

// The Maker Truck: Inertia Education's mobile makerspace programme.
export default function MakerTruckPage() {
  return (
    <div className="min-h-screen relative bg-slate-950 selection:bg-accent selection:text-slate-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-6 focus:py-3 focus:bg-accent focus:text-slate-950 focus:font-black focus:rounded-full"
      >
        Skip to content
      </a>
      <SiteNav
        links={MAKER_TRUCK_NAV_LINKS}
        cta={{ name: 'Partner with Us', href: '#partner' }}
        section="Maker Truck"
      />
      <main id="main">
        <Hero />
        <Vision />
        <Impact />
        <Projects />
        <Budget />
        <Partner />
      </main>
      <Footer links={[{ name: 'Inertia Home', href: '/' }, ...MAKER_TRUCK_NAV_LINKS]} />
    </div>
  );
}
