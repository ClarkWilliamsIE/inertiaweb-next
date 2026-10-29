// src/components/About.tsx
export default function About() {
  return (
    <section id="about" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column: Core Mission */}
          <div>
            <h2 className="text-4xl font-black mb-8 text-inertia-dark tracking-tight">
              About Us
            </h2>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed font-light">
              Inertia Education is a not-for-profit organization dedicated to
              transforming curriculum delivery across all subject areas. Our
              unique approach involves collaborating with students, teachers,
              and communities to develop innovative educational projects within
              local contexts.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed font-light">
              By working closely with these stakeholders, we create tailored
              learning experiences that resonate with and reflect the needs of
              each community, ensuring that our programs are both impactful and
              sustainable.
            </p>
          </div>

          {/* Right Column: The Model & Timeline */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
            <h3 className="text-2xl font-black mb-8 text-slate-900">Our Year-Long Residency Model</h3>
            
            <ul className="space-y-8">
              <li className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 font-black text-lg">
                  01
                </div>
                <div>
                  <strong className="block text-lg font-bold text-slate-900 mb-2">Pre-Year Preparation</strong>
                  <p className="text-gray-600 leading-relaxed">
                    We collaborate with the host school ahead of time to decide on a highly relevant, ambitious project. The mobile trailer is configured to suit, and our team up-skills to meet the community's specific technical needs.
                  </p>
                </div>
              </li>
              
              <li className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 font-black text-lg">
                  02
                </div>
                <div>
                  <strong className="block text-lg font-bold text-slate-900 mb-2">During the School Year</strong>
                  <p className="text-gray-600 leading-relaxed">
                    The interdisciplinary project is seamlessly integrated into multiple curriculum areas. The trailer serves as a dynamic classroom during school hours and opens up as an extracurricular hub for the wider community.
                  </p>
                </div>
              </li>

              <li className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 font-black text-lg">
                  03
                </div>
                <div>
                  <strong className="block text-lg font-bold text-slate-900 mb-2">Post-Residency Handover</strong>
                  <p className="text-gray-600 leading-relaxed">
                    Before we move to the next community, the final portion of the year is dedicated to training school staff. This ensures the school is fully equipped and capable of maintaining the project and the technology for years to come.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
