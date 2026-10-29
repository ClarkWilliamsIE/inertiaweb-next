import Budget from '@/components/site/Budget';
import Footer from '@/components/site/Footer';
import Hero from '@/components/site/Hero';
import Impact from '@/components/site/Impact';
import Partner from '@/components/site/Partner';
import Projects from '@/components/site/Projects';
import SiteNav from '@/components/site/SiteNav';
import Team from '@/components/site/Team';
import Vision from '@/components/site/Vision';

export default function Home() {
  return (
    <div className="min-h-screen relative bg-slate-950 selection:bg-accent selection:text-slate-950">
      <SiteNav />
      <Hero />
      <Vision />
      <Impact />
      <Projects />
      <Team />
      <Budget />
      <Partner />
      <Footer />
    </div>
  );
}
