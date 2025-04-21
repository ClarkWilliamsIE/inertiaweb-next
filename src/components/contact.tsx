// src/components/Contact.tsx
export default function Contact() {
  return (
    <section id="contact" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6 text-inertia-dark">
          Contact Us
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          If you have any questions or would like to get in touch, please email us at{' '}
          <a href="mailto:clark@inertiaed.org" className="text-inertia-accent hover:underline">
            clark@inertiaed.org
          </a>.
        </p>
        <a
          href="mailto:clark@inertiaed.org"
          className="inline-block px-6 py-3 bg-inertia-accent text-inertia-dark font-semibold rounded-lg hover:opacity-90"
        >
          Send Email
        </a>
      </div>
      <footer className="mt-16 text-center text-sm text-gray-500">
        Made by Clark Williams
      </footer>
    </section>
  );
}
