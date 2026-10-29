'use client';

import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useSize } from './useSize';

export interface Series {
  id: string;
  label: string;
  points: { x: number; y: number }[];
  /** CSS colour (use a var(--…) token). */
  color: string;
  dashed?: boolean;
  step?: boolean;
  area?: boolean;
  width?: number;
}

export interface Marker {
  x: number;
  y: number;
  kind: 'buy' | 'sell';
  label: string;
}

interface Props {
  series: Series[];
  height?: number;
  yFormat: (v: number) => string;
  xTick: (x: number) => string;
  tooltipTitle: (x: number) => string;
  tooltipValue?: (v: number, s: Series) => string;
  markers?: Marker[];
  refLine?: { y: number; label: string };
  ariaLabel: string;
}

const PAD = { top: 16, right: 12, bottom: 28, left: 56 };

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const d = Math.abs(min) * 0.05 || 1;
    min -= d;
    max += d;
  }
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Math.round(v / step) * step);
  return ticks;
}

/** Index of the point with x nearest to `x` (points sorted by x). */
function nearest(points: { x: number }[], x: number): number {
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x < x) lo = mid;
    else hi = mid;
  }
  return Math.abs(points[lo].x - x) <= Math.abs(points[hi].x - x) ? lo : hi;
}

/** y of a series at x: last point at or before x (step) or nearest. */
function valueAt(s: Series, x: number): number | null {
  if (!s.points.length) return null;
  if (s.step) {
    let v: number | null = null;
    for (const p of s.points) {
      if (p.x <= x) v = p.y;
      else break;
    }
    return v;
  }
  return s.points[nearest(s.points, x)].y;
}

export default function LineChart({
  series,
  height = 300,
  yFormat,
  xTick,
  tooltipTitle,
  tooltipValue,
  markers = [],
  refLine,
  ariaLabel,
}: Props) {
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const primary = series[0];
  const geo = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    if (!all.length || width < 50) return null;
    const xs = primary.points.length ? primary.points.map((p) => p.x) : all.map((p) => p.x);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const inRange = all.filter((p) => p.x >= xMin && p.x <= xMax).map((p) => p.y);
    const ys = [...inRange, ...markers.map((m) => m.y), ...(refLine ? [refLine.y] : [])];
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    const padY = (yMax - yMin) * 0.08 || Math.abs(yMax) * 0.02 || 1;
    yMin -= padY;
    yMax += padY;
    const ticks = niceTicks(yMin, yMax);
    yMin = Math.min(yMin, ticks[0]);
    yMax = Math.max(yMax, ticks[ticks.length - 1]);
    const iw = width - PAD.left - PAD.right;
    const ih = height - PAD.top - PAD.bottom;
    const sx = (x: number) => PAD.left + (xMax === xMin ? iw / 2 : ((x - xMin) / (xMax - xMin)) * iw);
    const sy = (y: number) => PAD.top + ih - ((y - yMin) / (yMax - yMin)) * ih;
    const xTicksCount = Math.max(2, Math.min(6, Math.floor(iw / 110)));
    const xTicks = Array.from({ length: xTicksCount }, (_, i) => xMin + ((xMax - xMin) * i) / (xTicksCount - 1));
    return { xMin, xMax, sx, sy, ticks: ticks.filter((t) => t >= yMin && t <= yMax), xTicks, iw, ih };
  }, [series, primary, width, height, markers, refLine]);

  const paths = useMemo(() => {
    if (!geo) return [];
    return series.map((s) => {
      const pts = s.points.filter((p) => p.x >= geo.xMin - 1 && p.x <= geo.xMax + 1);
      let d = '';
      pts.forEach((p, i) => {
        const X = geo.sx(p.x);
        const Y = geo.sy(p.y);
        if (i === 0) d += `M${X},${Y}`;
        else if (s.step) d += `H${X}V${Y}`;
        else d += `L${X},${Y}`;
      });
      if (s.step && pts.length) d += `H${geo.sx(geo.xMax)}`;
      let area = '';
      if (s.area && pts.length > 1) {
        const base = PAD.top + geo.ih;
        area = `${d}L${geo.sx(pts[pts.length - 1].x)},${base}L${geo.sx(pts[0].x)},${base}Z`;
      }
      return { s, d, area };
    });
  }, [geo, series]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!geo || !primary.points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const x = geo.xMin + ((px - PAD.left) / geo.iw) * (geo.xMax - geo.xMin);
    setHover(nearest(primary.points, x));
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!primary.points.length) return;
    const last = primary.points.length - 1;
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? last) - 1));
    else if (e.key === 'ArrowRight') setHover((h) => Math.min(last, (h ?? last) + 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  };

  const hp = hover != null ? primary.points[hover] : null;
  const gradId = `g-${primary?.id ?? 'x'}`;

  return (
    <div ref={wrapRef} className="wl-chart" style={{ height }}>
      {geo && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={primary.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={primary.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {geo.ticks.map((t) => (
            <g key={t}>
              <line className="wl-chart__grid" x1={PAD.left} x2={width - PAD.right} y1={geo.sy(t)} y2={geo.sy(t)} />
              <text className="wl-chart__tick" x={PAD.left - 8} y={geo.sy(t)} textAnchor="end" dominantBaseline="middle">
                {yFormat(t)}
              </text>
            </g>
          ))}
          {geo.xTicks.map((x, i) => (
            <text
              key={i}
              className="wl-chart__tick"
              x={geo.sx(x)}
              y={height - 8}
              textAnchor={i === 0 ? 'start' : i === geo.xTicks.length - 1 ? 'end' : 'middle'}
            >
              {xTick(x)}
            </text>
          ))}
          {refLine && (
            <g>
              <line
                className="wl-chart__ref"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={geo.sy(refLine.y)}
                y2={geo.sy(refLine.y)}
              />
              <text className="wl-chart__reflabel" x={width - PAD.right} y={geo.sy(refLine.y) - 6} textAnchor="end">
                {refLine.label}
              </text>
            </g>
          )}
          {paths.map(({ s, area }) =>
            area ? <path key={s.id + 'a'} d={area} fill={`url(#${gradId})`} stroke="none" /> : null,
          )}
          {paths.map(({ s, d }) => (
            <path
              key={s.id}
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dashed ? '5 5' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {markers.map((m, i) => (
            <g key={i} className={`wl-chart__marker wl-chart__marker--${m.kind}`}>
              <circle cx={geo.sx(m.x)} cy={geo.sy(m.y)} r={5} />
              <title>{m.label}</title>
            </g>
          ))}
          {hp && (
            <g pointerEvents="none">
              <line className="wl-chart__cross" x1={geo.sx(hp.x)} x2={geo.sx(hp.x)} y1={PAD.top} y2={PAD.top + geo.ih} />
              {series.map((s) => {
                const v = valueAt(s, hp.x);
                if (v == null) return null;
                return (
                  <circle
                    key={s.id}
                    cx={geo.sx(hp.x)}
                    cy={geo.sy(v)}
                    r={4}
                    fill={s.color}
                    className="wl-chart__dot"
                  />
                );
              })}
            </g>
          )}
        </svg>
      )}
      {geo && hp && (
        <div
          className="wl-tooltip"
          style={{
            left: Math.min(Math.max(geo.sx(hp.x), 90), width - 90),
            top: 4,
          }}
          role="status"
        >
          <div className="wl-tooltip__title">{tooltipTitle(hp.x)}</div>
          {series.map((s) => {
            const v = valueAt(s, hp.x);
            if (v == null) return null;
            return (
              <div key={s.id} className="wl-tooltip__row">
                <span className="wl-key" style={{ background: s.color }} data-dashed={s.dashed ? '' : undefined} />
                <span>{s.label}</span>
                <strong>{tooltipValue ? tooltipValue(v, s) : yFormat(v)}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
