// src/components/About.tsx
export default function About() {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-inertia-dark">
          About Us
        </h2>
        <p className="text-lg text-gray-700 mb-4">
          Inertia Education is a not-for-profit organization dedicated to
          transforming curriculum delivery across all subject areas. Our
          unique approach involves collaborating with students, teachers,
          and communities to develop innovative educational projects within
          local contexts.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          By working closely with these stakeholders, we create tailored
          learning experiences that resonate with and reflect the needs of
          each community, ensuring that our programs are both impactful and
          sustainable.
        </p>
      </div>
    </section>
  );
}
