import Link from 'next/link';

import { PROGRAMMES } from '@/content/site';

const Arrow = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

// Every programme Inertia Education runs. Add new ones in src/content/site.ts (PROGRAMMES).
export default function Programmes() {
  return (
    <section id="programmes" className="scroll-mt-24 py-32 md:py-40 bg-white text-slate-950 rounded-[4rem] md:rounded-[8rem] relative z-20 shadow-2xl">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-20">
          <div className="max-w-3xl">
            <p className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-8">Our Programmes</p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight font-heading">
              ONE MISSION.<br/><span className="text-slate-300 italic">MANY PATHWAYS.</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-sm text-lg font-light leading-relaxed">
            Each programme is a different way of moving the same barriers. Here&apos;s where our work is happening.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {PROGRAMMES.map(programme => (
            <Link
              key={programme.title}
              href={programme.href}
              className="group lg:col-span-2 grid md:grid-cols-2 bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-2 duration-500 hover:border-accent/30"
            >
              <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                <img
                  src={programme.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-110 transition-all duration-700"
                />
              </div>
              <div className="p-10 md:p-12 flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">{programme.status}</p>
                <h3 className="text-3xl md:text-4xl font-black font-heading tracking-tight mb-6">{programme.title}</h3>
                <p className="text-slate-600 leading-relaxed font-light mb-10 flex-grow">{programme.description}</p>
                <span className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-950 group-hover:text-accent transition-colors">
                  {programme.linkLabel}
                  <Arrow className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}

          {/* Open invitation: the organisation is bigger than any one programme. */}
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 p-10 md:p-12 flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">What&apos;s next</p>
            <h3 className="text-3xl font-black font-heading tracking-tight mb-6">More to come</h3>
            <p className="text-slate-600 leading-relaxed font-light mb-10 flex-grow">
              The Maker Truck is where we&apos;re starting, not where we stop. If you have a community need, an idea or resources that could open new pathways for young people, we&apos;d love to build the next programme with you.
            </p>
            <a href="#get-involved" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-950 hover:text-accent transition-colors">
              Start a conversation
              <Arrow />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
