import Footer from '@/components/site/Footer';
import GetInvolved from '@/components/site/home/GetInvolved';
import HomeHero from '@/components/site/home/HomeHero';
import Mission from '@/components/site/home/Mission';
import Programmes from '@/components/site/home/Programmes';
import SiteNav from '@/components/site/SiteNav';
import Team from '@/components/site/Team';
import { HOME_NAV_LINKS, SHOW_TRUSTEES } from '@/content/site';

// Homepage: Inertia Education's wider social mission. Individual programmes
// (e.g. the Maker Truck at /maker-truck) have their own pages.
export default function Home() {
  return (
    <div className="min-h-screen relative bg-slate-950 selection:bg-accent selection:text-slate-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-6 focus:py-3 focus:bg-accent focus:text-slate-950 focus:font-black focus:rounded-full"
      >
        Skip to content
      </a>
      <SiteNav links={HOME_NAV_LINKS} cta={{ name: 'Get Involved', href: '#get-involved' }} />
      <main id="main">
        <HomeHero />
        <Mission />
        <Programmes />
        {/* Board of Trustees: switch on/off with SHOW_TRUSTEES in src/content/site.ts */}
        {SHOW_TRUSTEES && <Team />}
        <GetInvolved />
      </main>
      <Footer links={[...HOME_NAV_LINKS, { name: 'Maker Truck', href: '/maker-truck' }]} />
    </div>
  );
}
