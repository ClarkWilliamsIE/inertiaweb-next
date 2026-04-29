'use client';

import React, { useState, useEffect } from 'react';
import Hero from '../components/hero';
import Projects from '../components/projects';
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
    { name: 'Team', id: '#team' },
    { name: 'Budget', id: '#budget' }
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
          <div className="grid lg:grid-cols-2 gap-32 items-center mb-32">
            <div className="relative">
              <div className="aspect-[4/5] bg-slate-900 rounded-[5rem] overflow-hidden border border-white/10 group shadow-2xl relative">
                <img 
                  src="/images/expandinside.jpg"
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
                MOMENTUM<br/><span className="text-slate-800">EDUCATION.</span>
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

          {/* Timeline Section */}
          <div className="max-w-6xl mx-auto bg-slate-900/50 p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-2xl">
            <h3 className="text-3xl md:text-5xl font-black mb-16 text-white font-heading tracking-tighter text-center uppercase italic">
              The Year-Long <span className="text-slate-700">Residency</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent font-black text-2xl font-heading shadow-lg">01</div>
                <h4 className="text-2xl font-bold text-white tracking-tight">Pre-Year Preparation</h4>
                <p className="text-slate-400 font-light leading-relaxed">
                  Collaboration with the host school to decide on a community-suitable project. The trailer is configured to suit, and our team up-skills to meet specific technological needs.
                </p>
              </div>
              <div className="space-y-6">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent font-black text-2xl font-heading shadow-lg">02</div>
                <h4 className="text-2xl font-bold text-white tracking-tight">During the Year</h4>
                <p className="text-slate-400 font-light leading-relaxed">
                  The project is integrated directly into the curriculum. The trailer serves as a dynamic classroom during school hours and an extracurricular hub for the wider community.
                </p>
              </div>
              <div className="space-y-6">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent font-black text-2xl font-heading shadow-lg">03</div>
                <h4 className="text-2xl font-bold text-white tracking-tight">Post-Residency</h4>
                <p className="text-slate-400 font-light leading-relaxed">
                  The final portion of the year is dedicated to training school staff, ensuring the community is fully set up to maintain the project and technology long-term.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ImpactSection />

      <Projects />

      {/* Governance/Team Section */}
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

      {/* Budget & Transparency Section */}
      <section id="budget" className="py-32 bg-slate-900 relative border-t border-white/5">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mb-20">
            <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-6">Financial Transparency</h3>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-heading mb-6">
              100% IMPACT. <span className="text-slate-600 italic uppercase">Zero Overhead.</span>
            </h2>
            <p className="text-xl text-slate-400 font-light leading-relaxed">
              Because our staff salaries are fully covered by our partnership with the Ministry of Education, <strong className="text-white">every single dollar</strong> of foundational funding goes directly toward world-class equipment and securing the 10-year lifespan of the project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {/* Budget Breakdown List */}
            <div className="space-y-8">
              <div className="border-b border-white/10 pb-6">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-white font-bold text-lg">Mobile Infrastructure</h4>
                  <span className="text-accent font-mono font-bold">$700,000</span>
                </div>
                <p className="text-slate-500 text-sm">62m² expandable Makerspace Trailer from the Netherlands & custom internal building.</p>
              </div>
              
              <div className="border-b border-white/10 pb-6">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-white font-bold text-lg">High-End Tech & Equipment</h4>
                  <span className="text-accent font-mono font-bold">$262,000</span>
                </div>
                <p className="text-slate-500 text-sm">CAD/CAM, 3D printers, CNC, computing arrays, electronics, and digital media gear.</p>
              </div>

              <div className="border-b border-white/10 pb-6">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-white font-bold text-lg">Cultural Implementation</h4>
                  <span className="text-accent font-mono font-bold">$20,000</span>
                </div>
                <p className="text-slate-500 text-sm">Ensuring cultural narratives and Te Reo Māori are foundational to the space.</p>
              </div>

              <div className="border-b border-white/10 pb-6">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-white font-bold text-lg">Decade-Long Sustainability Trust</h4>
                  <span className="text-accent font-mono font-bold">$301,500</span>
                </div>
                <p className="text-slate-500 text-sm">Dedicated trust for hardware upgrades, materials, and maintenance for Years 2 through 10.</p>
              </div>

              <div className="pb-6">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-white font-bold text-lg">Safety & Initial Admin</h4>
                  <span className="text-accent font-mono font-bold">$17,000</span>
                </div>
                <p className="text-slate-500 text-sm">Year 1 insurance, safety equipment, and software licenses.</p>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="flex items-center justify-center">
              <div className="w-full bg-slate-950 rounded-[3rem] p-12 text-center border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
                <p className="text-slate-500 text-xs font-black tracking-[0.3em] uppercase mb-4">Total Required Capital</p>
                <p className="text-6xl md:text-7xl font-black text-white font-heading tracking-tighter mb-6">$1.3M</p>
                <p className="text-accent font-medium uppercase tracking-widest text-sm">Guarantees 10 Years of Operation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner CTA & Funding Options */}
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
                  href="/Makertruck%20Proposal.pdf" 
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
                © {new Date().getFullYear()} INERTIA EDUCATION.<br/>
                AOTEAROA.
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
