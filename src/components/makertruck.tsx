// src/components/Makertruck.tsx
export default function Makertruck() {
  return (
    <section id="makertruck" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-inertia-dark">
          The Makertruck Project
        </h2>
        <p className="text-lg text-gray-700 mb-4">
          The Mobile Makerspace Initiative is a groundbreaking portable STEAM
          education platform that aims to transform the learning landscape in
          Aotearoa. By collaborating with partner schools during year‑long
          residencies, we develop ambitious, high‑tech, creative engineering
          projects that challenge students to acquire new skills and implement
          them.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          This initiative bridges the digital divide by providing access to
          cutting‑edge technology and learning experiences for students who may
          not have had the opportunity otherwise.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          By enhancing professional development for teachers and fostering a
          culture of innovation and curiosity, we pave the way for future
          leaders and problem‑solvers in Aotearoa. Our unique not‑for‑profit /
          MOE partnership model ensures sustainable funding and productive use
          of charity income.
        </p>

        {/* image gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div>
            <img
              src="/images/expandinside.jpg"
              alt="Inside the Makertruck"
              className="w-full rounded-lg shadow-md"
            />
            <p className="mt-2 text-center text-gray-600">Inside View</p>
          </div>
          <div>
            <img
              src="/images/outsideview.jpg"
              alt="Makertruck exterior"
              className="w-full rounded-lg shadow-md"
            />
            <p className="mt-2 text-center text-gray-600">Outside View</p>
          </div>
          <div>
            <img
              src="/images/truck2.png"
              alt="Makertruck rear"
              className="w-full rounded-lg shadow-md"
            />
            <p className="mt-2 text-center text-gray-600">Rear View</p>
          </div>
          <div>
            <img
              src="/images/Subtest.png"
              alt="Makertruck in action"
              className="w-full rounded-lg shadow-md"
            />
            <p className="mt-2 text-center text-gray-600">In Action</p>
          </div>
        </div>
      </div>
    </section>
  );
}
