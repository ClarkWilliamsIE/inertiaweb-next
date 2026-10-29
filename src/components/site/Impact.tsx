export default function Impact() {
  return (
    <section id="impact" className="py-32 relative z-10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
           <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-6">Our Core Focus</h3>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-heading">
              MEASURABLE <span className="text-slate-600 italic uppercase">IMPACT.</span>
           </h2>
        </div>
    
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {/* Impact 01 */}
          <div className="group rounded-[3rem] overflow-hidden bg-slate-900/50 border border-white/5 hover:border-accent/30 transition-all duration-500 shadow-xl">
            <div className="aspect-[4/3] overflow-hidden relative bg-slate-800">
              <img 
                src="/images/eg3.jpg" 
                alt="Equity in Engineering" 
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" 
              />
              <div className="absolute top-6 left-6 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl z-10 shadow-lg">01</div>
            </div>
            <div className="p-10">
              <h4 className="text-2xl font-bold text-white mb-4 font-heading tracking-tight">Equity in Engineering</h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Zip codes shouldn't define potential. We provide access to equipment typically reserved for private sector R&D labs directly to communities that need it most.
              </p>
            </div>
          </div>

          {/* Impact 02 */}
          <div className="group rounded-[3rem] overflow-hidden bg-slate-900/50 border border-white/5 hover:border-accent/30 transition-all duration-500 shadow-xl md:translate-y-12">
            <div className="aspect-[4/3] overflow-hidden relative bg-slate-800">
              <img 
                src="/images/eg2.jpg" 
                alt="Cultural Velocity" 
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" 
              />
              <div className="absolute top-6 left-6 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl z-10 shadow-lg">02</div>
            </div>
            <div className="p-10">
              <h4 className="text-2xl font-bold text-white mb-4 font-heading tracking-tight">Cultural Velocity</h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Innovation is in the DNA of Aotearoa. We combine modern engineering with traditional cultural practices and pūrakau to create unique, locally resonant learning opportunities.
              </p>
            </div>
          </div>

          {/* Impact 03 */}
          <div className="group rounded-[3rem] overflow-hidden bg-slate-900/50 border border-white/5 hover:border-accent/30 transition-all duration-500 shadow-xl">
            <div className="aspect-[4/3] overflow-hidden relative bg-slate-800">
              <img 
                src="/images/eg1.jpg" 
                alt="The Multiplier Effect" 
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" 
              />
              <div className="absolute top-6 left-6 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl z-10 shadow-lg">03</div>
            </div>
            <div className="p-10">
              <h4 className="text-2xl font-bold text-white mb-4 font-heading tracking-tight">The Multiplier Effect</h4>
              <p className="text-slate-400 font-light leading-relaxed">
                We don't just leave tech behind; we leave capability. By upskilling teachers and embedding sustainable resources, our year-long residencies empower schools to impact multiple future cohorts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
