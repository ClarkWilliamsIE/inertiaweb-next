'use client';

import { useMemo, useState } from 'react';

import { dayLabel, money } from '@/lib/winnerland/format';
import { EXIT_CASES, type ExitCase, quoteExit, sundayBefore } from '@/lib/winnerland/rules';
import type { Point } from '@/lib/winnerland/types';

/** Buy-in / buy-out prices from the Sunday NAV (clauses 10–12). */
export default function ExitCalculator({ nav, members }: { nav: Point[]; members: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<ExitCase>('quit');
  const [date, setDate] = useState(today);
  const [costs, setCosts] = useState('');

  const result = useMemo(() => {
    if (!nav.length || !date) return null;
    const sunday = sundayBefore(date);
    // NAV "as at 12pm Sunday" = the latest close on or before that Sunday.
    let point: Point | null = null;
    for (const p of nav) if (p[0] <= sunday) point = p;
    if (!point) return null;
    return { sunday, point, quote: quoteExit({ kind, nav: point[1], navDate: sunday, members, actualCosts: Number(costs) || 0, date }) };
  }, [nav, date, kind, members, costs]);

  const label = EXIT_CASES.find((c) => c.id === kind)!;
  const latestDay = nav.length ? nav[nav.length - 1][0] : null;

  return (
    <section className="wl-panel" aria-labelledby="wl-exit-title">
      <h2 id="wl-exit-title" className="wl-h2">
        Buy-in / buy-out calculator
      </h2>
      <p className="wl-small wl-muted">
        Prices use each member’s pro-rata share of NAV as at 12pm on the Sunday before the payment (or buy-in) date.
      </p>
      <div className="wl-addform__row">
        <label className="wl-field wl-field--grow">
          <span>Situation</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ExitCase)}>
            {EXIT_CASES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} (clause {c.clause})
              </option>
            ))}
          </select>
        </label>
        <label className="wl-field">
          <span>{kind === 'join' ? 'Buy-in date' : kind === 'default' ? 'Board resolution date' : 'Payment date'}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {(kind === 'join' || kind === 'quit') && (
          <label className="wl-field">
            <span>Actual costs (optional, NZD)</span>
            <input type="number" step="any" min={0} value={costs} onChange={(e) => setCosts(e.target.value)} placeholder="0" />
          </label>
        )}
      </div>

      {result ? (
        <>
          <dl className="wl-stats">
            <div>
              <dt>NAV as at Sunday {dayLabel(result.sunday, true)}</dt>
              <dd className="wl-num">{money(result.point[1])}</dd>
            </div>
            <div>
              <dt>One member’s share (÷ {members})</dt>
              <dd className="wl-num">{money(result.quote.stake)}</dd>
            </div>
            <div>
              <dt>{result.quote.adjustment >= 0 ? 'Premium' : 'Levy / discount'}</dt>
              <dd className="wl-num">{money(result.quote.adjustment, { sign: true })}</dd>
            </div>
            <div>
              <dt>{kind === 'join' ? 'New member pays' : 'Member receives'}</dt>
              <dd className="wl-num wl-strong">{money(result.quote.amount)}</dd>
            </div>
          </dl>
          <p className="wl-small">
            {result.quote.rule} {result.quote.dueNote} Due by <strong>{dayLabel(result.quote.dueBy, true)}</strong>.
          </p>
          {latestDay && result.sunday > latestDay && (
            <p className="wl-small wl-muted">
              That Sunday is after the latest IBKR data ({dayLabel(latestDay, true)}), so this uses the most recent NAV. Check
              again closer to the date.
            </p>
          )}
          <p className="wl-small wl-muted">
            {label.label}: a guide only. Weekly-contribution loans are converted to equity before any change in shareholding
            (clause 5.2A), so check the NAV includes them.
          </p>
        </>
      ) : (
        <p className="wl-empty">Needs fund value history from IBKR.</p>
      )}
    </section>
  );
}
