'use client';

import { useEffect, useRef } from 'react';

import { money, pct, price, tone } from '@/lib/winnerland/format';
import type { HoldingView } from '@/lib/winnerland/types';

export const COMPETITION_ROW_KEY = '__competition';

/** Merges the competition picks into one Holdings row (the members' own "ETF"). */
export function competitionRow(picks: HoldingView[]): HoldingView | null {
  if (!picks.length) return null;
  const value = picks.reduce((a, h) => a + h.value, 0);
  const allCost = picks.every((h) => h.cost != null);
  const cost = allCost ? picks.reduce((a, h) => a + (h.cost ?? 0), 0) : null;
  const dayKnown = picks.filter((h) => h.dayChange != null);
  const dayChange = dayKnown.length ? dayKnown.reduce((a, h) => a + (h.dayChange ?? 0), 0) : null;
  return {
    key: COMPETITION_ROW_KEY,
    symbol: 'COMP',
    yahoo: '',
    name: `Competition ETF · ${picks.length} picks`,
    assetCategory: 'ETF',
    currency: 'NZD',
    quantity: picks.length,
    price: null,
    avgCost: null,
    value,
    cost,
    unrealized: cost != null ? value - cost : null,
    unrealizedPct: cost ? ((value - cost) / Math.abs(cost)) * 100 : null,
    weight: picks.reduce((a, h) => a + h.weight, 0),
    dayChange,
    dayChangePct: dayChange != null && value - dayChange ? (dayChange / (value - dayChange)) * 100 : null,
    isLive: picks.some((h) => h.isLive),
    spark: [],
    isGroup: true,
  };
}

export default function CompetitionDrawer({
  row,
  picks,
  f,
  onClose,
  onOpen,
}: {
  row: HoldingView;
  picks: HoldingView[];
  f: number;
  onClose: () => void;
  onOpen: (h: HoldingView) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const sorted = [...picks].sort((a, b) => b.value - a.value);

  return (
    <div className="wl-drawer-root">
      <div className="wl-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="wl-drawer" role="dialog" aria-modal="true" aria-labelledby="wl-comp-title">
        <header className="wl-drawer__head">
          <div>
            <h2 id="wl-comp-title" className="wl-drawer__title">
              Competition ETF
            </h2>
            <p className="wl-muted">Members’ competition picks, treated as one holding for the investment policy.</p>
          </div>
          <button ref={closeRef} type="button" className="wl-btn wl-btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <dl className="wl-stats">
          <div>
            <dt>Value</dt>
            <dd className="wl-num">{money(row.value / f)}</dd>
          </div>
          <div>
            <dt>Gain</dt>
            <dd className={`wl-num wl-tone-${tone(row.unrealized)}`}>
              {row.unrealized != null ? money(row.unrealized / f, { sign: true }) : '—'}{' '}
              <span className="wl-small">{pct(row.unrealizedPct)}</span>
            </dd>
          </div>
          <div>
            <dt>Share of fund</dt>
            <dd className="wl-num">{row.weight.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Today</dt>
            <dd className={`wl-num wl-tone-${tone(row.dayChange)}`}>
              {row.dayChange != null ? money(row.dayChange / f, { sign: true }) : '—'}
            </dd>
          </div>
        </dl>

        <h3 className="wl-h3">Picks</h3>
        <div className="wl-table-wrap">
          <table className="wl-table wl-table--compact">
            <thead>
              <tr>
                <th scope="col">Holding</th>
                <th scope="col" className="wl-right">
                  Price
                </th>
                <th scope="col" className="wl-right">
                  Value
                </th>
                <th scope="col" className="wl-right">
                  Gain
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr
                  key={h.key}
                  tabIndex={0}
                  onClick={() => onOpen(h)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpen(h);
                    }
                  }}
                  aria-label={`${h.symbol}: open details`}
                >
                  <td>
                    <div className="wl-holding">
                      <span className="wl-ticker">{h.symbol}</span>
                      <span className="wl-holding__name">{h.name ?? ''}</span>
                    </div>
                  </td>
                  <td className="wl-right">
                    <div className="wl-num wl-nowrap">{price(h.price, h.currency)}</div>
                    <div className={`wl-small wl-tone-${tone(h.dayChangePct)}`}>
                      {h.dayChangePct != null ? pct(h.dayChangePct, { digits: 2 }) : ''}
                    </div>
                  </td>
                  <td className="wl-right wl-num">{money(h.value / f)}</td>
                  <td className="wl-right">
                    <div className={`wl-num wl-tone-${tone(h.unrealized)}`}>
                      {h.unrealized != null ? money(h.unrealized / f, { sign: true }) : '—'}
                    </div>
                    <div className={`wl-small wl-tone-${tone(h.unrealizedPct)}`}>{pct(h.unrealizedPct)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="wl-small wl-muted">Select a pick for its price history and trades. Choose which holdings are picks in Admin.</p>
      </aside>
    </div>
  );
}
