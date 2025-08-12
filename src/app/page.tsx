import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { FeatureCard } from '@/components/FeatureCard';
import { LogoCloud } from '@/components/LogoCloud';
import { Testimonial } from '@/components/Testimonial';

export default function Page() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container grid lg:grid-cols-2 gap-8 py-16 sm:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-base-200 px-3 py-1 text-xs text-base-600">
              <span className="inline-block w-2 h-2 rounded-full bg-brand"></span>
              Science kits for schools
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Plan your hands on science for the year, in minutes
            </h1>
            <p className="mt-3 text-lg text-base-700 max-w-prose">
              Browse a library of 30 classroom ready kits, check availability by term, and book for your school.
              Practical learning, equitable access, simple logistics.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href="/teacher-demo">Open the live demo</Button>
              <Button href="#contact" variant="secondary">Talk to us</Button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-base-600">
              <div className="flex items-center gap-1"><span className="i i-star"></span><span className="i i-star"></span><span className="i i-star"></span><span className="i i-star"></span><span className="i i-star"></span> Teacher rated</div>
              <div>National distribution</div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[16/10] rounded-xl border border-base-200 bg-base-50 overflow-hidden">
              <Image src="/outsideview.jpg" alt="" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <Section id="how" eyebrow="How it works" title="Simple for teachers, robust for operations" subtitle="A booking flow that matches the school year, with courier ready logistics.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard title="Browse and choose" text="Search by year level and strand, view kit outcomes and contents." icon="search" />
          <FeatureCard title="Pick a half term" text="See availability by term halves, then place the kit in your plan." icon="calendar" />
          <FeatureCard title="Confirm and print" text="Get a branded plan with shipping notes, then share with your team." icon="check" />
          <FeatureCard title="Easy returns" text="We include care notes and return labels, then close the loop." icon="truck" />
        </div>
      </Section>

      {/* Impact or logos */}
      <Section id="impact" eyebrow="Impact" title="Designed for equitable access" subtitle="We bring hands on science to every school, including small and isolated communities.">
        <LogoCloud />
        <div className="mt-6 grid md:grid-cols-3 gap-4 text-base-700">
          <div className="p-4 rounded-lg border border-base-200 bg-surface">Lower prep time for teachers</div>
          <div className="p-4 rounded-lg border border-base-200 bg-surface">Higher participation for students</div>
          <div className="p-4 rounded-lg border border-base-200 bg-surface">Clear reporting for funders</div>
        </div>
      </Section>

      {/* Testimonial */}
      <Section eyebrow="What educators say" title="Feedback from classrooms">
        <div className="grid lg:grid-cols-[1fr,340px] gap-4">
          <Testimonial
            quote="The kit arrived complete and ready to go, our students loved the investigations."
            name="Year 7 teacher"
          />
          <div className="rounded-xl border border-base-200 p-4">
            <div className="font-medium">Want a quick tour</div>
            <p className="text-base-700 text-sm mt-1">Open the demo, add three kits to a year plan, then print the plan to PDF.</p>
            <Button href="/teacher-demo" className="mt-3">Open the live demo</Button>
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact" eyebrow="Get in touch" title="Let us know your needs">
        <form className="grid sm:grid-cols-2 gap-3 max-w-2xl">
          <input className="input" placeholder="Your name" />
          <input className="input" placeholder="School email" type="email" />
          <textarea className="input sm:col-span-2" rows={4} placeholder="What would you like to explore" />
          <div className="sm:col-span-2">
            <Button href="mailto:info@inertiaed.org">Send email</Button>
          </div>
        </form>
      </Section>
    </>
  );
}
