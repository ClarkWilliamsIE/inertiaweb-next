"use client";
// src/components/Projects.tsx
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
  // add more projects here as needed...
];

export default function Projects() {
  const [openId, setOpenId] = useState<number | null>(null);
  const toggle = (id: number) => setOpenId(openId === id ? null : id);

  return (
    <section id="projects" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-inertia-dark mb-8">Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="border rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggle(p.id)}
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
