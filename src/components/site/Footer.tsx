import { NAV_LINKS } from '@/content/site';

export default function Footer() {
  return (
    <footer className="py-24 border-t border-white/5 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-accent">I</div>
              <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase">INERTIA</span>
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest leading-loose">
              © {new Date().getFullYear()} INERTIA EDUCATION.<br/>
              AOTEAROA.
            </p>
          </div>
      
          <div className="flex flex-wrap justify-center gap-12">
             {NAV_LINKS.map(item => (
               <a key={item.name} href={item.id} className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-white transition-colors">{item.name}</a>
             ))}
          </div>
      
          <div className="flex gap-6">
             <a href="#" className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-slate-950 transition-all text-slate-500">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
