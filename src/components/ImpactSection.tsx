
import React from 'react';

const ImpactSection: React.FC = () => {
  return (
    <section id="impact" className="py-40 relative">
      <div className="container mx-auto px-6">
        <div className="mb-32">
          <div className="max-w-4xl">
            <h3 className="text-accent font-bold tracking-[0.4em] text-xs uppercase mb-8">Structural Intervention</h3>
            <h2 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] mb-12 font-heading">
              BEYOND THE <span className="text-slate-800">WORKSHOP.</span>
            </h2>
            <p className="text-2xl md:text-4xl text-slate-400 font-light leading-relaxed">
              We don't do 'tours'. We do <span className="text-white font-medium">residencies.</span> One full year in each school, embedding innovation as a core identity rather than a field trip.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-24">
          <div className="space-y-8">
            <div className="text-7xl font-black text-white/5 tracking-tighter font-heading">01</div>
            <h4 className="text-2xl font-bold font-heading">Equity in Engineering</h4>
            <p className="text-slate-500 leading-relaxed">Zip codes shouldn't define potential. We provide access to equipment typically reserved for private sector R&D labs.</p>
          </div>
          <div className="space-y-8">
            <div className="text-7xl font-black text-white/5 tracking-tighter font-heading">02</div>
            <h4 className="text-2xl font-bold font-heading">Cultural Velocity</h4>
            <p className="text-slate-500 leading-relaxed">Innovation is in the DNA of Aotearoa. We combine modern engineering with Māori and Pasifika heritage to ignite pride.</p>
          </div>
          <div className="space-y-8">
            <div className="text-7xl font-black text-white/5 tracking-tighter font-heading">03</div>
            <h4 className="text-2xl font-bold font-heading">The Multiplier Effect</h4>
            <p className="text-slate-500 leading-relaxed">Every student trained becomes a mentor. We build a self-sustaining culture of 'making' that lasts a decade after we leave.</p>
          </div>
        </div>

        {/* Impact Quote */}
        <div className="mt-40 p-20 bg-slate-900 rounded-[5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-[120px]"></div>
          <blockquote className="relative z-10 text-center max-w-4xl mx-auto">
            <p className="text-3xl md:text-5xl font-medium text-white italic leading-snug mb-12">
              "We aren't just teaching kids how to code. We're teaching them that they are the <span className="text-accent not-italic font-black">architects</span> of the next Aotearoa."
            </p>
            <cite className="text-accent font-bold tracking-widest uppercase text-sm not-italic">— Theory of Change</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
