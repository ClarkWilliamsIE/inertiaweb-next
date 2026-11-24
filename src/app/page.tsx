import Budget from '@/components/site/Budget';
import Footer from '@/components/site/Footer';
import Hero from '@/components/site/Hero';
import Impact from '@/components/site/Impact';
import Partner from '@/components/site/Partner';
import Projects from '@/components/site/Projects';
import SiteNav from '@/components/site/SiteNav';
import Team from '@/components/site/Team';
import Vision from '@/components/site/Vision';
import { SHOW_TRUSTEES } from '@/content/site';

export default function Home() {
  return (
    <div className="min-h-screen relative bg-slate-950 selection:bg-accent selection:text-slate-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-6 focus:py-3 focus:bg-accent focus:text-slate-950 focus:font-black focus:rounded-full"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Hero />
        <Vision />
        <Impact />
        <Projects />
        {/* Board of Trustees: switch on/off with SHOW_TRUSTEES in src/content/site.ts */}
        {SHOW_TRUSTEES && <Team />}
        <Budget />
        <Partner />
      </main>
      <Footer />
    </div>
  );
}
