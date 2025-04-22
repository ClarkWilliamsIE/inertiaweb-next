// src/components/Makertruck.tsx
import React from 'react';

export default function Makertruck() {
  return (
    <section id="makertruck" className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 space-y-12">

        {/* Intro */}
        <div>
          <h2 className="text-3xl font-bold text-inertia-dark mb-4">
            The Makertruck Project
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            The Mobile Makerspace Initiative is a groundbreaking portable STEAM
            education platform that aims to transform the learning landscape in
            Aotearoa. By collaborating with partner schools during year-long
            residencies, we develop ambitious, high-tech, and creative engineering
            projects that challenge students to acquire new skills and implement them.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            This initiative bridges the digital divide by providing access to
            cutting-edge technology and learning experiences for students who may
            not have had the opportunity otherwise.
          </p>
          <p className="text-lg text-gray-700">
            Our commitment to engaging the community and ensuring equal access to
            STEAM education guarantees the sustainability and success of the
            project, ultimately shaping the next generation of creative thinkers.
            The model will be funded by a unique not-for-profit/MOE partnership
            which will allow for sustainable use of funding and a very productive
            use of charity income.
          </p>
        </div>

        {/* Truck Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { src: '/images/expandinside.jpg', caption: 'Inside View' },
            { src: '/images/outsideview.jpg', caption: 'Outside View' },
            { src: '/images/truck2.png', caption: 'Rear View' },
            { src: '/images/Subtest.png', caption: 'In Action' },
          ].map(({ src, caption }) => (
            <figure key={src} className="text-center">
              <div className="w-full aspect-square overflow-hidden rounded-lg shadow-md">
                <img
                  src={src}
                  alt={caption}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-gray-600">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Community Outcomes */}
        <div>
          <h3 className="text-2xl font-bold text-inertia-dark mb-6">Community Outcomes</h3>

          {/* Outcome Lists */}
          <div className="space-y-8 mb-8">
            {/* ... existing sections ... */}
          </div>

          {/* Community Image Gallery without captions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <figure key={i}>
                <img
                  src={`/images/c${i + 1}.jpg`}
                  alt={`Community Impact ${i + 1}`}
                  className="w-full rounded-lg shadow-md"
                />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
