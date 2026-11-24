'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { NavLink } from '@/content/site';

interface SiteNavProps {
  links: NavLink[];
  // The highlighted button on the right of the menu.
  cta: NavLink;
  // Small label after the logo, e.g. the programme name on a programme page.
  section?: string;
}

export default function SiteNav({ links, cta, section }: SiteNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const solid = isScrolled || menuOpen;
  const close = () => setMenuOpen(false);

  return (
    <nav
      aria-label="Main"
      className={`fixed w-full z-50 transition-all duration-500 px-6 ${solid ? 'py-4 bg-slate-950/90 backdrop-blur-xl border-b border-white/5' : 'py-6'}`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-3" aria-label="Inertia Education home" onClick={close}>
            <div aria-hidden="true" className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">I</div>
            <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase">INERTIA</span>
          </Link>
          {section && (
            <span className="hidden sm:inline-block truncate border-l border-white/15 pl-4 text-[10px] font-black uppercase tracking-[0.3em] text-accent">
              {section}
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-10">
          {links.map(link => (
            <a
              key={link.name}
              href={link.href}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-accent transition-all"
            >
              {link.name}
            </a>
          ))}
          <a href={cta.href} className="px-8 py-3.5 bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-accent transition-all transform hover:scale-105 active:scale-95">
            {cta.name}
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(open => !open)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      <div id="mobile-menu" hidden={!menuOpen} className="md:hidden container mx-auto pt-6 pb-4">
        <div className="flex flex-col gap-1">
          {links.map(link => (
            <a
              key={link.name}
              href={link.href}
              onClick={close}
              className="py-3 text-xs font-black uppercase tracking-[0.4em] text-slate-300 hover:text-accent transition-colors"
            >
              {link.name}
            </a>
          ))}
          <a
            href={cta.href}
            onClick={close}
            className="mt-4 px-8 py-4 bg-accent text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full text-center"
          >
            {cta.name}
          </a>
        </div>
      </div>
    </nav>
  );
}
