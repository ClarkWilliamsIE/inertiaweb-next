/**
 * Price history built from our own saved data: every IBKR sync stores each
 * holding's closing price (mark_price) in pf_positions for that day. Used for
 * holding charts and sparklines when Yahoo has no data (it often refuses
 * server requests, and Finnhub's free plan has no history). The history grows
 * by one point per weekday sync, plus a point per imported statement.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { HistoryRange } from '@/lib/market/yahoo';

const DAY = 86400_000;

/** First date (yyyy-mm-dd) covered by a chart range, or null for "max". */
export function rangeStart(range: HistoryRange, now = new Date()): string | null {
  const days: Partial<Record<HistoryRange, number>> = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 366, '2y': 731, '5y': 1827 };
  if (range === 'max') return null;
  if (range === 'ytd') return `${now.getUTCFullYear()}-01-01`;
  return new Date(now.getTime() - (days[range] ?? 366) * DAY).toISOString().slice(0, 10);
}

/** Daily closes per symbol, oldest first, as [epoch ms, price]. */
export async function snapshotPrices(
  db: SupabaseClient,
  symbols: string[],
  since: string | null,
): Promise<Map<string, [number, number][]>> {
  const out = new Map<string, [number, number][]>();
  if (!symbols.length) return out;

  const byDay = new Map<string, Map<string, number>>(); // symbol → date → price
  for (let from = 0; ; from += 1000) {
    let q = db.from('pf_positions').select('symbol,report_date,mark_price').in('symbol', symbols);
    if (since) q = q.gte('report_date', since);
    const { data, error } = await q.order('report_date', { ascending: true }).range(from, from + 999);
    if (error) throw new Error(`Reading pf_positions failed: ${error.message}`);
    for (const r of data ?? []) {
      const price = Number(r.mark_price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const sym = String(r.symbol);
      if (!byDay.has(sym)) byDay.set(sym, new Map());
      byDay.get(sym)!.set(String(r.report_date), price); // one price per day, even across accounts
    }
    if (!data || data.length < 1000) break;
  }

  for (const [sym, days] of byDay) {
    out.set(
      sym,
      Array.from(days.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([d, p]) => [Date.parse(`${d}T00:00:00Z`), p] as [number, number]),
    );
  }
  return out;
}
