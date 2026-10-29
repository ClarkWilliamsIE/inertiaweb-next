'use client';

import { useEffect, useState } from 'react';

import { NAV_LINKS } from '@/content/site';

export default function SiteNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 py-6 px-6 ${isScrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5 py-4' : ''}`}>
      <div className="container mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">I</div>
          <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase">INERTIA</span>
        </a>
    
        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(link => (
            <a 
              key={link.name} 
              href={link.id} 
              className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-accent transition-all"
            >
              {link.name}
            </a>
          ))}
          <a href="#partner" className="px-8 py-3.5 bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-accent transition-all transform hover:scale-105 active:scale-95">
            Partner with Us
          </a>
        </div>
      </div>
    </nav>
  );
}
