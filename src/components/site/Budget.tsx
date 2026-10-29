export default function Budget() {
  return (
    <section id="budget" className="py-32 bg-slate-900 relative border-t border-white/5">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mb-16">
          <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-6">Financial Transparency</h3>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-heading mb-6">
            100% IMPACT. <span className="text-slate-600 italic uppercase">Zero HR Overhead.</span>
          </h2>
          <p className="text-xl text-slate-400 font-light leading-relaxed mb-10">
            We believe charitable donations should build capabilities, not just cover payroll. That's why our budget model is uniquely designed to maximize your impact.
          </p>
        </div>

        {/* MOE Partnership Callout */}
        <div className="bg-accent text-slate-950 rounded-[2.5rem] p-10 md:p-12 mb-20 shadow-2xl transform transition-transform hover:-translate-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4">Strategic Advantage</h4>
          <h3 className="text-3xl md:text-4xl font-black mb-4 font-heading tracking-tight">Ministry of Education Partnership</h3>
          <p className="text-lg md:text-xl font-medium opacity-90 leading-relaxed max-w-4xl">
            Our operational staff and educator salaries are entirely funded through a strategic partnership with the Ministry of Education. This guarantees that <strong className="font-black text-slate-950 underline decoration-slate-950/30 underline-offset-4">every single dollar</strong> of establishment funding is invested directly into tangible assets: the physical Makerspace, cutting-edge technology, and a secured 10-year operational runway for communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Budget Breakdown List */}
          <div className="space-y-8">
            <div className="border-b border-white/10 pb-6">
              <div className="flex justify-between items-end mb-2">
                <h4 className="text-white font-bold text-xl">Mobile Infrastructure & Fit-Out</h4>
                <span className="text-accent font-mono font-bold text-xl">$750,000</span>
              </div>
              <p className="text-slate-500">62m² expandable Makerspace Trailer from the Netherlands, complete custom internal building, and foundational cultural implementation.</p>
            </div>
        
            <div className="border-b border-white/10 pb-6">
              <div className="flex justify-between items-end mb-2">
                <h4 className="text-white font-bold text-xl">High-End Tech & Equipment</h4>
                <span className="text-accent font-mono font-bold text-xl">$350,000</span>
              </div>
              <p className="text-slate-500">CAD/CAM, 3D printers, CNC, computing arrays, digital media gear, and a secure allocation for a decade of technology upgrades and expendables.</p>
            </div>

            <div className="pb-6">
              <div className="flex justify-between items-end mb-2">
                <h4 className="text-white font-bold text-xl">Decade-Long Operations</h4>
                <span className="text-accent font-mono font-bold text-xl">$200,000</span>
              </div>
              <p className="text-slate-500">A dedicated 10-year runway covering comprehensive insurance, safety compliance, software licenses, and administrative overhead.</p>
            </div>
          </div>

          {/* Total Highlight */}
          <div className="flex items-center justify-center">
            <div className="w-full bg-slate-950 rounded-[3rem] p-12 text-center border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
              <p className="text-slate-500 text-xs font-black tracking-[0.3em] uppercase mb-4">Total Required Capital</p>
              <p className="text-6xl md:text-7xl font-black text-white font-heading tracking-tighter mb-6">$1.3M</p>
              <div className="inline-block bg-white/5 rounded-full px-6 py-3 border border-white/10">
                <p className="text-accent font-bold uppercase tracking-widest text-xs">Secures 10 Years of Operation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
