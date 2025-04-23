"use client";

// src/components/Projects.tsx
import React, { useState } from 'react';

type Project = {
  id: number;
  title: string;
  image: string;
  bullets: string[];
  author?: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: 'Creating a Vertical Garden with Automation and Interactive Statistic Interfaces',
    image: '/images/p3.jpg',
    bullets: [
      'Students will design and construct a vertical garden, incorporating automated watering and feeding systems. They will also create interactive interfaces that track and display various statistics such as plant growth, water usage, and nutrient levels. This would be in a purpose built space like a sapre room or container on-site which would continue to be used and developed long after the year residency.',
      'Technology, Mathematics, Science, Digital Technologies, Design and Visual Communication, Horticulture, Mathematics, Biology',
      'Design thinking, systems engineering, automation, data analysis, problem‑solving, computational thinking, sustainability',
    ],
  },
  {
    id: 2,
    title: 'Creating Kapa Haka Costumes with Neopixel LEDs',
    image: '/images/p4.jpeg',
    bullets: [
      'Students will design and create Kapa Haka costumes incorporating Neopixel LEDs. They will code these LEDs to create a light show that reflects the narrative (pūrakau) of performances that they will create that year and continue to create with the new skills developed at the school.',
      'Technology, Arts, Te Reo Māori, Digital Technologies, Textile Technology, Dance, Drama, Māori Performing Arts',
      'Electrical engineering, coding, design thinking, systems thinking, creativity, cultural awareness',
    ],
  },
  {
    id: 3,
    title: 'Re-imagining Instruments from across the Pacific (Credit: Rachel Hall)',
    image: '/images/p2.jpg',
    bullets: [
      'Students will research traditional Pacific instruments, then design, build, and play a new generation of these instruments, combining traditional elements with modern innovations.',
      'Technology, Arts, Social Sciences, Music, Design and Visual Communication, Wood Technology, Social Studies, History',
      'Acoustical engineering, design thinking, innovation, cultural awareness, craftsmanship',
    ],
  },
  {
    id: 4,
    title: 'Motion Capture Sport Analysis Systems',
    image: '/images/p1.jpg',
    bullets: [
      'Students will learn about and use motion capture technology to analyse sports performances. They will then use this analysis to develop models for performance improvement.',
      'Technology, Health and Physical Education, Mathematics, Digital Technologies, Physical Education, Health Science',
      'Biomechanical engineering, data analysis, software engineering, problem‑solving, computational thinking, sports science',
    ],
  },
];

export default function Projects() {
  const [introOpen, setIntroOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleProject = (id: number) =>
    setOpenId(openId === id ? null : id);

  return (
    <section id="projects" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* Title */}
        <h2 className="text-3xl font-bold text-inertia-dark">
          Projects
        </h2>

        {/* Intro Toggle */}
        <button
          onClick={() => setIntroOpen(!introOpen)}
          className="text-inertia-accent font-semibold hover:underline"
        >
          {introOpen ? 'Hide project overview' : 'Show project overview'}
        </button>

        {/* Collapsible Intro */}
        {introOpen && (
          <div className="space-y-4 text-gray-700">
            <p>
              A collaborative project within the Mobile Makerspace Initiative would involve students, teachers, and local community members working together to address real‑world challenges or create innovative solutions, such as building an automated vertical garden, developing unique cultural experiences through technology, or engineering small‑scale flying vehicles.
            </p>
            <p>
              High schools would benefit from the opportunity to integrate cutting‑edge STEAM concepts into their curricula, while teachers would gain valuable professional development and hands‑on experience.
            </p>
            <p>
              The community would be engaged through access to the resources during the course of the year and public showcases of these diverse and high impact projects, fostering a sense of collective pride and accomplishment.
            </p>
            <p>
              Ultimately, these collaborative efforts would contribute to a brighter future for innovation and technology in Aotearoa by nurturing the next generation of creative thinkers, problem solvers, and skilled professionals, ensuring the nation remains at the forefront of global education.
            </p>
            <p>
              The kaupapa behind the projects is decided in collaboration ahead of time with each school, ensuring we’re responsive to the community we join. School holiday periods are used to upskill and prepare for the next project.
            </p>
            <p className="italic">
              Below are some examples of what projects could look like:
            </p>
          </div>
        )}

        {/* Projects Accordion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleProject(p.id)}
                className="focus:outline-none w-full"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-inertia-dark">
                    {p.title}
                  </h3>
                </div>
              </button>
              {openId === p.id && (
                <div className="px-4 pb-4 text-gray-700 space-y-2">
                  <ul className="list-disc list-inside">
                    {p.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  {p.author && (
                    <p className="mt-2 text-sm italic text-gray-500">
                      {p.author}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
