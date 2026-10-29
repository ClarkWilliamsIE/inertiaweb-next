'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';
import { dayLabel, pct, price, seasonLabel, seasonOf, tone } from '@/lib/winnerland/format';

import { useMember } from '../AuthProvider';

interface Item {
  id: string;
  ticker: string;
  notes: string | null;
  market?: string | null;
  created_by: string | null;
  suggested_by_name: string | null;
  archived: boolean;
  created_at: string;
}
interface Vote {
  item_id: string;
  user_id: string;
  value: number;
}
interface Perf {
  startPrice: number;
  startDate: string;
  price: number;
  pct: number;
  currency: string | null;
}

const MARKETS = [
  { v: 'AUTO', label: 'Work it out' },
  { v: 'NASDAQ', label: 'US (Nasdaq / NYSE)' },
  { v: 'NZE', label: 'NZX' },
  { v: 'ASX', label: 'ASX' },
  { v: 'CRYPTO', label: 'Crypto' },
];

export default function WatchlistPage() {
  const { api, user, displayName } = useMember();
  const sb = getBrowserSupabase();
  const [items, setItems] = useState<Item[] | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [perf, setPerf] = useState<Record<string, Perf>>({});
  const [season, setSeason] = useState(() => seasonOf(new Date()));
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ ticker: '', market: 'AUTO', notes: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from('watchlist_items').select('*').order('created_at', { ascending: false }),
      sb.from('watchlist_votes').select('item_id,user_id,value'),
    ]);
    if (a.error || b.error) {
      setError((a.error ?? b.error)!.message);
      return;
    }
    setItems((a.data ?? []) as Item[]);
    setVotes((b.data ?? []) as Vote[]);
    setError(null);
  }, [sb]);

  useEffect(() => {
    load();
    const ch = sb
      .channel('wl-watchlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist_items' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist_votes' }, load)
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, load]);

  // How each idea has done since it was suggested.
  const perfKey = useMemo(() => (items ?? []).map((i) => i.id).join(','), [items]);
  useEffect(() => {
    if (!items?.length) return;
    let alive = true;
    const body = {
      items: items.map((i) => ({ id: i.id, ticker: i.ticker, market: i.market ?? null, since: i.created_at.slice(0, 10) })),
    };
    api<{ results: Record<string, Perf> }>('/api/market/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => alive && setPerf(r.results))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfKey, api]);

  const seasons = useMemo(() => {
    const s = new Set<string>([seasonOf(new Date())]);
    (items ?? []).forEach((i) => s.add(seasonOf(i.created_at)));
    return Array.from(s).sort().reverse();
  }, [items]);

  const scoreOf = (id: string) => votes.filter((v) => v.item_id === id).reduce((a, v) => a + (v.value || 0), 0);
  const mine = (id: string) => votes.some((v) => v.item_id === id && v.user_id === user.id);

  const inSeason = (items ?? []).filter((i) => seasonOf(i.created_at) === season);
  const active = inSeason
    .filter((i) => !i.archived)
    .filter((i) => !query || i.ticker.toUpperCase().includes(query.toUpperCase()) || (i.notes ?? '').toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => scoreOf(b.id) - scoreOf(a.id) || a.ticker.localeCompare(b.ticker));
  const archived = inSeason.filter((i) => i.archived);

  const pickers = useMemo(() => {
    const m = new Map<string, { n: number; sum: number }>();
    for (const i of inSeason) {
      const p = perf[i.id];
      if (!p) continue;
      const name = i.suggested_by_name || 'Member';
      const cur = m.get(name) ?? { n: 0, sum: 0 };
      cur.n++;
      cur.sum += p.pct;
      m.set(name, cur);
    }
    return Array.from(m.entries())
      .map(([name, v]) => ({ name, picks: v.n, avg: v.sum / v.n }))
      .sort((a, b) => b.avg - a.avg);
  }, [inSeason, perf]);

  const toggleVote = async (id: string) => {
    if (mine(id)) {
      setVotes((v) => v.filter((x) => !(x.item_id === id && x.user_id === user.id)));
      await sb.from('watchlist_votes').delete().match({ item_id: id, user_id: user.id });
    } else {
      setVotes((v) => [...v, { item_id: id, user_id: user.id, value: 1 }]);
      await sb.from('watchlist_votes').insert({ item_id: id, user_id: user.id, value: 1 });
    }
  };

  const setArchived = async (id: string, archivedFlag: boolean) => {
    setItems((list) => (list ?? []).map((i) => (i.id === id ? { ...i, archived: archivedFlag } : i)));
    await sb.from('watchlist_items').update({ archived: archivedFlag }).eq('id', id);
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker) return setMsg({ ok: false, text: 'Enter a ticker, for example NVDA or AIR.NZ.' });
    setBusy(true);
    const { error: err } = await sb.from('watchlist_items').insert({
      ticker,
      market: form.market,
      notes: form.notes.trim(),
      created_by: user.id,
      suggested_by_name: displayName,
      archived: false,
    });
    setBusy(false);
    if (err) return setMsg({ ok: false, text: `Couldn’t add ${ticker}: ${err.message}` });
    setForm({ ticker: '', market: 'AUTO', notes: '' });
    setSeason(seasonOf(new Date()));
    setMsg({ ok: true, text: `Added ${ticker}.` });
    load();
  };

  if (error) return <div className="wl-notice wl-notice--error">Couldn’t load the watchlist: {error}</div>;

  return (
    <div className="wl-page">
      <header className="wl-page__head wl-page__head--row">
        <div>
          <h1 className="wl-h1">Watchlist</h1>
          <p className="wl-lede">Ideas members want the fund to look at. Vote for the ones you’d back.</p>
        </div>
        <label className="wl-field wl-field--inline">
          <span>Season</span>
          <select value={season} onChange={(e) => setSeason(e.target.value)}>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {seasonLabel(s)}
              </option>
            ))}
          </select>
        </label>
      </header>

      <form className="wl-panel wl-addform" onSubmit={add}>
        <h2 className="wl-h3">Suggest a stock</h2>
        <div className="wl-addform__row">
          <label className="wl-field">
            <span>Ticker</span>
            <input
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              placeholder="NVDA"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </label>
          <label className="wl-field">
            <span>Market</span>
            <select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })}>
              {MARKETS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="wl-field wl-field--grow">
            <span>Why it’s interesting</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="One or two sentences" />
          </label>
          <button type="submit" className="wl-btn wl-btn--primary" disabled={busy}>
            {busy ? 'Adding…' : 'Add to watchlist'}
          </button>
        </div>
        {msg && (
          <p className={`wl-small ${msg.ok ? 'wl-tone-up' : 'wl-tone-down'}`} role="status">
            {msg.text}
          </p>
        )}
      </form>

      <div className="wl-columns">
        <section className="wl-panel" aria-labelledby="wl-wl-title">
          <div className="wl-panel__head">
            <h2 id="wl-wl-title" className="wl-h2">
              {seasonLabel(season)} <span className="wl-count">{active.length}</span>
            </h2>
            <input className="wl-search" type="search" placeholder="Filter" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter ideas" />
          </div>
          {!items ? (
            <div className="wl-skeleton" style={{ height: 240 }} />
          ) : active.length === 0 ? (
            <p className="wl-empty">No ideas for this season yet. Suggest one above.</p>
          ) : (
            <ul className="wl-ideas">
              {active.map((i) => {
                const p = perf[i.id];
                const voted = mine(i.id);
                const isOpen = expanded.has(i.id);
                return (
                  <li key={i.id} className="wl-idea">
                    <button
                      type="button"
                      className="wl-vote"
                      aria-pressed={voted}
                      aria-label={`${voted ? 'Remove your vote for' : 'Vote for'} ${i.ticker}`}
                      onClick={() => toggleVote(i.id)}
                    >
                      <span className="wl-vote__n">{scoreOf(i.id)}</span>
                      <span className="wl-vote__l">{voted ? 'Voted' : 'Vote'}</span>
                    </button>
                    <div className="wl-idea__body">
                      <div className="wl-idea__top">
                        <span className="wl-ticker">{i.ticker}</span>
                        <span className="wl-small wl-muted">
                          {i.suggested_by_name || 'Member'}, {dayLabel(i.created_at.slice(0, 10))}
                        </span>
                      </div>
                      {i.notes && (
                        <p className={`wl-idea__notes ${isOpen ? 'is-open' : ''}`}>
                          {i.notes}
                        </p>
                      )}
                      <div className="wl-idea__actions">
                        {i.notes && i.notes.length > 110 && (
                          <button
                            type="button"
                            className="wl-link"
                            onClick={() =>
                              setExpanded((s) => {
                                const n = new Set(s);
                                if (n.has(i.id)) n.delete(i.id);
                                else n.add(i.id);
                                return n;
                              })
                            }
                          >
                            {isOpen ? 'Show less' : 'Read more'}
                          </button>
                        )}
                        <button type="button" className="wl-link wl-link--quiet" onClick={() => setArchived(i.id, true)}>
                          Archive
                        </button>
                      </div>
                    </div>
                    <div className="wl-idea__perf">
                      <span className={`wl-num wl-strong wl-tone-${tone(p?.pct)}`}>{p ? pct(p.pct) : '—'}</span>
                      <span className="wl-small wl-muted">{p ? `since added, now ${price(p.price, p.currency === 'NZD' ? null : p.currency)}` : 'no price'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="wl-sidebar">
          <section className="wl-panel" aria-labelledby="wl-pickers-title">
            <h2 id="wl-pickers-title" className="wl-h2">
              Best pickers
            </h2>
            <p className="wl-small wl-muted">Average move of each member’s ideas since they suggested them.</p>
            {pickers.length === 0 ? (
              <p className="wl-empty">No priced ideas this season.</p>
            ) : (
              <ol className="wl-rank">
                {pickers.map((p, idx) => (
                  <li key={p.name}>
                    <span className="wl-rank__n">{idx + 1}</span>
                    <span className="wl-rank__name">
                      {p.name}
                      <span className="wl-small wl-muted">
                        {p.picks} idea{p.picks === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className={`wl-num wl-strong wl-tone-${tone(p.avg)}`}>{pct(p.avg)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="wl-panel" aria-labelledby="wl-arch-title">
            <h2 id="wl-arch-title" className="wl-h2">
              Archived <span className="wl-count">{archived.length}</span>
            </h2>
            {archived.length === 0 ? (
              <p className="wl-empty">Nothing archived this season.</p>
            ) : (
              <ul className="wl-archived">
                {archived.map((i) => (
                  <li key={i.id}>
                    <span className="wl-ticker">{i.ticker}</span>
                    <span className={`wl-num wl-tone-${tone(perf[i.id]?.pct)}`}>{perf[i.id] ? pct(perf[i.id].pct) : '—'}</span>
                    <button type="button" className="wl-link" onClick={() => setArchived(i.id, false)}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
