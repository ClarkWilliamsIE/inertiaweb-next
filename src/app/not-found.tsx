import Link from 'next/link';

export const metadata = { title: 'Page not found | Inertia Education' };

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-accent font-heading text-7xl font-black">404</p>
      <h1 className="font-heading text-3xl font-bold text-white">We couldn&apos;t find that page.</h1>
      <Link href="/" className="rounded-full bg-white px-6 py-3 font-bold text-slate-950 hover:bg-accent">
        Back to the homepage
      </Link>
    </main>
  );
}
