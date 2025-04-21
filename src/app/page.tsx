import Header from '../components/Header';
import Hero   from '../components/Hero';

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
