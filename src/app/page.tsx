import Header from '../components/header';
import Hero   from '../components/hero';

export default function Page() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        {/* next sections go here */}
      </main>
    </>
  );
}
