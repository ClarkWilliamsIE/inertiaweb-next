'use client';

import type { ReactNode } from 'react';

import { dayLabel, money, pct, relativeTime, tone } from '@/lib/winnerland/format';
import type { PortfolioResponse } from '@/lib/winnerland/types';

import { SplitToggle } from '../Shell';

interface Props {
  data: PortfolioResponse;
  f: number; // divisor: 1 for whole fund, member count for "my share"
  split: boolean;
}

function Delta({ v, children }: { v: number | null; children: ReactNode }) {
  return <span className={`wl-delta wl-tone-${tone(v)}`}>{children}</span>;
}

export default function Hero({ data, f, split }: Props) {
  const { totals, live } = data;
  const value = totals.value / f;
  const gain = totals.gain != null ? totals.gain / f : null;
  const put = totals.contributions != null ? totals.contributions / f : null;
  const unreal = totals.unrealized != null ? totals.unrealized / f : null;
  const day = live ? live.dayChange / f : null;

  // The club's long-running joke: the name follows the scoreboard.
  const score = gain ?? unreal ?? day ?? 0;
  const winning = score >= 0;

  const who = split ? 'Your share' : 'The fund';
  const whoPut = split ? 'you’ve' : 'members have';

  const dayWord = live?.isOpen ? 'today' : 'in the last session';

  return (
    <section className="wl-hero" aria-labelledby="wl-hero-title">
      <div className="wl-hero__bar">
        <p className="wl-hero__status">
          {live ? (
            <>
              <span className={`wl-pulse ${live.isOpen ? 'is-open' : ''}`} aria-hidden="true" />
              {live.isOpen ? 'Live prices, about 15 minutes delayed' : 'Markets closed'}
              {data.asOf && <> · IBKR statement to {dayLabel(data.asOf)}</>}
            </>
          ) : (
            <>
              <span className="wl-pulse" aria-hidden="true" />
              {data.asOf ? `IBKR closing prices for ${dayLabel(data.asOf, true)}` : 'Waiting for the first IBKR sync'}
            </>
          )}
        </p>
        <SplitToggle memberCount={data.memberCount} />
      </div>

      <h1 id="wl-hero-title" className={`wl-wordmark ${winning ? 'is-winning' : 'is-losing'}`}>
        {winning ? 'Winnerland' : 'Loserland'}
      </h1>

      <p className="wl-hero__lede">
        {who} is worth <strong className="wl-num">{money(value)}</strong>.{' '}
        {day != null && live && (
          <>
            It moved{' '}
            <Delta v={day}>
              {money(day, { sign: true })} ({pct(live.dayChangePct)})
            </Delta>{' '}
            {dayWord}
            {gain != null || unreal != null ? ', and ' : '. '}
          </>
        )}
        {day == null && (gain != null || unreal != null) && 'That’s '}
        {gain != null && put != null ? (
          <>
            <Delta v={gain}>
              {money(Math.abs(gain))} {gain >= 0 ? 'ahead of' : 'behind'}
            </Delta>{' '}
            the {money(put)} {whoPut} put in.
          </>
        ) : unreal != null ? (
          <>
            <Delta v={unreal}>
              {money(Math.abs(unreal))} {unreal >= 0 ? 'up' : 'down'}
            </Delta>{' '}
            on what the current holdings cost.
          </>
        ) : null}
      </p>

      <dl className="wl-facts">
        <div>
          <dt>Return on money in</dt>
          <dd className={`wl-tone-${tone(totals.gainPct)}`}>{pct(totals.gainPct)}</dd>
        </div>
        <div>
          <dt>Cash</dt>
          <dd>{money(totals.cash / f)}</dd>
        </div>
        <div>
          <dt>Dividends, last 12 months</dt>
          <dd>{money(totals.dividends12m / f)}</dd>
        </div>
        <div>
          <dt>Profit taken, last 12 months</dt>
          <dd className={`wl-tone-${tone(totals.realized12m)}`}>{money(totals.realized12m / f, { sign: true })}</dd>
        </div>
        <div>
          <dt>Last IBKR sync</dt>
          <dd className={data.lastSync?.status === 'error' ? 'wl-tone-down' : undefined}>
            {data.lastSync ? (data.lastSync.status === 'error' ? 'Failed ' : '') + relativeTime(data.lastSync.at) : 'Never'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
