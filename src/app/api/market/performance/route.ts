import { yahooForTicker } from '@/lib/market/symbols';
import { getPerformanceSince } from '@/lib/market/yahoo';
import { errorResponse, requireMember } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface Item {
  id: string;
  ticker: string;
  market?: string | null;
  since: string; // YYYY-MM-DD
}

/** POST { items: [{ id, ticker, market, since }] } → how each ticker has moved since `since`. */
export async function POST(req: Request) {
  try {
    await requireMember(req);
    const body = (await req.json()) as { items?: Item[] };
    const items = (body.items ?? []).slice(0, 150);
    const results: Record<string, unknown> = {};
    let i = 0;
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (i < items.length) {
          const it = items[i++];
          const since = /^\d{4}-\d{2}-\d{2}$/.test(it.since) ? it.since : new Date().toISOString().slice(0, 10);
          const perf = await getPerformanceSince(yahooForTicker(it.ticker, it.market), since).catch(() => null);
          if (perf) results[it.id] = perf;
        }
      }),
    );
    return Response.json({ results });
  } catch (err) {
    return errorResponse(err);
  }
}
