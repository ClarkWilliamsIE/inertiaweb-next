type Props = {
  quote: string;
  name: string;
};

export function Testimonial({ quote, name }: Props) {
  return (
    <figure className="rounded-xl border border-base-200 bg-surface p-4">
      <blockquote className="text-base-700">“{quote}”</blockquote>
      <figcaption className="text-sm text-base-600 mt-2">— {name}</figcaption>
    </figure>
  );
}
