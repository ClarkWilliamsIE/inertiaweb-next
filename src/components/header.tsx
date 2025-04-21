// src/components/Header.tsx

export default function Header() {
  return (
    <header className="bg-inertia-dark text-white fixed w-full z-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <img src="/images/logo.png" alt="Logo" className="h-8" />
        <ul className="flex space-x-6">
          <li><a href="#about"    className="hover:underline">About</a></li>
          <li><a href="#projects" className="hover:underline">Projects</a></li>
          <li><a href="#contact"  className="hover:underline">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
}
