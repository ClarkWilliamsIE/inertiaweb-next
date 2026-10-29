'use client';

import { useMemo, useState } from 'react';

import { money, pct, price, tone } from '@/lib/winnerland/format';
import type { HoldingView } from '@/lib/winnerland/types';

import Sparkline from '../charts/Sparkline';

type SortKey = 'symbol' | 'day' | 'value' | 'gain' | 'weight';

interface Props {
  holdings: HoldingView[];
  f: number;
  onOpen: (h: HoldingView) => void;
}

export default function Holdings({ holdings, f, onOpen }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'value', asc: false });

  const rows = useMemo(() => {
    const get = (h: HoldingView): number | string => {
      switch (sort.key) {
        case 'symbol':
          return h.symbol;
        case 'day':
          return h.dayChangePct ?? -Infinity;
        case 'gain':
          return h.unrealizedPct ?? -Infinity;
        case 'weight':
        case 'value':
          return h.value;
      }
    };
    return [...holdings].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const c = typeof x === 'string' ? x.localeCompare(String(y)) : (x as number) - (y as number);
      return sort.asc ? c : -c;
    });
  }, [holdings, sort]);

  const maxWeight = Math.max(...holdings.map((h) => h.weight), 1);

  const th = (k: SortKey, children: string, className?: string) => {
    const active = sort.key === k;
    return (
      <th key={k} scope="col" className={className} aria-sort={active ? (sort.asc ? 'ascending' : 'descending') : 'none'}>
        <button type="button" onClick={() => setSort({ key: k, asc: active ? !sort.asc : k === 'symbol' })}>
          {children}
          <span className="wl-sort" aria-hidden="true">
            {active ? (sort.asc ? '↑' : '↓') : ''}
          </span>
        </button>
      </th>
    );
  };

  return (
    <section className="wl-panel wl-holdings" aria-labelledby="wl-holdings-title">
      <div className="wl-panel__head">
        <h2 id="wl-holdings-title" className="wl-h2">
          Holdings <span className="wl-count">{holdings.length}</span>
        </h2>
        <p className="wl-muted wl-small">Select a holding to see its price history and our trades.</p>
      </div>
      {holdings.length === 0 ? (
        <p className="wl-empty">No holdings in the latest IBKR statement.</p>
      ) : (
        <div className="wl-table-wrap">
          <table className="wl-table">
            <thead>
              <tr>
                {th('symbol', 'Holding')}
                <th scope="col" className="wl-hide-sm">
                  Last month
                </th>
                {th('day', 'Price', 'wl-right wl-hide-sm')}
                {th('value', 'Value', 'wl-right')}
                {th('gain', 'Gain', 'wl-right')}
                {th('weight', 'Share of fund', 'wl-hide-sm')}
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
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
                  <td className="wl-hide-sm">
                    <Sparkline values={h.spark} label={`${h.symbol} over the last month`} />
                  </td>
                  <td className="wl-right wl-hide-sm">
                    <div className="wl-num wl-nowrap">{price(h.price, h.currency)}</div>
                    <div className={`wl-small wl-tone-${tone(h.dayChangePct)}`}>
                      {h.dayChangePct != null ? pct(h.dayChangePct, { digits: 2 }) : h.isLive ? '' : 'close'}
                    </div>
                  </td>
                  <td className="wl-right">
                    <div className="wl-num wl-strong">{money(h.value / f)}</div>
                    <div className="wl-small wl-muted">{h.quantity.toLocaleString('en-NZ', { maximumFractionDigits: 4 })} units</div>
                  </td>
                  <td className="wl-right">
                    <div className={`wl-num wl-tone-${tone(h.unrealized)}`}>
                      {h.unrealized != null ? money(h.unrealized / f, { sign: true }) : '—'}
                    </div>
                    <div className={`wl-small wl-tone-${tone(h.unrealizedPct)}`}>{pct(h.unrealizedPct)}</div>
                  </td>
                  <td className="wl-hide-sm">
                    <div className="wl-weight">
                      <span className="wl-weight__bar" style={{ width: `${(h.weight / maxWeight) * 100}%` }} />
                      <span className="wl-weight__label">{h.weight.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
