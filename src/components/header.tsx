// src/components/header.tsx
import React from 'react';

export default function Header() {
  return (
    <header className="bg-inertia-dark text-white fixed w-full z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <img src="/images/logo.png" alt="Logo" className="h-8" />
        <ul className="flex space-x-6">
          <li><a href="#hero"       className="hover:underline">Home</a></li>
          <li><a href="#about"      className="hover:underline">About</a></li>
          <li><a href="#projects"   className="hover:underline">Projects</a></li>
          <li><a href="#makertruck" className="hover:underline">Makertruck</a></li>
          <li><a href="#contact"    className="hover:underline">Contact</a></li>
          <li><a href="#support"    className="hover:underline">Support</a></li>
        </ul>
      </nav>
    </header>
  );
}
