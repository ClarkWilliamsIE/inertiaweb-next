import { PILLARS } from '@/content/site';

// The organisation's broad social mission and the principles behind every programme.
export default function Mission() {
  return (
    <section id="mission" className="scroll-mt-24 py-32 md:py-40 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center mb-24">
          <div className="space-y-10">
            <h2 className="text-accent font-bold tracking-[0.4em] text-xs uppercase">Our Mission</h2>
            <p className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white font-heading">
              TALENT IS EVERYWHERE.<br/><span className="text-slate-700">OPPORTUNITY ISN&apos;T.</span>
            </p>
            <div className="h-1.5 w-40 bg-accent rounded-full"></div>
            <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-light">
              Inertia Education exists to break the structural barriers that hold young people back, whether those barriers come from cost, distance or a system that doesn&apos;t reflect who they are.
            </p>
            <p className="text-lg text-slate-500 leading-relaxed font-light">
              We design and run programmes that bring hands-on learning, real tools and genuine expertise to the communities that need them most, and we partner with schools, iwi, whānau and organisations to keep that momentum going.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] bg-slate-900 rounded-[4rem] md:rounded-[5rem] overflow-hidden border border-white/10 group shadow-2xl">
              <img
                loading="lazy"
                decoding="async"
                src="/images/eg1.jpg"
                alt="Students working together on a design project"
                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
              />
            </div>
          </div>
        </div>

        <h3 className="sr-only">What guides our work</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PILLARS.map((pillar, i) => (
            <article key={pillar.title} className="p-10 bg-slate-900/50 border border-white/5 rounded-[2.5rem] hover:border-accent/30 transition-all">
              <div aria-hidden="true" className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl mb-8 shadow-lg">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 font-heading tracking-tight">{pillar.title}</h4>
              <p className="text-slate-400 font-light leading-relaxed">{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
