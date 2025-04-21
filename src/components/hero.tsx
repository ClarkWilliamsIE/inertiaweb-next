// src/components/Hero.tsx
export default function Hero() {
  return (
    <section
      id="hero"
      className="h-screen flex items-center justify-center bg-[url('/images/hero-bg.jpg')] bg-cover bg-center"
    >
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
    </section>
  );
}
