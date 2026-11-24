import { TEAM } from '@/content/site';

// Board of Trustees section. To hide it, set SHOW_TRUSTEES = false in src/content/site.ts.
export default function Team() {
  return (
    <section id="team" aria-labelledby="team-heading" className="py-32 bg-slate-950 scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <p className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-8">Architects of Vision</p>
          <h2 id="team-heading" className="text-5xl md:text-7xl font-black tracking-tighter text-white italic uppercase font-heading">
            Built by <span className="text-slate-600">Experience</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {TEAM.map(member => (
            <article key={member.name} className="group bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 hover:bg-slate-900 transition-all hover:border-accent/20">
              <div className="relative mb-10">
                <div className="aspect-square rounded-[2rem] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 border border-white/10 relative">
                  <img src={member.image} alt={member.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div aria-hidden="true" className="absolute -bottom-4 -right-4 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg">
                  +
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-2 font-heading">{member.name}</h3>
              <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-6">{member.role}</p>
              <p className="text-slate-400 text-sm leading-relaxed font-light">{member.bio}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
