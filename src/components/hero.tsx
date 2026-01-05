'use client';

import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-950">
      {/* Background Visual */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/outsideview.jpg" 
          alt="Inertia Mobile Lab" 
          className="w-full h-full object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/40 to-slate-950"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl">
          <div className="flex items-center gap-4 mb-10">
            <span className="h-[2px] w-12 bg-accent"></span>
            <span className="text-accent font-bold tracking-[0.5em] text-[10px] uppercase">Momentum for Change</span>
          </div>
          
          <h1 className="text-7xl md:text-[9rem] font-black leading-[0.85] mb-10 tracking-tighter uppercase font-heading text-white">
            INERTIA<br/>
            <span className="text-accent">EDUCATION</span>
          </h1>
          
          <p className="text-2xl md:text-3xl font-light text-slate-300 mb-12 max-w-3xl leading-relaxed">
            Moving the barriers that keep brilliance stationary. A mobile innovation lab creating <span className="text-white font-medium italic underline decoration-accent underline-offset-8">equitable STEAM pathways</span> for Aotearoa's youth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <a href="#partner" className="px-12 py-6 bg-accent text-slate-950 font-black uppercase tracking-widest text-xs rounded-full transition-all hover:scale-105 hover:bg-sky-400 shadow-2xl shadow-sky-500/20 text-center">
              Partner with Us
            </a>
            <a href="#impact" className="px-12 py-6 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-full border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm text-center">
              The Mission
            </a>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-10 animate-bounce opacity-20 hidden md:block">
        <div className="flex items-center gap-4 text-white">
          <span className="text-[10px] font-black uppercase tracking-widest rotate-90 origin-left translate-y-12">Scroll</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;
