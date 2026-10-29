// src/components/Support.tsx
export default function Support() {
  return (
    <section id="support" className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-6 text-inertia-dark">
          Partner With Us
        </h2>
        <p className="text-lg text-gray-700 mb-12 max-w-3xl">
          We rely on the generous support of donors and partners to make our vision a reality. Whether through financial contributions, providing resources, or partnering with us for projects, your support is invaluable.
        </p>

        {/* Community Appetite Section */}
        <div className="bg-sky-50 rounded-3xl p-8 mb-16 border border-sky-100 shadow-sm">
          <h3 className="text-2xl font-black mb-4 text-sky-900 tracking-tight">The Demand is Real</h3>
          <p className="text-sky-800 mb-4 leading-relaxed">
            There is an overwhelming community appetite for this initiative. Within just 24 hours of releasing our initial proposal, we received 5 years' worth of interest from principals wanting to be first. By the end of that week, we had over a decade's worth of interest from schools across the Wellington Region.
          </p>
          <p className="text-sky-800 font-semibold">
            Our challenge isn't finding host schools—it's prioritizing them. Your support allows us to meet this incredible demand.
          </p>
        </div>

        {/* Funding Options */}
        <h3 className="text-3xl font-bold mb-8 text-inertia-dark">Funding Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Option 1 */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-slate-300 transition-all shadow-sm flex flex-col">
            <h4 className="text-xl font-bold text-slate-500 mb-2 uppercase tracking-widest text-xs">Option 1</h4>
            <h5 className="text-2xl font-black mb-2">Sole Sponsor</h5>
            <p className="text-4xl font-black text-slate-900 mb-6">$1.3 Million</p>
            <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
              Take on the full sponsorship of the project. This funds a minimum of a decade of unique community-based education and establishes 10-30 different projects to leave in communities across the Wellington Region.
            </p>
            <p className="text-sm font-semibold text-gray-500 border-t pt-4">
              *Includes negotiable naming and branding rights for the makerspace. Your brand will be forever linked with a new generation of Aotearoa's creative tech experts.
            </p>
          </div>

          {/* Option 2 */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-slate-300 transition-all shadow-sm flex flex-col">
            <h4 className="text-xl font-bold text-slate-500 mb-2 uppercase tracking-widest text-xs">Option 2</h4>
            <h5 className="text-2xl font-black mb-2">Establishment Donor</h5>
            <p className="text-4xl font-black text-slate-900 mb-6">$100,000</p>
            <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
              Become one of 13 establishment donors needed to successfully launch this project and secure its future. This allows us to set up projects that continue impacting communities long after we move to the next school.
            </p>
            <p className="text-sm font-semibold text-gray-500 border-t pt-4">
              *Includes brand representation within the workspace and online, offering an excellent opportunity to connect with talented future employees.
            </p>
          </div>
        </div>

        {/* Option 3 */}
        <div className="bg-slate-900 text-white rounded-3xl p-10 text-center shadow-xl">
          <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest">Option 3</h4>
          <h5 className="text-3xl font-black mb-4">Strategic Partnerships</h5>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
            What can your organization offer to help make this successful? We are always looking for partners who can provide technical resources, cutting-edge tools, or professional expertise.
          </p>
          <a href="mailto:Clark@inertiaed.org" className="inline-block bg-white text-slate-900 font-bold py-4 px-8 rounded-full hover:bg-slate-100 transition-colors">
            Contact Clark@inertiaed.org
          </a>
        </div>

      </div>
    </section>
  );
}
