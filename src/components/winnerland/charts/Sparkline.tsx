interface Props {
  values: number[];
  width?: number;
  height?: number;
  label: string;
}

/** Tiny trend line; colour follows direction over the period. */
export default function Sparkline({ values, width = 84, height = 26, label }: Props) {
  if (values.length < 2) return <span className="wl-spark wl-spark--empty" aria-hidden="true" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(' ');
  const dir = values[values.length - 1] >= values[0] ? 'up' : 'down';
  return (
    <svg className={`wl-spark wl-tone-${dir}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
