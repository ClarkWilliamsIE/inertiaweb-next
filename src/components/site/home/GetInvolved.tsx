import Link from 'next/link';

import { CONTACT_EMAIL } from '@/content/site';

const WAYS = [
  {
    title: 'Fund the mission',
    description: 'Back our work as a whole, or direct your support to a specific programme such as the Maker Truck.',
  },
  {
    title: 'Partner with us',
    description: 'Schools, iwi, councils, businesses and community groups: help shape and host programmes where they are needed most.',
  },
  {
    title: 'Share your expertise',
    description: 'Engineers, makers, artists, educators and mentors: your skills and equipment can open doors for young people.',
  },
];

// Organisation-wide call to action (programme pages have their own partner sections).
export default function GetInvolved() {
  return (
    <section id="get-involved" className="scroll-mt-24 py-32 md:py-40 bg-accent text-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl md:text-[7rem] font-black tracking-tighter italic mb-8 uppercase font-heading">GET INVOLVED.</h2>
          <p className="text-2xl md:text-3xl max-w-4xl mx-auto font-medium opacity-90 leading-tight">
            Momentum is a team effort. There&apos;s a place for you in it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {WAYS.map(way => (
            <div key={way.title} className="bg-white/90 backdrop-blur-md p-10 rounded-[3rem] shadow-xl">
              <h3 className="text-2xl font-black font-heading mb-4 tracking-tight">{way.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">{way.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <a href={`mailto:${CONTACT_EMAIL}`} className="px-16 py-6 bg-slate-950 text-white font-black uppercase tracking-[0.3em] text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl">
            Contact Us
          </a>
          <Link href="/maker-truck#partner" className="px-16 py-6 border-2 border-slate-950/20 text-slate-950 font-black uppercase tracking-widest text-xs rounded-full hover:bg-slate-950/5 transition-all">
            Support the Maker Truck
          </Link>
        </div>
      </div>
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-black opacity-[0.03] select-none pointer-events-none italic tracking-tighter font-heading z-0">
        INERTIA
      </div>
    </section>
  );
}
