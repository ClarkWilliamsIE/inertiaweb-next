'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { relativeTime } from '@/lib/winnerland/format';
import type { HoldingView, PortfolioResponse } from '@/lib/winnerland/types';

import { useMember } from '../AuthProvider';
import Activity from './Activity';
import Allocation from './Allocation';
import { CashPanel, ComingUp } from './CashPanel';
import CompetitionDrawer, { COMPETITION_ROW_KEY, competitionRow } from './CompetitionDrawer';
import CompetitionTeaser from './CompetitionTeaser';
import Hero from './Hero';
import HoldingDrawer from './HoldingDrawer';
import Holdings from './Holdings';
import Performance from './Performance';
import RulesPanel from './RulesPanel';
import { readFundCache, writeFundCache } from '../fundCache';

export default function FundPage() {
  const { api, split } = useMember();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<HoldingView | null>(null);
  // "Updating…" while fresh data loads behind what's on screen.
  const [updating, setUpdating] = useState(false);
  // When what's on screen was fetched (cache or network), for the status note.
  const [shownAt, setShownAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setUpdating(true);
    try {
      const fresh = await api<PortfolioResponse>('/api/portfolio');
      setData(fresh);
      setShownAt(new Date().toISOString());
      writeFundCache(fresh);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the fund.');
    } finally {
      setUpdating(false);
    }
  }, [api]);

  // First paint: last saved data if there is any; otherwise a quick load
  // without live prices (database only) before the full one.
  useEffect(() => {
    let alive = true;
    const cached = readFundCache();
    if (cached) {
      setData(cached.data);
      setShownAt(cached.savedAt);
      load();
    } else {
      setUpdating(true);
      api<PortfolioResponse>('/api/portfolio?live=0')
        .then((quick) => {
          if (alive) setData((cur) => cur ?? quick);
        })
        .catch(() => {})
        .finally(() => alive && load());
    }
    return () => {
      alive = false;
    };
  }, [api, load]);

  // Refresh every minute while a market is open, otherwise every 10 minutes.
  useEffect(() => {
    const ms = data?.live?.isOpen ? 60_000 : 600_000;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, ms);
    return () => clearInterval(id);
  }, [data?.live?.isOpen, load]);

  const closeDrawer = useCallback(() => setOpen(null), []);

  // Competition picks show as one "Competition ETF" row; open it to see the picks.
  const { rows, picks, compRow } = useMemo(() => {
    const comp = new Set((data?.competitionSymbols ?? []).map((s) => s.toUpperCase()));
    const all = data?.holdings ?? [];
    const picks = all.filter((h) => comp.has(h.symbol.toUpperCase()));
    const compRow = competitionRow(picks);
    const rest = all.filter((h) => !comp.has(h.symbol.toUpperCase()));
    return { rows: compRow ? [...rest, compRow] : rest, picks, compRow };
  }, [data]);
  const [compOpen, setCompOpen] = useState(false);
  const closeComp = useCallback(() => setCompOpen(false), []);
  const openRow = useCallback((h: HoldingView) => (h.key === COMPETITION_ROW_KEY ? setCompOpen(true) : setOpen(h)), []);

  if (error && !data) {
    return (
      <div className="wl-notice wl-notice--error" role="alert">
        <h1 className="wl-h2">The fund didn’t load</h1>
        <p>{error}</p>
        <button type="button" className="wl-btn" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wl-loading" aria-busy="true" aria-label="Loading the fund">
        <div className="wl-skeleton" style={{ height: 24, width: 280 }} />
        <div className="wl-skeleton" style={{ height: 120, width: '70%', marginTop: 24 }} />
        <div className="wl-skeleton" style={{ height: 56, marginTop: 24 }} />
        <div className="wl-skeleton" style={{ height: 340, marginTop: 32 }} />
      </div>
    );
  }

  if (data.empty) {
    return (
      <div className="wl-notice">
        <h1 className="wl-h2">No IBKR data yet</h1>
        <p>
          The dashboard fills in after the first sync from Interactive Brokers. Check the Flex Query settings are in
          place, then run a sync from the Admin page.
        </p>
        <Link href="/winnerland/admin" className="wl-btn">
          Go to Admin
        </Link>
      </div>
    );
  }

  const f = split ? data.memberCount : 1;

  return (
    <div className="wl-fund">
      <div className="wl-refresh" role="status" aria-live="polite">
        {updating ? (
          <span className="wl-refresh__pill">
            <span className="wl-refresh__dot" aria-hidden="true" />
            Updating…
          </span>
        ) : error ? (
          <span className="wl-refresh__pill is-error">
            Couldn’t refresh · showing data from {relativeTime(shownAt)}
            <button type="button" className="wl-link" onClick={load}>
              Retry
            </button>
          </span>
        ) : null}
      </div>
      <Hero data={data} f={f} split={split} />
      <Performance data={data} f={f} />
      <div className="wl-columns">
        <Holdings holdings={rows} f={f} onOpen={openRow} />
        <div className="wl-sidebar">
          {data.cashPlan && <CashPanel plan={data.cashPlan} f={f} />}
          <Allocation holdings={rows} cash={data.totals.cash} total={data.totals.value} f={f} />
          <ComingUp today={new Date().toISOString().slice(0, 10)} />
          <CompetitionTeaser />
          <Activity items={data.activity} f={f} />
        </div>
      </div>
      <div className="wl-bottom">
        <RulesPanel rules={data.rules} />
      </div>
      {compOpen && compRow && (
        <CompetitionDrawer row={compRow} picks={picks} f={f} onClose={closeComp} onOpen={(h) => setOpen(h)} />
      )}
      {open && <HoldingDrawer holding={open} f={f} onClose={closeDrawer} />}
    </div>
  );
}
