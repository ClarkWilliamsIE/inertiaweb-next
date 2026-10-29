import { TEAM } from '@/content/site';

export default function Team() {
  return (
    <section id="team" className="py-32 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-8">Architects of Vision</h3>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic uppercase font-heading">
            Built by <span className="text-slate-800">Experience</span>
          </h2>
        </div>
    
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {TEAM.map((member, i) => (
            <div key={i} className="group bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 hover:bg-slate-900 transition-all hover:border-accent/20">
              <div className="relative mb-10">
                <div className="aspect-square rounded-[2rem] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 border border-white/10 relative">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg">
                  +
                </div>
              </div>
              <h4 className="text-xl font-black text-white mb-2 font-heading">{member.name}</h4>
              <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-6">{member.role}</p>
              <p className="text-slate-500 text-sm leading-relaxed font-light">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
