"use client";

import React, { useState } from 'react';

type Project = {
  id: number;
  title: string;
  image: string;
  description: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: 'Motion Capture Sport Analysis',
    image: '/images/p1.jpg',
    description: `Using motion‑capture to analyze athletic performance, giving real‑time feedback to improve technique.`,
  },
  {
    id: 2,
    title: 'Digital Pasifika Instruments',
    image: '/images/p2.jpg',
    description: `Custom neopixel instruments blending Pasifika art and technology to teach coding through music.`,
  },
  {
    id: 3,
    title: 'Vertical Garden',
    image: '/images/p3.jpg',
    description: `Hydroponic tower gardens built by students to learn biology, engineering, and sustainability.`,
  },
  {
    id: 4,
    title: 'Kapa Haka Neopixel Kākahu',
    image: '/images/p4.jpeg',
    description: `Interactive Māori cloak with LED accents that light up in patterns synced to haka rhythms.`,
  },
  // Add more projects as needed...
];

export default function Projects() {
  const [introOpen, setIntroOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const toggleProject = (id: number) => setOpenId(openId === id ? null : id);

  return (
    <section id="projects" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* Title */}
        <h2 className="text-3xl font-bold text-inertia-dark">Projects</h2>

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
            <p className="italic">Below are some examples of what projects could look like:</p>
          </div>
        )}

        {/* Projects Accordion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="border rounded-lg overflow-hidden shadow-sm">
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
                <div className="px-4 pb-4 text-gray-700">
                  <p>{p.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
