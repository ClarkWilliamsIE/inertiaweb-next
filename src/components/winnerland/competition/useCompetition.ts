'use client';

import { useCallback, useEffect, useState } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';

import { useMember } from '../AuthProvider';

export const STAKE = 1000;

export interface Entrant {
  id: string;
  name: string;
  ticker: string;
  startPrice: number;
  price: number;
  pct: number;
  value: number;
  dayPct: number | null;
  live: boolean;
}

interface QuoteLite {
  price: number;
  changePct: number | null;
}

/** ETF competition: each member's $1,000 notional stake in one stock. */
export function useCompetition() {
  const { api } = useMember();
  const [entrants, setEntrants] = useState<Entrant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error: dbError } = await getBrowserSupabase().from('etf_members').select('*').order('name');
      if (dbError) throw dbError;
      const rows = (data ?? []) as { id: string; name: string; ticker: string; start_price: number; current_price: number }[];
      let quotes: Record<string, QuoteLite> = {};
      const tickers = Array.from(new Set(rows.map((r) => r.ticker))).join(',');
      if (tickers) {
        try {
          quotes = (await api<{ quotes: Record<string, QuoteLite> }>(`/api/market/quotes?tickers=${encodeURIComponent(tickers)}`)).quotes;
        } catch {
          quotes = {};
        }
      }
      const list = rows.map((r): Entrant => {
        const start = Number(r.start_price) || 1;
        const q = quotes[r.ticker];
        const price = q?.price ?? (Number(r.current_price) || start);
        const pct = ((price - start) / start) * 100;
        return {
          id: String(r.id),
          name: r.name,
          ticker: r.ticker,
          startPrice: start,
          price,
          pct,
          value: STAKE * (1 + pct / 100),
          dayPct: q?.changePct ?? null,
          live: !!q,
        };
      });
      list.sort((a, b) => b.pct - a.pct);
      setEntrants(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the competition.');
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return { entrants, error, reload: load };
}
