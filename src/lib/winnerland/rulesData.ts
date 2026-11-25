/**
 * Gathers what the shareholder-agreement checks need from the pf_* tables
 * (see ./rules.ts for the rules themselves).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  type CashPlan,
  cashPlan,
  checkRules,
  COMPETITION_KEY,
  type RuleCheck,
  type RulesSettings,
  SAFE_FUND,
} from './rules';

type Row = Record<string, unknown>;
const n = (v: unknown) => {
  const x = Number(v);
  return v == null || v === '' || !Number.isFinite(x) ? null : x;
};
const DAY = 86400_000;

async function selectAll(db: SupabaseClient, table: string, columns: string, apply: (q: any) => any): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(db.from(table).select(columns)).range(from, from + 999);
    if (error) throw new Error(`Reading ${table} failed: ${error.message}`);
    out.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function buildRules(
  db: SupabaseClient,
  ctx: {
    today: string;
    holdings: { symbol: string; assetCategory: string | null; value: number }[];
    cash: number;
    total: number;
    members: number;
    settings: RulesSettings;
    /** Fund value per day from IBKR (yyyy-mm-dd → base currency). */
    navByDate: Map<string, number>;
    cashRows: Row[];
  },
): Promise<{ rules: RuleCheck[]; cashPlan: CashPlan }> {
  const { settings, today } = ctx;
  const comp = new Set(settings.competitionSymbols);
  const groupOf = (sym: string) => (comp.has(sym.toUpperCase()) ? COMPETITION_KEY : sym.toUpperCase());
  const navDates = Array.from(ctx.navByDate.keys()).sort();
  const navOn = (d: string) => {
    let v: number | null = null;
    for (const x of navDates) {
      if (x <= d) v = ctx.navByDate.get(x)!;
      else break;
    }
    return v;
  };

  const since120 = new Date(Date.now() - 120 * DAY).toISOString().slice(0, 10);
  const [snapshots, recentBuys, allBuys] = await Promise.all([
    selectAll(db, 'pf_positions', 'report_date,symbol,position_value,fx_rate_to_base', (q) => q.gte('report_date', since120)),
    selectAll(db, 'pf_trades', 'trade_date,symbol,asset_category,quantity,net_cash,fx_rate_to_base', (q) =>
      q.gte('trade_date', since120).gt('quantity', 0),
    ),
    selectAll(db, 'pf_trades', 'symbol,trade_date', (q) => q.gt('quantity', 0)),
  ]);

  // ── When did each small holding (or the Competition ETF) drop below 1%? ──
  const weightByDate = new Map<string, Map<string, number>>(); // date → group → %
  for (const r of snapshots) {
    const d = String(r.report_date);
    const nav = ctx.navByDate.get(d);
    if (!nav) continue;
    const v = (n(r.position_value) ?? 0) * (n(r.fx_rate_to_base) ?? 1);
    if (!weightByDate.has(d)) weightByDate.set(d, new Map());
    const m = weightByDate.get(d)!;
    const g = groupOf(String(r.symbol));
    m.set(g, (m.get(g) ?? 0) + (v / nav) * 100);
  }
  const snapDates = Array.from(weightByDate.keys()).sort().reverse();
  const below1Since: Record<string, string | null> = {};
  const currentGroups = new Map<string, number>();
  for (const h of ctx.holdings) currentGroups.set(groupOf(h.symbol), (currentGroups.get(groupOf(h.symbol)) ?? 0) + h.value);
  for (const [g, v] of currentGroups) {
    if ((v / ctx.total) * 100 >= 1) continue;
    let since: string | null = null;
    for (const d of snapDates) {
      const w = weightByDate.get(d)!.get(g);
      if (w == null || w >= 1) break;
      since = d;
    }
    below1Since[g] = since;
  }

  // ── Buys under 3% of the fund (last 120 days) ──
  const buys = new Map<string, number>(); // "SYM|date" → NZD
  for (const t of recentBuys) {
    const sym = String(t.symbol).toUpperCase();
    if (String(t.asset_category ?? '').toUpperCase() === 'CASH') continue; // currency conversions
    if (comp.has(sym) || (SAFE_FUND as readonly string[]).includes(sym)) continue;
    const k = `${sym}|${t.trade_date}`;
    buys.set(k, (buys.get(k) ?? 0) + Math.abs((n(t.net_cash) ?? 0) * (n(t.fx_rate_to_base) ?? 1)));
  }
  const smallBuys = Array.from(buys.entries())
    .map(([k, amount]) => {
      const [symbol, date] = k.split('|');
      const nav = navOn(date);
      return { symbol, date, amount, pct: nav ? (amount / nav) * 100 : 100 };
    })
    .filter((b) => b.pct < 3)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // ── Dividends not yet reinvested in the holding that paid them ──
  const lastBuy = new Map<string, string>();
  for (const t of allBuys) {
    const sym = String(t.symbol).toUpperCase();
    const d = String(t.trade_date);
    if (!lastBuy.has(sym) || d > lastBuy.get(sym)!) lastBuy.set(sym, d);
  }
  const held = new Set(ctx.holdings.map((h) => h.symbol.toUpperCase()));
  const divs = new Map<string, number>();
  for (const c of ctx.cashRows) {
    const sym = String(c.symbol ?? '').toUpperCase();
    const type = String(c.type ?? '');
    if (!held.has(sym) || !/dividend|in lieu|withholding/i.test(type)) continue;
    const since = lastBuy.get(sym);
    if (since && String(c.date) <= since) continue;
    divs.set(sym, (divs.get(sym) ?? 0) + (n(c.amount) ?? 0) * (n(c.fx_rate_to_base) ?? 1));
  }
  const dividendsToReinvest = Array.from(divs.entries()).map(([symbol, amount]) => ({ symbol, amount, since: lastBuy.get(symbol) ?? null }));

  const rules = checkRules({
    today,
    holdings: ctx.holdings,
    cash: ctx.cash,
    total: ctx.total,
    settings,
    below1Since,
    smallBuys,
    dividendsToReinvest,
  });

  const deposits = ctx.cashRows
    .filter((c) => /deposit/i.test(String(c.type ?? '')) && (n(c.amount) ?? 0) > 0)
    .map((c) => ({ date: String(c.date), amount: (n(c.amount) ?? 0) * (n(c.fx_rate_to_base) ?? 1) }));

  return {
    rules,
    cashPlan: cashPlan({ today, cash: ctx.cash, members: ctx.members, settings, deposits }),
  };
}
