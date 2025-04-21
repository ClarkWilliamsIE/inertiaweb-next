import Header    from '../components/header';
import Hero      from '../components/hero';
import About     from '../components/about';
import Makertruck from '../components/makertruck';
import Support   from '../components/support'
import Contact   from '../components/contact'
import Projects   from '../components/Projects'

export default function Page() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        <About />
       <Makertruck />
       <Projects />
       <Support />
       <Contact />
        {/* next sections go here */}
      </main>
    </>
  );
}
