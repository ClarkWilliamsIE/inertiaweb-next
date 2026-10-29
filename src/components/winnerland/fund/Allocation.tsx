import { money } from '@/lib/winnerland/format';
import type { HoldingView } from '@/lib/winnerland/types';

const SLOTS = 6;

export default function Allocation({ holdings, cash, total, f }: { holdings: HoldingView[]; cash: number; total: number; f: number }) {
  if (!total) return null;
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, SLOTS);
  const rest = sorted.slice(SLOTS).reduce((a, h) => a + h.value, 0);
  const parts = [
    ...top.map((h, i) => ({ key: h.key, label: h.symbol, value: h.value, color: `var(--wl-cat-${i + 1})` })),
    ...(rest > 0 ? [{ key: 'other', label: `${sorted.length - SLOTS} others`, value: rest, color: 'var(--wl-neutral-1)' }] : []),
    ...(cash > 0 ? [{ key: 'cash', label: 'Cash', value: cash, color: 'var(--wl-neutral-2)' }] : []),
  ];

  return (
    <section className="wl-panel" aria-labelledby="wl-alloc-title">
      <h2 id="wl-alloc-title" className="wl-h2">
        Where the money is
      </h2>
      <div className="wl-stack" role="img" aria-label="Share of the fund by holding">
        {parts.map((p) => (
          <span key={p.key} style={{ flexGrow: p.value, background: p.color }} title={`${p.label} ${((p.value / total) * 100).toFixed(1)}%`} />
        ))}
      </div>
      <ul className="wl-alloc-list">
        {parts.map((p) => (
          <li key={p.key}>
            <span className="wl-key wl-key--sq" style={{ background: p.color }} />
            <span className="wl-alloc-list__label">{p.label}</span>
            <span className="wl-num wl-muted">{money(p.value / f)}</span>
            <span className="wl-num wl-strong">{((p.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
