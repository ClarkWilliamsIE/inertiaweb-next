// src/components/People.tsx
import React from 'react';

const people = [
  { name: 'Clark Williams', img: '/images/clark-williams.jpg' },
  { name: 'Irihāpeti Mahuika', img: '/images/irihapeti-mahuika.jpg' },
  { name: 'Pania Watson', img: '/images/pania-watson.jpg' },
  { name: 'Lex Davis', img: '/images/lex-davis.jpg' },
];

export default function People() {
  return (
    <section id="people" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 space-y-8">

        <h2 className="text-3xl font-bold text-inertia-dark">
          People of Inertia Ed
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {people.map(({ name, img }) => (
            <div key={name} className="text-center">
              <img
                src={img}
                alt={name}
                className="mx-auto h-48 w-48 object-cover rounded-full shadow-lg"
              />
              <p className="mt-4 text-lg font-medium text-inertia-dark">
                {name}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-8">
          <h3 className="text-2xl font-bold text-inertia-dark mb-4">
            Who are we
          </h3>
          <p className="text-gray-700">
            Our team has an extensive history in the education sector, teaching
            across Aotearoa and internationally. Collectively, we have a
            track record of being at the forefront of education, not just in
            terms of research but with practical experience. Equity,
            culturally empowering, and innovative practice is our focus while
            building capacity for all young people in Aotearoa to access the
            best education experience there is to offer.
          </p>
        </div>

        <div>
          <a
            href="#contact"
            className="inline-block mt-6 px-6 py-3 bg-inertia-accent text-inertia-dark font-semibold rounded-lg hover:opacity-90"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
