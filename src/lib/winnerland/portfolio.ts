/**
 * Builds everything the Fund page needs from the pf_* tables (IBKR data),
 * optionally layering delayed live prices on top.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { yahooForPosition } from '@/lib/market/symbols';
import { getFxRates, getHistory, getQuotes, type Quote } from '@/lib/market/yahoo';

import type { ActivityItem, HoldingView, Point, PortfolioResponse } from './types';

type Row = Record<string, unknown>;
const n = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};
const s = (v: unknown): string | null => (v == null ? null : String(v));

/** Supabase caps a select at 1000 rows, so page through bigger tables. */
async function selectAll(
  db: SupabaseClient,
  table: string,
  columns: string,
  apply?: (q: any) => any, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(columns);
    if (apply) q = apply(q);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw new Error(`Reading ${table} failed: ${error.message}`);
    out.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const isDepositType = (t: string) => /deposit|withdraw/i.test(t);
const isDividendType = (t: string) => /dividend|in lieu/i.test(t);

function activityKind(type: string, amount: number): ActivityItem['kind'] {
  if (isDepositType(type)) return amount >= 0 ? 'deposit' : 'withdrawal';
  if (isDividendType(type)) return 'dividend';
  if (/withholding|tax/i.test(type)) return 'tax';
  if (/interest/i.test(type)) return 'interest';
  if (/fee|commission/i.test(type)) return 'fee';
  return 'other';
}

export async function buildPortfolio(
  db: SupabaseClient,
  opts: { live: boolean },
): Promise<PortfolioResponse> {
  const [settingsRows, navRows, cashRows, syncRows, latestPos] = await Promise.all([
    selectAll(db, 'pf_settings', 'key,value'),
    selectAll(db, 'pf_nav_daily', 'account_id,report_date,total,cash,source', (q) =>
      q.order('report_date', { ascending: true }),
    ),
    selectAll(db, 'pf_cash_transactions', 'account_id,transaction_id,date,type,symbol,description,currency,amount,fx_rate_to_base', (q) =>
      q.order('date', { ascending: true }),
    ),
    db.from('pf_sync_runs').select('started_at,finished_at,status,message').order('started_at', { ascending: false }).limit(1),
    db.from('pf_positions').select('report_date').order('report_date', { ascending: false }).limit(1),
  ]);

  const settings = Object.fromEntries(settingsRows.map((r) => [String(r.key), r.value]));
  const baseCurrency = String(settings.base_currency ?? 'NZD');
  const memberCount = Math.max(1, Number(settings.member_count ?? 11) || 11);
  const contributionsBefore = Number(settings.contributions_before_records ?? 0) || 0;

  // ── NAV history ───────────────────────────────────────────────────────────
  const ibkrByDate = new Map<string, number>();
  const cashByAccount = new Map<string, { date: string; cash: number }>();
  const legacyByDate = new Map<string, number>();
  const accounts = new Set<string>();
  for (const r of navRows) {
    const d = String(r.report_date);
    const total = n(r.total) ?? 0;
    if (r.source === 'legacy') {
      legacyByDate.set(d, total);
      continue;
    }
    accounts.add(String(r.account_id));
    ibkrByDate.set(d, (ibkrByDate.get(d) ?? 0) + total);
    const prev = cashByAccount.get(String(r.account_id));
    if (!prev || d >= prev.date) cashByAccount.set(String(r.account_id), { date: d, cash: n(r.cash) ?? 0 });
  }
  const firstIbkr = Array.from(ibkrByDate.keys()).sort()[0];
  const navMap = new Map<string, number>();
  for (const [d, v] of legacyByDate) if (!firstIbkr || d < firstIbkr) navMap.set(d, v);
  for (const [d, v] of ibkrByDate) navMap.set(d, v);
  const nav: Point[] = Array.from(navMap.entries())
    .filter(([, v]) => v > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));

  // ── Contributions (deposits minus withdrawals, running total) ─────────────
  let running = contributionsBefore;
  const contribByDate = new Map<string, number>();
  let hasDeposits = false;
  const yearAgo = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);
  let dividends12m = 0;
  for (const r of cashRows) {
    const type = String(r.type ?? '');
    const amt = (n(r.amount) ?? 0) * (n(r.fx_rate_to_base) ?? 1);
    if (isDepositType(type)) {
      hasDeposits = true;
      running += amt;
      contribByDate.set(String(r.date), running);
    }
    if (String(r.date) >= yearAgo && (isDividendType(type) || /withholding/i.test(type))) dividends12m += amt;
  }
  const contributions: Point[] = Array.from(contribByDate.entries());
  const contributionsTotal = hasDeposits || contributionsBefore ? running : null;

  // ── Holdings (latest snapshot per account) ────────────────────────────────
  const maxPosDate = (latestPos.data?.[0]?.report_date as string | undefined) ?? null;
  let positions: Row[] = [];
  if (maxPosDate) {
    const windowStart = new Date(new Date(maxPosDate).getTime() - 10 * 86400_000).toISOString().slice(0, 10);
    const recent = await selectAll(db, 'pf_positions', '*', (q) => q.gte('report_date', windowStart));
    const latestByAccount = new Map<string, string>();
    for (const p of recent) {
      const a = String(p.account_id);
      const d = String(p.report_date);
      if (!latestByAccount.has(a) || d > latestByAccount.get(a)!) latestByAccount.set(a, d);
    }
    positions = recent.filter((p) => latestByAccount.get(String(p.account_id)) === String(p.report_date));
  }

  // Merge the same instrument across accounts.
  type Agg = {
    key: string; symbol: string; name: string | null; assetCategory: string | null; currency: string;
    listingExchange: string | null; quantity: number; multiplier: number; markPrice: number | null;
    valueLocal: number; costLocal: number | null; fx: number;
  };
  const agg = new Map<string, Agg>();
  for (const p of positions) {
    const key = String(p.conid ?? p.symbol);
    const qty = n(p.quantity) ?? 0;
    if (qty === 0) continue;
    const cur = agg.get(key);
    const valueLocal = n(p.position_value) ?? qty * (n(p.mark_price) ?? 0) * (n(p.multiplier) ?? 1);
    const costLocal = n(p.cost_basis_money);
    if (cur) {
      cur.quantity += qty;
      cur.valueLocal += valueLocal;
      cur.costLocal = cur.costLocal != null && costLocal != null ? cur.costLocal + costLocal : null;
    } else {
      agg.set(key, {
        key,
        symbol: String(p.symbol),
        name: s(p.description),
        assetCategory: s(p.asset_category),
        currency: String(p.currency ?? baseCurrency),
        listingExchange: s(p.listing_exchange),
        quantity: qty,
        multiplier: n(p.multiplier) ?? 1,
        markPrice: n(p.mark_price),
        valueLocal,
        costLocal,
        fx: n(p.fx_rate_to_base) ?? 1,
      });
    }
  }
  const items = Array.from(agg.values());
  const cash = Array.from(cashByAccount.values()).reduce((a, b) => a + b.cash, 0);
  const latestNavTotal = nav.length ? nav[nav.length - 1][1] : 0;

  // ── Live prices (best-effort) ─────────────────────────────────────────────
  let quotes: Record<string, Quote> = {};
  let fxLive: Record<string, number> = {};
  const sparks: Record<string, number[]> = {};
  const yahooOf = (a: Agg) =>
    yahooForPosition({ symbol: a.symbol, listingExchange: a.listingExchange, assetCategory: a.assetCategory, currency: a.currency });
  if (opts.live && items.length) {
    const ys = items.map(yahooOf);
    const [q, f, hist] = await Promise.all([
      getQuotes(ys).catch(() => ({})),
      getFxRates(items.map((i) => i.currency), baseCurrency).catch(() => ({})),
      Promise.all(ys.map((y) => getHistory(y, '1mo').catch(() => []))),
    ]);
    quotes = q;
    fxLive = f;
    ys.forEach((y, i) => (sparks[y] = hist[i].map((b) => b.close)));
  }

  let liveCovered = 0;
  let dayChange = 0;
  let anyOpen = false;
  let latestQuoteTime: string | null = null;
  const holdings: HoldingView[] = items.map((a) => {
    const yahoo = yahooOf(a);
    const q = quotes[yahoo];
    const sameCurrency = q && (!q.currency || q.currency.toUpperCase() === a.currency.toUpperCase());
    const live = !!q && sameCurrency;
    const fxRate = fxLive[a.currency.toUpperCase()] ?? a.fx;
    const units = a.quantity * a.multiplier;
    const price = live ? q!.price : a.markPrice;
    const value = live ? units * q!.price * fxRate : a.valueLocal * a.fx;
    const cost = a.costLocal != null ? a.costLocal * a.fx : null;
    let dc: number | null = null;
    let dcp: number | null = null;
    if (live && q!.previousClose != null) {
      dc = units * (q!.price - q!.previousClose) * fxRate;
      dcp = q!.changePct;
      dayChange += dc;
      liveCovered += value;
      if (q!.isOpen) anyOpen = true;
      if (q!.time && (!latestQuoteTime || q!.time > latestQuoteTime)) latestQuoteTime = q!.time;
    }
    return {
      key: a.key,
      symbol: a.symbol,
      yahoo,
      name: q?.name && q.name.toUpperCase() !== yahoo.toUpperCase() ? q.name : a.name,
      assetCategory: a.assetCategory,
      currency: a.currency,
      quantity: a.quantity,
      price,
      avgCost: a.costLocal != null && units ? a.costLocal / units : null,
      value,
      cost,
      unrealized: cost != null ? value - cost : null,
      unrealizedPct: cost ? ((value - cost) / Math.abs(cost)) * 100 : null,
      weight: 0,
      dayChange: dc,
      dayChangePct: dcp,
      isLive: live,
      spark: sparks[yahoo] ?? [],
    };
  });

  const invested = holdings.reduce((a, h) => a + h.value, 0);
  const total = items.length ? invested + cash : latestNavTotal;
  for (const h of holdings) h.weight = total ? (h.value / total) * 100 : 0;
  holdings.sort((a, b) => b.value - a.value);

  const costBasis = holdings.every((h) => h.cost != null) && holdings.length ? holdings.reduce((a, h) => a + (h.cost ?? 0), 0) : null;
  const unrealized = costBasis != null ? invested - costBasis : null;

  const liveBlock =
    opts.live && liveCovered > 0
      ? {
          total,
          dayChange,
          dayChangePct: total - dayChange ? (dayChange / (total - dayChange)) * 100 : 0,
          isOpen: anyOpen,
          asOf: latestQuoteTime,
          coverage: invested ? liveCovered / invested : 0,
        }
      : null;

  // ── Intraday curve (sum of each holding's 5-minute prices + cash) ─────────
  let intraday: [number, number][] = [];
  if (liveBlock) {
    const grid = new Set<number>();
    const series = items.map((a) => {
      const q = quotes[yahooOf(a)];
      const pts = q?.intraday ?? [];
      pts.forEach(([t]) => grid.add(t));
      return { a, q, pts };
    });
    const times = Array.from(grid).sort((x, y) => x - y);
    // Only meaningful when most of the fund trades in the same session.
    if (times.length > 3) {
      const cursors = series.map(() => 0);
      intraday = times.map((t) => {
        let v = cash;
        series.forEach(({ a, q, pts }, i) => {
          while (cursors[i] + 1 < pts.length && pts[cursors[i] + 1][0] <= t) cursors[i]++;
          const units = a.quantity * a.multiplier;
          const fxRate = fxLive[a.currency.toUpperCase()] ?? a.fx;
          const p = pts.length && pts[cursors[i]][0] <= t ? pts[cursors[i]][1] : (q?.previousClose ?? a.markPrice ?? 0);
          v += units * p * fxRate;
        });
        return [t, Math.round(v * 100) / 100] as [number, number];
      });
    }
  }

  // ── Recent activity ───────────────────────────────────────────────────────
  const tradesRes = await db
    .from('pf_trades')
    .select('trade_id,trade_date,symbol,buy_sell,quantity,trade_price,currency,net_cash,fx_rate_to_base,realized_pnl')
    .order('trade_date', { ascending: false })
    .limit(60);
  const trades = (tradesRes.data ?? []) as Row[];
  const realized12m = (await selectAll(db, 'pf_trades', 'realized_pnl,fx_rate_to_base', (q) => q.gte('trade_date', yearAgo))).reduce(
    (a, r) => a + (n(r.realized_pnl) ?? 0) * (n(r.fx_rate_to_base) ?? 1),
    0,
  );

  const activity: ActivityItem[] = [
    ...trades.map((t): ActivityItem => {
      const qty = n(t.quantity) ?? 0;
      const sell = String(t.buy_sell ?? '').toUpperCase().startsWith('SELL') || qty < 0;
      return {
        id: 't' + t.trade_id,
        date: String(t.trade_date),
        kind: sell ? 'sell' : 'buy',
        symbol: s(t.symbol),
        label: `${sell ? 'Sold' : 'Bought'} ${Math.abs(qty).toLocaleString('en-NZ', { maximumFractionDigits: 4 })} ${t.symbol}`,
        quantity: Math.abs(qty),
        price: n(t.trade_price),
        currency: s(t.currency),
        amountBase: (n(t.net_cash) ?? 0) * (n(t.fx_rate_to_base) ?? 1),
      };
    }),
    ...cashRows
      .slice(-80)
      .map((c): ActivityItem => {
        const amt = (n(c.amount) ?? 0) * (n(c.fx_rate_to_base) ?? 1);
        const kind = activityKind(String(c.type ?? ''), amt);
        const sym = s(c.symbol);
        const labels: Record<ActivityItem['kind'], string> = {
          deposit: 'Money in',
          withdrawal: 'Money out',
          dividend: sym ? `Dividend from ${sym}` : 'Dividend',
          tax: sym ? `Tax withheld on ${sym}` : 'Tax withheld',
          interest: 'Interest',
          fee: 'Fees',
          other: String(c.type ?? 'Cash movement'),
          buy: '',
          sell: '',
        };
        return {
          id: 'c' + c.transaction_id,
          date: String(c.date),
          kind,
          symbol: sym,
          label: labels[kind],
          quantity: null,
          price: null,
          currency: s(c.currency),
          amountBase: amt,
        };
      }),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 40);

  const sync = syncRows.data?.[0] as Row | undefined;
  const gain = contributionsTotal != null ? total - contributionsTotal : null;

  return {
    baseCurrency,
    memberCount,
    accounts: Array.from(accounts),
    asOf: maxPosDate ?? (nav.length ? nav[nav.length - 1][0] : null),
    lastSync: sync
      ? { at: String(sync.finished_at ?? sync.started_at), status: String(sync.status), message: s(sync.message) }
      : null,
    totals: {
      value: total,
      cash,
      invested,
      costBasis,
      unrealized,
      contributions: contributionsTotal,
      gain,
      gainPct: gain != null && contributionsTotal ? (gain / contributionsTotal) * 100 : null,
      dividends12m,
      realized12m,
    },
    live: liveBlock,
    nav,
    contributions,
    intraday,
    holdings,
    activity,
    empty: nav.length === 0 && holdings.length === 0,
  };
}
