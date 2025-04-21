import Header    from '../components/header';
import Hero      from '../components/hero';
import About     from '../components/About';
import Makertruck from '../components/Makertruck';

export default function Page() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        <About />
       <Makertruck />
        {/* next sections go here */}
      </main>
    </>
  );
}
