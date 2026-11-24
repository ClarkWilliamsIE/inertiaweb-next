// Homepage hero: Inertia Education as an organisation (not one programme).
export default function HomeHero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="/images/eg2.jpg"
          alt=""
          fetchPriority="high"
          className="w-full h-full object-cover opacity-45 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/50 to-slate-950"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl">
          <div className="flex items-center gap-4 mb-10">
            <span className="h-[2px] w-12 bg-accent"></span>
            <span className="text-accent font-bold tracking-[0.5em] text-[10px] uppercase">Momentum for Change</span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-[9rem] font-black leading-[0.85] mb-10 tracking-tighter uppercase font-heading text-white">
            INERTIA<br/>
            <span className="text-accent">EDUCATION</span>
          </h1>

          <p className="text-2xl md:text-3xl font-light text-slate-300 mb-12 max-w-3xl leading-relaxed">
            Moving the barriers that keep brilliance stationary. We&apos;re a not-for-profit making sure every young person in Aotearoa has a{' '}
            <span className="text-white font-medium italic underline decoration-accent underline-offset-8">real shot at their potential</span>, wherever they live.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <a href="#mission" className="px-12 py-6 bg-accent text-slate-950 font-black uppercase tracking-widest text-xs rounded-full transition-all hover:scale-105 hover:bg-sky-400 shadow-2xl shadow-sky-500/20 text-center">
              Our Mission
            </a>
            <a href="#programmes" className="px-12 py-6 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-full border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm text-center">
              Our Programmes
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
