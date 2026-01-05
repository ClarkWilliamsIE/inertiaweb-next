import React from 'react';
import { PROJECTS } from '../constants.tsx'; // Adjust this import path if needed! 
// Note: If your PROJECTS are in src/constants.tsx, change line above to: import { PROJECTS } from '../constants';

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-40 bg-white text-slate-950 rounded-[4rem] md:rounded-[8rem] relative z-20 shadow-2xl">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
          <div className="max-w-3xl">
            <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-8">Proof of Impact</h3>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight font-heading">
              REAL PROJECTS.<br/><span className="text-slate-300 italic">RADICAL GROWTH.</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-sm text-lg font-light leading-relaxed">
            From mobile lab infrastructure to biomechanical analysis, we prove that high-end technology belongs in every community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Explicitly typed 'project' as any to bypass strict checks */}
          {PROJECTS.map((project: any, idx: number) => (
            <div key={idx} className="group flex flex-col bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-2 duration-500 hover:border-accent/20">
              <div className="aspect-square overflow-hidden relative">
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-all z-10"></div>
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-sm opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
              </div>
              
              <div className="p-8 flex-grow flex flex-col">
                <h4 className="text-xl font-black mb-4 group-hover:text-accent transition-colors font-heading">{project.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow font-light">{project.description}</p>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Curriculum</p>
                    <div className="flex flex-wrap gap-2">
                      {/* FIXED: Explicitly typed 'c' as string */}
                      {project.curriculum.map((c: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-white text-slate-700 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {/* FIXED: Explicitly typed 's' as string */}
                      {project.skills.map((s: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-sky-100 text-sky-700 text-[9px] font-black rounded-lg uppercase tracking-tighter">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
