'use client';

import { useEffect, useRef, useState } from 'react';

import { dayLabel, money, monthLabel, parseDay, pct, price, qty, tone } from '@/lib/winnerland/format';
import type { HoldingDetailResponse, HoldingView } from '@/lib/winnerland/types';

import { useMember } from '../AuthProvider';
import LineChart, { type Marker } from '../charts/LineChart';

const RANGES = [
  { id: '3mo', label: '3M' },
  { id: '1y', label: '1Y' },
  { id: '5y', label: '5Y' },
] as const;

export default function HoldingDrawer({ holding, f, onClose }: { holding: HoldingView; f: number; onClose: () => void }) {
  const { api } = useMember();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('1y');
  const [detail, setDetail] = useState<HoldingDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    let alive = true;
    setDetail(null);
    setError(null);
    api<HoldingDetailResponse>(
      `/api/portfolio/holding?symbol=${encodeURIComponent(holding.symbol)}&yahoo=${encodeURIComponent(holding.yahoo)}&range=${range}`,
    )
      .then((d) => alive && setDetail(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [api, holding.symbol, holding.yahoo, range]);

  const points = (detail?.history ?? []).map(([x, y]) => ({ x, y }));
  const first = points[0]?.x ?? 0;
  const markers: Marker[] = (detail?.trades ?? [])
    .filter((t) => t.price != null && parseDay(t.date).getTime() >= first)
    .map((t) => ({
      x: parseDay(t.date).getTime(),
      y: t.price!,
      kind: t.side.toUpperCase().startsWith('S') ? 'sell' : 'buy',
      label: `${t.side.toUpperCase().startsWith('S') ? 'Sold' : 'Bought'} ${qty(t.quantity)} at ${price(t.price, t.currency)} on ${dayLabel(t.date, true)}`,
    }));
  const long = points.length > 1 && points[points.length - 1].x - points[0].x > 200 * 86400_000;

  return (
    <div className="wl-drawer-root">
      <div className="wl-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="wl-drawer" role="dialog" aria-modal="true" aria-labelledby="wl-drawer-title">
        <header className="wl-drawer__head">
          <div>
            <h2 id="wl-drawer-title" className="wl-drawer__title">
              {holding.symbol}
            </h2>
            <p className="wl-muted">{holding.name}</p>
          </div>
          <button ref={closeRef} type="button" className="wl-btn wl-btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <dl className="wl-stats">
          <div>
            <dt>Value</dt>
            <dd className="wl-num">{money(holding.value / f)}</dd>
          </div>
          <div>
            <dt>Gain</dt>
            <dd className={`wl-num wl-tone-${tone(holding.unrealized)}`}>
              {holding.unrealized != null ? money(holding.unrealized / f, { sign: true }) : '—'}{' '}
              <span className="wl-small">{pct(holding.unrealizedPct)}</span>
            </dd>
          </div>
          <div>
            <dt>Units</dt>
            <dd className="wl-num">{qty(holding.quantity)}</dd>
          </div>
          <div>
            <dt>Average cost</dt>
            <dd className="wl-num">{price(holding.avgCost, holding.currency)}</dd>
          </div>
          <div>
            <dt>Latest price</dt>
            <dd className="wl-num">
              {price(holding.price, holding.currency)}{' '}
              {holding.dayChangePct != null && (
                <span className={`wl-small wl-tone-${tone(holding.dayChangePct)}`}>{pct(holding.dayChangePct, { digits: 2 })}</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Dividends received</dt>
            <dd className="wl-num">{detail ? money(detail.dividendsBase / f) : '…'}</dd>
          </div>
        </dl>

        <div className="wl-panel__head">
          <h3 className="wl-h3">Price</h3>
          <div className="wl-tabs" role="tablist" aria-label="Price history range">
            {RANGES.map((r) => (
              <button key={r.id} type="button" role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <p className="wl-empty">Couldn’t load price history: {error}</p>
        ) : !detail ? (
          <div className="wl-skeleton" style={{ height: 260 }} />
        ) : points.length > 1 ? (
          <>
            <LineChart
              series={[{ id: 'p', label: holding.symbol, points, color: 'var(--wl-ink)', area: true }]}
              height={260}
              yFormat={(v) => price(v)}
              tooltipValue={(v) => price(v, holding.currency)}
              xTick={(x) => (long ? monthLabel(new Date(x)) : dayLabel(new Date(x)))}
              tooltipTitle={(x) => dayLabel(new Date(x), true)}
              markers={markers}
              refLine={holding.avgCost != null ? { y: holding.avgCost, label: `Our average cost ${price(holding.avgCost, holding.currency)}` } : undefined}
              ariaLabel={`${holding.symbol} price history`}
            />
            <ul className="wl-legend">
              <li>
                <span className="wl-chart__marker wl-chart__marker--buy wl-legend-dot" /> Buy
              </li>
              <li>
                <span className="wl-chart__marker wl-chart__marker--sell wl-legend-dot" /> Sell
              </li>
              <li>
                <span className="wl-key" data-dashed="" style={{ background: 'var(--wl-muted)' }} /> Average cost
              </li>
            </ul>
          </>
        ) : (
          <p className="wl-empty">No price history available for {holding.yahoo}.</p>
        )}

        {detail && detail.trades.length > 0 && (
          <>
            <h3 className="wl-h3">Our trades</h3>
            <table className="wl-table wl-table--compact">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Trade</th>
                  <th scope="col" className="wl-right">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...detail.trades].reverse().map((t, i) => (
                  <tr key={i}>
                    <td>{dayLabel(t.date, true)}</td>
                    <td>
                      {t.side.toUpperCase().startsWith('S') ? 'Sold' : 'Bought'} {qty(t.quantity)}
                    </td>
                    <td className="wl-right wl-num">{price(t.price, t.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </aside>
    </div>
  );
}
