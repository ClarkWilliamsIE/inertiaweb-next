"use client";

// src/components/Hero.tsx
import React, { useState, useEffect } from 'react';

const images = [
  '/images/c1.jpg',
  '/images/truck2.png',
  '/images/c9.jpg',
  '/images/c4.jpg',
  '/images/c5.jpg',
  '/images/c6.jpg
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className="relative h-screen overflow-hidden">
      {/* Slides */}
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            idx === current ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      {/* Overlay content */}
      <div className="relative z-10 flex h-full items-center justify-center bg-black bg-opacity-50">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold">Welcome to Inertia</h1>
          <p className="mt-4 text-lg md:text-2xl">
            Crafting interactive experiences in Christchurch.
          </p>
          <a
            href="#about"
            className="inline-block mt-6 px-6 py-3 bg-inertia-accent text-inertia-dark font-semibold rounded-lg hover:opacity-90"
          >
            Learn more
          </a>
        </div>
      </div>

      {/* Prev/Next controls */}
      <button
        onClick={() => setCurrent((current - 1 + images.length) % images.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={() => setCurrent((current + 1) % images.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
        aria-label="Next slide"
      >
        ›
      </button>
    </section>
  );
}
