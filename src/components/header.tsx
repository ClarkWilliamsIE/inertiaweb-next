"use client";

// src/components/header.tsx
import React, { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-inertia-dark text-white fixed w-full z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between h-12 sm:h-16 px-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2">
          <img
            src="/images/inertialogo.png"
            alt="Inertia Logo"
            className="h-6 sm:h-8"
          />
          <span className="hidden sm:inline text-white font-bold text-xl">
            Inertia Education
          </span>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Navigation Links */}
        <ul
          className={
            `absolute sm:static top-full left-0 sm:flex sm:items-center w-full sm:w-auto bg-inertia-dark sm:bg-transparent flex-col sm:flex-row ${
              menuOpen ? 'block' : 'hidden'
            }`
          }
        >
          {['Home', 'About', 'Projects', 'Makertruck', 'People', 'Support', 'Contact'].map((link) => (
            <li key={link} className="sm:ml-6">
              <a
                href={`#${link.toLowerCase()}`}
                className="block px-4 py-2 sm:p-0 text-center sm:text-left hover:underline"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
