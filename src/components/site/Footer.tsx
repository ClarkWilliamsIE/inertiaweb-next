import Link from 'next/link';

import { CONTACT_EMAIL, LINKEDIN_URL, type NavLink } from '@/content/site';

export default function Footer({ links }: { links: NavLink[] }) {
  return (
    <footer className="py-24 border-t border-white/5 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
              <div aria-hidden="true" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-accent">I</div>
              <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase">INERTIA</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-loose">
              © {new Date().getFullYear()} INERTIA EDUCATION.<br/>
              AOTEAROA.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-12">
             {links.map(item => (
               <Link key={item.name} href={item.href} className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-white transition-colors">{item.name}</Link>
             ))}
          </nav>

          <div className="flex gap-6">
             <a
               href={`mailto:${CONTACT_EMAIL}`}
               aria-label={`Email us at ${CONTACT_EMAIL}`}
               className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-slate-950 transition-all text-slate-400"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
             </a>
             {LINKEDIN_URL && (
               <a
                 href={LINKEDIN_URL}
                 target="_blank"
                 rel="noopener noreferrer"
                 aria-label="Inertia Education on LinkedIn"
                 className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-slate-950 transition-all text-slate-400"
               >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
               </a>
             )}
          </div>
        </div>
      </div>
    </footer>
  );
}
