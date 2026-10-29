import { getHistory, type HistoryRange } from '@/lib/market/yahoo';
import { errorResponse, requireMember } from '@/lib/supabase/server';
import type { HoldingDetailResponse } from '@/lib/winnerland/types';

export const dynamic = 'force-dynamic';

const RANGES: HistoryRange[] = ['1mo', '3mo', '6mo', 'ytd', '1y', '2y', '5y', 'max'];

export async function GET(req: Request) {
  try {
    const { db } = await requireMember(req);
    const url = new URL(req.url);
    const symbol = (url.searchParams.get('symbol') ?? '').trim();
    const yahoo = (url.searchParams.get('yahoo') ?? symbol).trim();
    const rangeParam = url.searchParams.get('range') as HistoryRange | null;
    const range: HistoryRange = rangeParam && RANGES.includes(rangeParam) ? rangeParam : '1y';
    if (!symbol) return Response.json({ error: 'symbol is required' }, { status: 400 });

    const [history, trades, divs] = await Promise.all([
      getHistory(yahoo, range).catch(() => []),
      db
        .from('pf_trades')
        .select('trade_date,buy_sell,quantity,trade_price,currency')
        .eq('symbol', symbol)
        .order('trade_date', { ascending: true })
        .limit(500),
      db
        .from('pf_cash_transactions')
        .select('type,amount,fx_rate_to_base')
        .eq('symbol', symbol)
        .limit(1000),
    ]);

    const dividendsBase = (divs.data ?? [])
      .filter((d) => /dividend|in lieu|withholding/i.test(String(d.type)))
      .reduce((a, d) => a + Number(d.amount ?? 0) * Number(d.fx_rate_to_base ?? 1), 0);

    const body: HoldingDetailResponse = {
      symbol,
      yahoo,
      currency: null,
      history: history.map((b) => [b.t, b.close]),
      trades: (trades.data ?? []).map((t) => ({
        date: String(t.trade_date),
        side: String(t.buy_sell ?? (Number(t.quantity) < 0 ? 'SELL' : 'BUY')),
        quantity: Math.abs(Number(t.quantity ?? 0)),
        price: t.trade_price == null ? null : Number(t.trade_price),
        currency: t.currency ?? null,
      })),
      dividendsBase,
    };
    return Response.json(body);
  } catch (err) {
    return errorResponse(err);
  }
}
