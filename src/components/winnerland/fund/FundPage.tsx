'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { HoldingView, PortfolioResponse } from '@/lib/winnerland/types';

import { useMember } from '../AuthProvider';
import Activity from './Activity';
import Allocation from './Allocation';
import CompetitionTeaser from './CompetitionTeaser';
import Hero from './Hero';
import HoldingDrawer from './HoldingDrawer';
import Holdings from './Holdings';
import Performance from './Performance';

export default function FundPage() {
  const { api, split } = useMember();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<HoldingView | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<PortfolioResponse>('/api/portfolio'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the fund.');
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh every minute while a market is open, otherwise every 10 minutes.
  useEffect(() => {
    const ms = data?.live?.isOpen ? 60_000 : 600_000;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, ms);
    return () => clearInterval(id);
  }, [data?.live?.isOpen, load]);

  const closeDrawer = useCallback(() => setOpen(null), []);

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
      <Hero data={data} f={f} split={split} />
      <Performance data={data} f={f} />
      <div className="wl-columns">
        <Holdings holdings={data.holdings} f={f} onOpen={setOpen} />
        <div className="wl-sidebar">
          <Allocation holdings={data.holdings} cash={data.totals.cash} total={data.totals.value} f={f} />
          <CompetitionTeaser />
          <Activity items={data.activity} f={f} />
        </div>
      </div>
      {open && <HoldingDrawer holding={open} f={f} onClose={closeDrawer} />}
    </div>
  );
}
