type Props = {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function Section({ id, eyebrow, title, subtitle, children }: Props) {
  return (
    <section id={id} className="py-12 sm:py-16 border-t border-base-200 bg-surface">
      <div className="container">
        {(eyebrow || title) && (
          <header className="mb-6">
            {eyebrow && <div className="text-xs font-medium text-base-600">{eyebrow}</div>}
            {title && <h2 className="text-2xl sm:text-3xl font-semibold mt-1">{title}</h2>}
            {subtitle && <p className="text-base-700 mt-1 max-w-prose">{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
