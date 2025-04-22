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
          <figure>
            <img src="/images/expandinside.jpg" alt="Inside the Makertruck" className="w-full rounded-lg shadow-md" />
            <figcaption className="mt-2 text-center text-gray-600">Inside View</figcaption>
          </figure>
          <figure>
            <img src="/images/outsideview.jpg" alt="Makertruck exterior" className="w-full rounded-lg shadow-md" />
            <figcaption className="mt-2 text-center text-gray-600">Outside View</figcaption>
          </figure>
          <figure>
            <img src="/images/truck2.png" alt="Makertruck rear" className="w-full rounded-lg shadow-md" />
            <figcaption className="mt-2 text-center text-gray-600">Rear View</figcaption>
          </figure>
          <figure>
            <img src="/images/Subtest.png" alt="Makertruck in action" className="w-full rounded-lg shadow-md" />
            <figcaption className="mt-2 text-center text-gray-600">In Action</figcaption>
          </figure>
        </div>


        {/* Community Outcomes */}
        <div>
          <h3 className="text-2xl font-bold text-inertia-dark mb-6">Community Outcomes</h3>

          {/* Outcome Lists */}
          <div className="space-y-8 mb-8">
            {[
              {
                heading: 'Fostering Positive Community Outcomes',
                items: [
                  'Provides a platform for students anywhere to engage with STEAM disciplines.',
                  'Bridges the gap between traditional education and real-world applications.',
                ],
              },
              {
                heading: 'Enhancing Skills and Empowering Students',
                items: [
                  'Immersive learning environment enhances problem-solving and critical-thinking skills.',
                  'Fosters a generation of innovative thinkers and passionate creators.',
                ],
              },
              {
                heading: 'Long-lasting Impact on Education',
                items: [
                  'Partnerships with schools and professional development of teachers for sustainability.',
                  'Projects designed to be interacted with many years after the residency to impact upcoming cohorts.',
                ],
              },
              {
                heading: 'Promoting Cultural Inclusion and Unity',
                items: [
                  'Partnerships with Tangata Whenua are core to creating learning opportunities that impact ākonga Māori.',
                  'Celebrates the diverse cultural landscape of Aotearoa New Zealand.',
                ],
              },
              {
                heading: 'Encouraging Participation from Underrepresented Groups',
                items: [
                  'Actively invites and focuses specifically on underrepresented groups to participate in STEAM activities.',
                  'Fosters cultural understanding and empowers existing knowledge through tech.',
                ],
              },
              {
                heading: 'Reducing Educational Disparities',
                items: [
                  'Hands-on, collaborative learning experiences for all.',
                  'Offers equal opportunities regardless of socio-economic backgrounds.',
                ],
              },
              {
                heading: 'Creating a More Equitable, Innovative, and Culturally Aware Society',
                items: [
                  "Profound impact on Aotearoa New Zealand's youth and society as a whole.",
                ],
              },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-lg mb-2">{section.heading}</h4>
                {section.items[0].startsWith('Profound') ? (
                  <p className="text-gray-700">{section.items[0]}</p>
                ) : (
                  <ul className="list-disc list-inside text-gray-700">
                    {section.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Community Image Gallery */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <figure key={i}>
                <img
                  src={`/images/c${i + 1}.jpg`}
                  alt={`Community Impact ${i + 1}`}
                  className="w-full rounded-lg shadow-md"
                />
                <figcaption className="mt-2 text-center text-gray-600">
                  {`Community Impact ${i + 1}`}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
