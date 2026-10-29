import type { SupabaseClient } from '@supabase/supabase-js';

import type { FlexParseResult } from './parse';

async function upsertChunks(
  db: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw new Error(`Saving ${table} failed: ${error.message}`);
  }
}

export interface StoreCounts {
  accounts: string[];
  navDays: number;
  positions: number;
  trades: number;
  cashTransactions: number;
  positionsDate: string | null;
  from: string | null;
  to: string | null;
}

/** Writes a parsed Flex statement into the pf_* tables (idempotent, safe to re-run). */
export async function storeFlexResult(db: SupabaseClient, parsed: FlexParseResult): Promise<StoreCounts> {
  const counts: StoreCounts = {
    accounts: [],
    navDays: 0,
    positions: 0,
    trades: 0,
    cashTransactions: 0,
    positionsDate: null,
    from: null,
    to: null,
  };

  for (const st of parsed.statements) {
    counts.accounts.push(st.accountId);
    if (st.fromDate && (!counts.from || st.fromDate < counts.from)) counts.from = st.fromDate;
    if (st.toDate && (!counts.to || st.toDate > counts.to)) counts.to = st.toDate;

    await upsertChunks(
      db,
      'pf_nav_daily',
      st.nav.map((n) => ({
        account_id: n.accountId,
        report_date: n.reportDate,
        currency: n.currency ?? st.baseCurrency,
        cash: n.cash,
        stock: n.stock,
        options: n.options,
        funds: n.funds,
        crypto: n.crypto,
        interest_accruals: n.interestAccruals,
        dividend_accruals: n.dividendAccruals,
        total: n.total,
        source: 'ibkr',
      })),
      'account_id,report_date',
    );
    counts.navDays += st.nav.length;

    // Positions are a snapshot per report date: replace that day's snapshot so
    // anything sold no longer shows.
    const dates = Array.from(new Set(st.positions.map((p) => p.reportDate)));
    for (const d of dates) {
      const { error } = await db
        .from('pf_positions')
        .delete()
        .eq('account_id', st.accountId)
        .eq('report_date', d);
      if (error) throw new Error(`Clearing positions failed: ${error.message}`);
    }
    await upsertChunks(
      db,
      'pf_positions',
      st.positions.map((p) => ({
        account_id: p.accountId,
        report_date: p.reportDate,
        conid: p.conid,
        symbol: p.symbol,
        description: p.description,
        asset_category: p.assetCategory,
        currency: p.currency,
        listing_exchange: p.listingExchange,
        quantity: p.quantity,
        multiplier: p.multiplier,
        mark_price: p.markPrice,
        position_value: p.positionValue,
        cost_basis_price: p.costBasisPrice,
        cost_basis_money: p.costBasisMoney,
        unrealized_pnl: p.unrealizedPnl,
        fx_rate_to_base: p.fxRateToBase,
        percent_of_nav: p.percentOfNav,
      })),
      'account_id,report_date,conid',
    );
    counts.positions += st.positions.length;
    for (const d of dates) if (!counts.positionsDate || d > counts.positionsDate) counts.positionsDate = d;

    await upsertChunks(
      db,
      'pf_trades',
      st.trades.map((t) => ({
        account_id: t.accountId,
        trade_id: t.tradeId,
        trade_date: t.tradeDate,
        date_time: t.dateTime,
        symbol: t.symbol,
        description: t.description,
        conid: t.conid,
        asset_category: t.assetCategory,
        currency: t.currency,
        buy_sell: t.buySell,
        quantity: t.quantity,
        trade_price: t.tradePrice,
        proceeds: t.proceeds,
        commission: t.commission,
        net_cash: t.netCash,
        fx_rate_to_base: t.fxRateToBase,
        realized_pnl: t.realizedPnl,
      })),
      'account_id,trade_id',
    );
    counts.trades += st.trades.length;

    await upsertChunks(
      db,
      'pf_cash_transactions',
      st.cash.map((c) => ({
        account_id: c.accountId,
        transaction_id: c.transactionId,
        date: c.date,
        date_time: c.dateTime,
        type: c.type,
        symbol: c.symbol,
        description: c.description,
        currency: c.currency,
        amount: c.amount,
        fx_rate_to_base: c.fxRateToBase,
      })),
      'account_id,transaction_id',
    );
    counts.cashTransactions += st.cash.length;

    if (st.baseCurrency) {
      await db
        .from('pf_settings')
        .upsert({ key: 'base_currency', value: st.baseCurrency }, { onConflict: 'key' });
    }
  }
  return counts;
}

export async function startSyncRun(db: SupabaseClient, trigger: string): Promise<number | null> {
  const { data } = await db.from('pf_sync_runs').insert({ trigger, status: 'running' }).select('id').single();
  return (data?.id as number | undefined) ?? null;
}

export async function finishSyncRun(
  db: SupabaseClient,
  id: number | null,
  status: 'success' | 'error',
  message: string,
  counts?: StoreCounts,
) {
  if (id == null) return;
  await db
    .from('pf_sync_runs')
    .update({
      status,
      message: message.slice(0, 2000),
      finished_at: new Date().toISOString(),
      report_from: counts?.from ?? null,
      report_to: counts?.to ?? null,
      counts: counts ?? null,
    })
    .eq('id', id);
}
