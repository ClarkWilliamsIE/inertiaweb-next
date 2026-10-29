export default function Partner() {
  return (
    <section id="partner" className="py-40 bg-accent text-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
    
        <div className="text-center mb-20">
          <h2 className="text-6xl md:text-[8rem] font-black tracking-tighter italic mb-8 uppercase font-heading">PARTNER.</h2>
          <p className="text-2xl md:text-3xl max-w-4xl mx-auto font-medium opacity-90 leading-tight">
            We are looking for strategic partners who value deep social impact over surface-level charity.
          </p>
        </div>

        {/* Community Appetite Callout */}
        <div className="max-w-4xl mx-auto bg-slate-950 text-white rounded-[3rem] p-12 md:p-16 mb-24 text-center shadow-2xl transform hover:scale-[1.02] transition-transform">
          <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-8">The Demand is Real</h3>
          <p className="text-2xl md:text-3xl font-light leading-relaxed mb-6">
            Within <span className="font-bold text-accent">24 hours</span> of releasing our proposal, we received <span className="font-bold text-accent">5 years' worth</span> of interest from principals. 
          </p>
          <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
            By the end of the first week, we secured a full decade's worth of interest from Wellington schools. The problem won't be finding host schools—it will be prioritizing them.
          </p>
        </div>

        {/* Funding Tiers */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {/* Tier 1 */}
          <div className="bg-white/90 backdrop-blur-md p-10 md:p-12 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Option 1</p>
            <h4 className="text-3xl font-black font-heading mb-2">Sole Sponsor</h4>
            <p className="text-5xl lg:text-6xl font-black text-slate-950 mb-8 tracking-tighter">$1.3M</p>
            <p className="text-slate-600 mb-8 leading-relaxed font-medium flex-grow">
              Take on full sponsorship. Funds a decade of residencies (10-30 community projects) across the Wellington Region. 
            </p>
            <p className="text-sm font-bold text-slate-400 border-t border-slate-200 pt-6">
              *Includes naming rights for the makerspace. Your brand will be forever linked with a new generation of tech experts.
            </p>
          </div>
      
          {/* Tier 2 */}
          <div className="bg-white/90 backdrop-blur-md p-10 md:p-12 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Option 2</p>
            <h4 className="text-3xl font-black font-heading mb-2">Establishment Donor</h4>
            <p className="text-5xl lg:text-6xl font-black text-slate-950 mb-8 tracking-tighter">$100K</p>
            <p className="text-slate-600 mb-8 leading-relaxed font-medium flex-grow">
              Become one of 13 donors needed to successfully launch and secure the project's future. 
            </p>
            <p className="text-sm font-bold text-slate-400 border-t border-slate-200 pt-6">
              *Leaves a lasting legacy in each host community. Includes brand representation within the workspace and online.
            </p>
          </div>
        </div>

        {/* Strategic Partnerships & CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4">Option 3</h4>
          <h5 className="text-3xl font-black font-heading mb-6 tracking-tight">Strategic Partnerships</h5>
          <p className="text-xl mb-12 opacity-80 font-medium">
            Can your organization provide technical resources, tools (like CNC or 3D printers), or professional expertise? Let's talk.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
             <a href="mailto:clark@inertiaed.org" className="px-16 py-6 bg-slate-950 text-white font-black uppercase tracking-[0.3em] text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl">
               Contact Us
             </a>
             <a 
                href="/docs/makertruck-proposal.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-16 py-6 border-2 border-slate-950/20 text-slate-950 font-black uppercase tracking-widest text-xs rounded-full hover:bg-slate-950/5 transition-all"
              >
             Full Proposal PDF
          </a>
          </div>
        </div>

      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-black opacity-[0.03] select-none pointer-events-none italic tracking-tighter font-heading z-0">
        INERTIA
      </div>
    </section>
  );
}
