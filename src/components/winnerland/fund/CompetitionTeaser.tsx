'use client';

import Link from 'next/link';

import { money, pct, tone } from '@/lib/winnerland/format';

import { useCompetition } from '../competition/useCompetition';

export default function CompetitionTeaser() {
  const { entrants } = useCompetition();
  if (!entrants || entrants.length === 0) return null;
  const leader = entrants[0];
  const last = entrants[entrants.length - 1];
  const pot = entrants.reduce((a, e) => a + e.value, 0);
  return (
    <section className="wl-panel wl-teaser" aria-labelledby="wl-teaser-title">
      <h2 id="wl-teaser-title" className="wl-h2">
        Stock-pick competition
      </h2>
      <p className="wl-teaser__lead">
        <span className="wl-trophy" aria-hidden="true">
          ★
        </span>
        <strong>{leader.name}</strong> leads with {leader.ticker},{' '}
        <span className={`wl-tone-${tone(leader.pct)}`}>{pct(leader.pct)}</span>.
      </p>
      <p className="wl-muted wl-small">
        {entrants.length} picks worth {money(pot)} together. {last.name} is last with {last.ticker} ({pct(last.pct)}).
      </p>
      <Link href="/winnerland/competition" className="wl-link">
        See the leaderboard
      </Link>
    </section>
  );
}
