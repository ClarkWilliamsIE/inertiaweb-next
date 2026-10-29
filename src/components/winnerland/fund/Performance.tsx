'use client';

import { useMemo, useState } from 'react';

import { dayLabel, isoDay, money, moneyShort, monthLabel, parseDay, pct, timeLabel, tone } from '@/lib/winnerland/format';
import type { PortfolioResponse } from '@/lib/winnerland/types';

import LineChart, { type Series } from '../charts/LineChart';

type Range = '1D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

function startFor(range: Range, last: Date): Date | null {
  const d = new Date(last);
  switch (range) {
    case '1M':
      d.setMonth(d.getMonth() - 1);
      return d;
    case '3M':
      d.setMonth(d.getMonth() - 3);
      return d;
    case 'YTD':
      return new Date(last.getFullYear(), 0, 1);
    case '1Y':
      d.setFullYear(d.getFullYear() - 1);
      return d;
    default:
      return null;
  }
}

export default function Performance({ data, f }: { data: PortfolioResponse; f: number }) {
  const hasIntraday = data.intraday.length > 3;
  const [range, setRange] = useState<Range>(() => {
    try {
      const saved = localStorage.getItem('wl-range') as Range | null;
      if (saved && (saved !== '1D' || hasIntraday)) return saved;
    } catch {
      /* ignore */
    }
    return '1Y';
  });
  const choose = (r: Range) => {
    setRange(r);
    try {
      localStorage.setItem('wl-range', r);
    } catch {
      /* ignore */
    }
  };

  const view = useMemo(() => {
    if (range === '1D') {
      const pts = data.intraday.map(([t, v]) => ({ x: t, y: v / f }));
      const first = data.live ? (data.live.total - data.live.dayChange) / f : pts[0]?.y ?? 0;
      const last = pts[pts.length - 1]?.y ?? first;
      return {
        series: [{ id: 'v', label: 'Fund value', points: pts, color: 'var(--wl-ink)', area: true }] as Series[],
        change: last - first,
        changePct: first ? ((last - first) / first) * 100 : null,
        note: 'since the last close',
        xTick: (x: number) => timeLabel(x),
        title: (x: number) => timeLabel(x),
        refLine: { y: first, label: `Last close ${money(first)}` },
      };
    }

    // Daily history, with today's live value appended.
    const nav = [...data.nav];
    const today = isoDay(new Date());
    if (data.live && nav.length && nav[nav.length - 1][0] < today) nav.push([today, data.live.total]);
    if (!nav.length) return null;
    const last = parseDay(nav[nav.length - 1][0]);
    const start = startFor(range, last);
    const startIso = start ? isoDay(start) : null;
    const inRange = startIso ? nav.filter(([d]) => d >= startIso) : nav;
    const pts = inRange.map(([d, v]) => ({ x: parseDay(d).getTime(), y: v / f }));

    const contribAt = (iso: string) => {
      let v: number | null = null;
      for (const [d, c] of data.contributions) {
        if (d <= iso) v = c;
        else break;
      }
      return v;
    };
    const firstIso = inRange[0]?.[0];
    const lastIso = inRange[inRange.length - 1]?.[0];
    const cStart = firstIso ? contribAt(firstIso) ?? 0 : 0;
    const cEnd = lastIso ? contribAt(lastIso) ?? 0 : 0;
    const flows = (cEnd - cStart) / f;
    const v0 = pts[0]?.y ?? 0;
    const v1 = pts[pts.length - 1]?.y ?? 0;
    const change = v1 - v0 - flows;
    const changePct = v0 + flows ? (change / (v0 + Math.max(flows, 0))) * 100 : null;

    const contribPts: { x: number; y: number }[] = [];
    if (data.contributions.length && pts.length) {
      const first = contribAt(firstIso!);
      if (first != null) contribPts.push({ x: pts[0].x, y: first / f });
      for (const [d, c] of data.contributions) {
        if (firstIso && d > firstIso && lastIso && d <= lastIso) contribPts.push({ x: parseDay(d).getTime(), y: c / f });
      }
    }

    const series: Series[] = [{ id: 'v', label: 'Fund value', points: pts, color: 'var(--wl-ink)', area: true }];
    if (contribPts.length) {
      series.push({ id: 'c', label: 'Money put in', points: contribPts, color: 'var(--wl-muted)', dashed: true, step: true, width: 1.5 });
    }
    const long = pts.length && pts[pts.length - 1].x - pts[0].x > 200 * 86400_000;
    return {
      series,
      change,
      changePct,
      note: flows ? 'after deposits and withdrawals' : `over ${range === 'ALL' ? 'all recorded history' : 'this period'}`,
      xTick: (x: number) => (long ? monthLabel(new Date(x)) : dayLabel(new Date(x))),
      title: (x: number) => dayLabel(new Date(x), true),
      refLine: undefined,
    };
  }, [data, f, range]);

  const ranges: Range[] = hasIntraday ? ['1D', '1M', '3M', 'YTD', '1Y', 'ALL'] : ['1M', '3M', 'YTD', '1Y', 'ALL'];

  return (
    <section className="wl-panel wl-perf" aria-labelledby="wl-perf-title">
      <div className="wl-panel__head">
        <div>
          <h2 id="wl-perf-title" className="wl-h2">
            Fund value
          </h2>
          {view && (
            <p className="wl-perf__change">
              <span className={`wl-tone-${tone(view.change)}`}>
                {money(view.change, { sign: true })} ({pct(view.changePct)})
              </span>{' '}
              <span className="wl-muted">{view.note}</span>
            </p>
          )}
        </div>
        <div className="wl-tabs" role="tablist" aria-label="Time range">
          {ranges.map((r) => (
            <button key={r} type="button" role="tab" aria-selected={range === r} onClick={() => choose(r)}>
              {r === 'ALL' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>
      {view && view.series[0].points.length > 1 ? (
        <>
          <LineChart
            series={view.series}
            height={320}
            yFormat={moneyShort}
            tooltipValue={(v) => money(v)}
            xTick={view.xTick}
            tooltipTitle={view.title}
            refLine={view.refLine}
            ariaLabel={`Fund value chart, ${range}. Use arrow keys to read values.`}
          />
          {view.series.length > 1 && (
            <ul className="wl-legend" aria-label="Legend">
              {view.series.map((s) => (
                <li key={s.id}>
                  <span className="wl-key" style={{ background: s.color }} data-dashed={s.dashed ? '' : undefined} />
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="wl-empty">Not enough history for this range yet. It fills in with each daily IBKR sync.</p>
      )}
    </section>
  );
}
