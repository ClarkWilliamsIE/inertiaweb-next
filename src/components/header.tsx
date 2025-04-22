// src/components/header.tsx
import React from 'react';

export default function Header() {
  return (
    <header className="bg-inertia-dark text-white fixed w-full z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <img
            src="/images/inertialogo.png"
            alt="Inertia Logo"
            className="h-16"
          />
          <span className="text-white font-bold text-2xl">
            Inertia Education
          </span>
        </div>

        <ul className="flex space-x-6">
          <li><a href="#hero"       className="hover:underline">Home</a></li>
          <li><a href="#about"      className="hover:underline">About</a></li>
          <li><a href="#projects"   className="hover:underline">Projects</a></li>
          <li><a href="#makertruck" className="hover:underline">Makertruck</a></li>
          <li><a href="#people"     className="hover:underline">People</a></li>
          <li><a href="#support"    className="hover:underline">Support</a></li>
          <li><a href="#contact"    className="hover:underline">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
}
