export default function Vision() {
  return (
    <section id="vision" className="py-40 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-32 items-center mb-32">
          <div className="relative">
            <div className="aspect-[4/5] bg-slate-900 rounded-[5rem] overflow-hidden border border-white/10 group shadow-2xl relative">
              <img 
                src="/images/expandinside.jpg"
                alt="Inertia in Action" 
                className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 p-12 bg-accent rounded-[3.5rem] text-slate-950 shadow-2xl z-20">
              <div className="text-6xl font-black italic tracking-tighter mb-2 font-heading">10Y</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Strategic Roadmap</p>
            </div>
          </div>
      
          <div className="space-y-12">
            <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase">The Movement</h3>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-white font-heading">
              MOMENTUM<br/><span className="text-slate-800">EDUCATION.</span>
            </h2>
            <div className="h-1.5 w-40 bg-accent rounded-full"></div>
            <p className="text-2xl text-slate-400 leading-relaxed font-light">
              Talent is everywhere, but opportunity is often stationary. We bridge the structural divide by bringing a professional engineering environment directly to the school gates.
            </p>
            <div className="pt-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <h4 className="text-3xl font-black text-white mb-2 font-heading">62m²</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent">Lab Space</p>
                </div>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <h4 className="text-3xl font-black text-white mb-2 font-heading">1yr</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent">Residency</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="max-w-6xl mx-auto bg-slate-900/50 p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-2xl">
          <h3 className="text-3xl md:text-5xl font-black mb-16 text-white font-heading tracking-tighter text-center uppercase italic">
            The Year-Long <span className="text-slate-700">Residency</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent font-black text-2xl font-heading shadow-lg">01</div>
              <h4 className="text-2xl font-bold text-white tracking-tight">Pre-Year Preparation</h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Collaboration with the host school to decide on a community-suitable project. The trailer is configured to suit, and our team up-skills to meet specific technological needs.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent font-black text-2xl font-heading shadow-lg">02</div>
              <h4 className="text-2xl font-bold text-white tracking-tight">During the Year</h4>
              <p className="text-slate-400 font-light leading-relaxed">
                The project is integrated directly into the curriculum. The trailer serves as a dynamic classroom during school hours and an extracurricular hub for the wider community.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent font-black text-2xl font-heading shadow-lg">03</div>
              <h4 className="text-2xl font-bold text-white tracking-tight">Post-Residency</h4>
              <p className="text-slate-400 font-light leading-relaxed">
                The final portion of the year is dedicated to training school staff, ensuring the community is fully set up to maintain the project and technology long-term.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
