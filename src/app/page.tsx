import Header from '../components/header';
import Hero   from '../components/hero';
+ import About  from '../components/About';

export default function Page() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
+       <About />
        {/* next sections go here */}
      </main>
    </>
  );
}
