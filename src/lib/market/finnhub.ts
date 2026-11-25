/**
 * Live US stock quotes from Finnhub (https://finnhub.io), used when
 * FINNHUB_API_KEY is set. The free plan covers US-listed stocks and ETFs only:
 * no ASX/NZX, currency rates or price history, so those keep their fallbacks.
 * Free plan limit: 60 calls a minute, so responses are cached by Next.js.
 */
import type { Quote } from './yahoo';

const BASE = 'https://finnhub.io/api/v1';

export const hasFinnhub = () => !!process.env.FINNHUB_API_KEY;

/**
 * Yahoo-style symbol → Finnhub symbol, or null when Finnhub's free plan can't
 * price it. Plain US tickers have no exchange suffix ("AMZN", "BRK-B");
 * crypto ("BTC-USD") and currencies ("USDNZD=X") are excluded.
 */
export function finnhubSymbol(yahoo: string): string | null {
  const s = yahoo.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]*(-[A-Z])?$/.test(s)) return null;
  return s.replace('-', '.'); // Finnhub writes share classes as "BRK.B"
}

async function call<T>(path: string, revalidate: number): Promise<T | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'X-Finnhub-Token': key },
      next: { revalidate },
    });
    if (!res.ok) return null; // 403 = not on the free plan, 429 = over the limit
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface FinnhubQuote {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // change %
  pc: number; // previous close
  t: number; // epoch seconds
}

interface FinnhubProfile {
  name?: string;
}

interface FinnhubMarketStatus {
  isOpen?: boolean;
}

// One shared "is the US market open?" lookup per minute, instead of one per
// holding, so a full page of quotes stays well under the 60 calls/minute limit.
let statusCache: { at: number; value: Promise<FinnhubMarketStatus | null> } | null = null;
function usMarketStatus(): Promise<FinnhubMarketStatus | null> {
  if (!statusCache || Date.now() - statusCache.at > 60_000) {
    statusCache = { at: Date.now(), value: call<FinnhubMarketStatus>('/stock/market-status?exchange=US', 60) };
  }
  return statusCache.value;
}

export async function getFinnhubQuote(yahoo: string): Promise<Quote | null> {
  const sym = finnhubSymbol(yahoo);
  if (!sym) return null;
  const enc = encodeURIComponent(sym);
  const [q, profile, status] = await Promise.all([
    call<FinnhubQuote>(`/quote?symbol=${enc}`, 60),
    // Company names rarely change, so cache them for a week to save calls.
    call<FinnhubProfile>(`/stock/profile2?symbol=${enc}`, 60 * 60 * 24 * 7),
    usMarketStatus(),
  ]);
  // Unknown symbols come back as 200 with all zeros.
  if (!q || !q.c || !q.t) return null;
  const prev = q.pc || null;
  return {
    symbol: yahoo,
    name: profile?.name || null,
    // US listings always trade in USD. (The profile's currency is the company's
    // reporting currency, e.g. CNY for Alibaba, so it isn't used here.)
    currency: 'USD',
    price: q.c,
    previousClose: prev,
    change: q.d ?? (prev != null ? q.c - prev : null),
    changePct: q.dp ?? (prev ? ((q.c - prev) / prev) * 100 : null),
    time: new Date(q.t * 1000).toISOString(),
    isOpen: !!status?.isOpen,
    intraday: [], // price history isn't on Finnhub's free plan
  };
}
