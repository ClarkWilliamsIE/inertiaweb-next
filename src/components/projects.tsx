import React from 'react';
import { PROJECTS } from '../constants';

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
          {PROJECTS.map((project, idx) => (
            <div key={idx} className="group flex flex-col bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              </div>
              <div className="p-8 flex-grow flex flex-col">
                <h4 className="text-xl font-black mb-4 group-hover:text-accent transition-colors font-heading">{project.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow font-light">{project.description}</p>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Curriculum</p>
                    <div className="flex flex-wrap gap-2">
                      {project.curriculum.map((c, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white text-slate-700 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((s, i) => (
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
