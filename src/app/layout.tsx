'use client';

import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import Projects from '../components/Projects';
import ImpactSection from '../components/ImpactSection';
import Assistant from '../components/Assistant';
import { TEAM } from '../constants';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Mission', id: '#vision' },
    { name: 'Impact', id: '#impact' },
    { name: 'Projects', id: '#projects' },
    { name: 'Team', id: '#team' }
  ];

  return (
    <div className="min-h-screen relative bg-slate-950 selection:bg-accent selection:text-slate-950">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 py-6 px-6 ${isScrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5 py-4' : ''}`}>
        <div className="container mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">I</div>
            <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase">INERTIA</span>
          </a>
          
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
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

      <Hero />

      {/* Vision Section */}
      <section id="vision" className="py-40 relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="relative">
              <div className="aspect-[4/5] bg-slate-900 rounded-[5rem] overflow-hidden border border-white/10 group shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop" 
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
                MOMENTUM<br/><span className="text-slate-800">IS LIFE.</span>
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
        </div>
      </section>

      <ImpactSection />

      <Projects />

      {/* Governance/Team Section */}
      <section id="team" className="py-40 bg-slate-950">
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

      {/* Partner CTA */}
      <section id="partner" className="py-40 bg-accent text-slate-950 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-6xl md:text-[10rem] font-black tracking-tighter italic mb-12 uppercase font-heading">PARTNER.</h2>
          <p className="text-2xl md:text-4xl max-w-4xl mx-auto font-medium mb-20 opacity-90 leading-tight">
            We are looking for strategic partners who value deep social impact over surface-level charity. Join the momentum.
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
             <a href="mailto:info@inertia.edu.nz" className="px-16 py-8 bg-slate-950 text-white font-black uppercase tracking-[0.3em] text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl">
               Become a Sponsor
             </a>
             <button className="px-16 py-8 border-2 border-slate-950/10 text-slate-950 font-black uppercase tracking-widest text-xs rounded-full hover:bg-slate-950/5 transition-all">
               Our Impact Vision
             </button>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25rem] font-black opacity-[0.03] select-none pointer-events-none italic tracking-tighter font-heading">
          INERTIA
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-24 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-accent">I</div>
                <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase">INERTIA</span>
              </div>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest leading-loose">
                © {new Date().getFullYear()} INERTIA EDUCATION INITIATIVE.<br/>
                HAWKE'S BAY, AOTEAROA.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-12">
               {navLinks.map(item => (
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

      <Assistant />
    </div>
  );
}
