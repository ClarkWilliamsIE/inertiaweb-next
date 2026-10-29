/**
 * Delayed market data from Yahoo Finance's public chart endpoint. Used for
 * intraday "live" values between the nightly IBKR syncs. Everything here is
 * best-effort: if Yahoo is unavailable the dashboard falls back to IBKR's
 * closing prices.
 */
import { fxSymbol } from './symbols';

const HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  Accept: 'application/json',
};

export interface Quote {
  symbol: string;
  name: string | null;
  currency: string | null;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
  time: string | null; // ISO
  isOpen: boolean;
  intraday: [number, number][]; // [epoch ms, price]
}

export interface Bar {
  t: number; // epoch ms
  close: number;
}

interface ChartResult {
  meta: Record<string, unknown> & {
    currency?: string;
    symbol?: string;
    regularMarketPrice?: number;
    previousClose?: number;
    chartPreviousClose?: number;
    regularMarketTime?: number;
    longName?: string;
    shortName?: string;
    currentTradingPeriod?: { regular?: { start: number; end: number } };
  };
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[]; adjclose?: { adjclose?: (number | null)[] }[] };
}

async function chart(symbol: string, params: Record<string, string>, revalidate: number): Promise<ChartResult | null> {
  const qs = new URLSearchParams({ includePrePost: 'false', events: 'div,splits', ...params });
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`, {
        headers: HEADERS,
        next: { revalidate },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const r = json?.chart?.result?.[0];
      if (r) return r as ChartResult;
    } catch {
      // try next host
    }
  }
  return null;
}

function bars(r: ChartResult): Bar[] {
  const ts = r.timestamp ?? [];
  const closes = r.indicators?.quote?.[0]?.close ?? [];
  const out: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c != null && Number.isFinite(c)) out.push({ t: ts[i] * 1000, close: c });
  }
  return out;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const r = await chart(symbol, { range: '1d', interval: '5m' }, 60);
  if (!r) return null;
  const m = r.meta;
  // Some exchanges quote in minor units (LSE pence "GBp", JSE cents "ZAc", TASE agorot "ILA").
  const minor = m.currency === 'GBp' || m.currency === 'ZAc' || m.currency === 'ILA';
  const k = minor ? 0.01 : 1;
  const currency = minor ? ({ GBp: 'GBP', ZAc: 'ZAR', ILA: 'ILS' } as Record<string, string>)[m.currency!] : (m.currency ?? null);
  const intraday = bars(r).map((b) => [b.t, b.close * k] as [number, number]);
  const rawPrice = m.regularMarketPrice ?? (intraday.length ? intraday[intraday.length - 1][1] / k : undefined);
  if (rawPrice == null) return null;
  const price = rawPrice * k;
  const rawPrev = m.previousClose ?? m.chartPreviousClose;
  const prev = rawPrev != null ? rawPrev * k : null;
  const now = Date.now() / 1000;
  const period = m.currentTradingPeriod?.regular;
  return {
    symbol,
    name: m.longName ?? m.shortName ?? null,
    currency,
    price,
    previousClose: prev,
    change: prev != null ? price - prev : null,
    changePct: prev ? ((price - prev) / prev) * 100 : null,
    time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null,
    isOpen: !!period && now >= period.start && now <= period.end,
    intraday,
  };
}

export async function getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  const results = await mapLimit(unique, 6, getQuote);
  const out: Record<string, Quote> = {};
  unique.forEach((s, i) => {
    const q = results[i];
    if (q) out[s] = q;
  });
  return out;
}

export type HistoryRange = '1mo' | '3mo' | '6mo' | 'ytd' | '1y' | '2y' | '5y' | 'max';

export async function getHistory(symbol: string, range: HistoryRange): Promise<Bar[]> {
  const interval = range === '5y' || range === 'max' ? '1wk' : '1d';
  const r = await chart(symbol, { range, interval }, 60 * 30);
  if (!r) return [];
  const minor = r.meta.currency === 'GBp' || r.meta.currency === 'ZAc' || r.meta.currency === 'ILA';
  return minor ? bars(r).map((b) => ({ t: b.t, close: b.close / 100 })) : bars(r);
}

/** Close on (or the first trading day after) `since`, plus the latest price. */
export async function getPerformanceSince(
  symbol: string,
  since: string,
): Promise<{ startPrice: number; startDate: string; price: number; pct: number; currency: string | null } | null> {
  const start = Math.floor(new Date(since + 'T00:00:00Z').getTime() / 1000) - 86400 * 4;
  const r = await chart(
    symbol,
    { period1: String(start), period2: String(Math.floor(Date.now() / 1000)), interval: '1d' },
    60 * 10,
  );
  if (!r) return null;
  const b = bars(r);
  const sinceMs = new Date(since + 'T00:00:00Z').getTime();
  const first = b.find((x) => x.t >= sinceMs - 86400_000) ?? b[0];
  const price = r.meta.regularMarketPrice ?? b[b.length - 1]?.close;
  if (!first || price == null) return null;
  return {
    startPrice: first.close,
    startDate: new Date(first.t).toISOString().slice(0, 10),
    price,
    pct: ((price - first.close) / first.close) * 100,
    currency: r.meta.currency ?? null,
  };
}

/** Rates to convert each currency into `base`. Missing rates are left out. */
export async function getFxRates(currencies: string[], base: string): Promise<Record<string, number>> {
  const need = Array.from(new Set(currencies.map((c) => c.toUpperCase()))).filter((c) => c && c !== base.toUpperCase());
  const quotes = await getQuotes(need.map((c) => fxSymbol(c, base)));
  const out: Record<string, number> = { [base.toUpperCase()]: 1 };
  for (const c of need) {
    const q = quotes[fxSymbol(c, base)];
    if (q?.price) out[c] = q.price;
  }
  return out;
}
