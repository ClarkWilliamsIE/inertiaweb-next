'use client';

import { money, pct, price, tone } from '@/lib/winnerland/format';

import { STAKE, useCompetition } from './useCompetition';

export default function CompetitionPage() {
  const { entrants, error, reload } = useCompetition();

  if (error) {
    return (
      <div className="wl-notice wl-notice--error" role="alert">
        <p>{error}</p>
        <button type="button" className="wl-btn" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }
  if (!entrants) return <div className="wl-skeleton" style={{ height: 400 }} />;

  const pot = entrants.reduce((a, e) => a + e.value, 0);
  const avg = entrants.length ? entrants.reduce((a, e) => a + e.pct, 0) / entrants.length : 0;
  const maxAbs = Math.max(...entrants.map((e) => Math.abs(e.pct)), 1);

  return (
    <div className="wl-page">
      <header className="wl-page__head">
        <h1 className="wl-h1">Stock-pick competition</h1>
        <p className="wl-lede">
          Everyone picked one stock with a pretend {money(STAKE)}. Together the picks are worth{' '}
          <strong className="wl-num">{money(pot)}</strong>, an average of{' '}
          <span className={`wl-tone-${tone(avg)}`}>{pct(avg)}</span>.
        </p>
      </header>

      {entrants.length === 0 ? (
        <p className="wl-empty">No picks yet. Add members and their stocks on the Admin page.</p>
      ) : (
        <ol className="wl-board">
          {entrants.map((e, i) => (
            <li key={e.id} className={`wl-board__row ${i === 0 ? 'is-first' : ''}`}>
              <span className="wl-board__rank">{i + 1}</span>
              <span className="wl-board__who">
                <strong>{e.name}</strong>
                <span className="wl-ticker">{e.ticker}</span>
              </span>
              <span className="wl-board__bar" aria-hidden="true">
                <span
                  className={`wl-board__fill wl-bg-${tone(e.pct)}`}
                  style={{
                    width: `${(Math.abs(e.pct) / maxAbs) * 50}%`,
                    left: e.pct >= 0 ? '50%' : `${50 - (Math.abs(e.pct) / maxAbs) * 50}%`,
                  }}
                />
              </span>
              <span className="wl-board__nums">
                <span className={`wl-num wl-strong wl-tone-${tone(e.pct)}`}>{pct(e.pct)}</span>
                <span className="wl-small wl-muted">
                  worth {money(e.value)}, picked at {price(e.startPrice)}, now {price(e.price)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="wl-small wl-muted">
        Prices are delayed quotes from Yahoo Finance and are in each stock’s own currency.
      </p>
    </div>
  );
}
