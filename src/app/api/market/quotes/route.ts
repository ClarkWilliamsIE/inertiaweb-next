import { yahooForTicker } from '@/lib/market/symbols';
import { getQuotes } from '@/lib/market/yahoo';
import { errorResponse, requireMember } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** GET /api/market/quotes?tickers=NVDA,AIR.NZ,BTC  → latest delayed prices, keyed by ticker. */
export async function GET(req: Request) {
  try {
    await requireMember(req);
    const url = new URL(req.url);
    const tickers = (url.searchParams.get('tickers') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 80);
    const map = Object.fromEntries(tickers.map((t) => [t, yahooForTicker(t)]));
    const quotes = await getQuotes(Object.values(map));
    const out: Record<string, unknown> = {};
    for (const t of tickers) {
      const q = quotes[map[t]];
      if (q) {
        const { intraday: _intraday, ...rest } = q; // eslint-disable-line @typescript-eslint/no-unused-vars
        out[t] = rest;
      }
    }
    return Response.json({ quotes: out });
  } catch (err) {
    return errorResponse(err);
  }
}
