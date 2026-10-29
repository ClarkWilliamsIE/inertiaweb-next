'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-heading text-3xl font-bold text-white">This page hit an error.</h1>
      <p className="text-slate-400">Try loading it again. If it keeps happening, let Clark know.</p>
      <button
        onClick={reset}
        className="rounded-full bg-white px-6 py-3 font-bold text-slate-950 hover:bg-accent"
      >
        Try again
      </button>
    </main>
  );
}
