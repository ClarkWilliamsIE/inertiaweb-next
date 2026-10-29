'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';
import { dayLabel } from '@/lib/winnerland/format';

import { useMember } from '../AuthProvider';

interface Poll {
  id: string;
  title: string;
  created_by: string | null;
  end_at: string;
  created_at: string;
}
interface Option {
  id: string;
  poll_id: string;
  label: string;
}
interface Vote {
  poll_id: string;
  option_id: string;
  user_id: string;
  voter_name: string | null;
}

/** Votes needed for an option to count as carried (a majority of 11 members). */
const MAJORITY = 6;

function timeLeft(endAt: string): string {
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return 'Closed';
  const h = Math.floor(ms / 3_600_000);
  if (h >= 48) return `${Math.floor(h / 24)} days left`;
  if (h >= 1) return `${h} hr${h === 1 ? '' : 's'} left`;
  return `${Math.max(1, Math.round(ms / 60_000))} min left`;
}

export default function PollsPage() {
  const { user, displayName } = useMember();
  const sb = getBrowserSupabase();
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(48);
  const [labels, setLabels] = useState(['', '']);
  const [newOpt, setNewOpt] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, o, v] = await Promise.all([
      sb.from('polls').select('*').order('created_at', { ascending: false }),
      sb.from('poll_options').select('*'),
      sb.from('poll_votes').select('*'),
    ]);
    const err = p.error ?? o.error ?? v.error;
    if (err) return setError(err.message);
    setPolls((p.data ?? []) as Poll[]);
    setOptions((o.data ?? []) as Option[]);
    setVotes((v.data ?? []) as Vote[]);
    setError(null);
  }, [sb]);

  useEffect(() => {
    load();
    const ch = sb
      .channel('wl-polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, load)
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, load]);

  const byPoll = useMemo(() => {
    const o = new Map<string, Option[]>();
    options.forEach((x) => o.set(x.poll_id, [...(o.get(x.poll_id) ?? []), x]));
    const v = new Map<string, Vote[]>();
    votes.forEach((x) => v.set(x.poll_id, [...(v.get(x.poll_id) ?? []), x]));
    return { o, v };
  }, [options, votes]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const opts = labels.map((l) => l.trim()).filter(Boolean);
    if (!title.trim() || opts.length < 2) return setError('A poll needs a question and at least two options.');
    setBusy(true);
    const endAt = new Date(Date.now() + hours * 3_600_000).toISOString();
    const { data, error: err } = await sb.from('polls').insert({ title: title.trim(), created_by: user.id, end_at: endAt }).select().single();
    if (err || !data) {
      setBusy(false);
      return setError(err?.message ?? 'Could not create the poll.');
    }
    await sb.from('poll_options').insert(opts.map((label) => ({ poll_id: (data as Poll).id, label })));
    setTitle('');
    setLabels(['', '']);
    setBusy(false);
    load();
  };

  const vote = async (poll: Poll, opt: Option) => {
    if (new Date(poll.end_at) <= new Date()) return;
    setVotes((v) => [
      ...v.filter((x) => !(x.poll_id === poll.id && x.user_id === user.id)),
      { poll_id: poll.id, option_id: opt.id, user_id: user.id, voter_name: displayName },
    ]);
    const { error: err } = await sb
      .from('poll_votes')
      .upsert({ poll_id: poll.id, option_id: opt.id, user_id: user.id, voter_name: displayName }, { onConflict: 'poll_id, user_id' });
    if (err) setError(err.message);
    load();
  };

  const addOption = async (pollId: string) => {
    const label = (newOpt[pollId] ?? '').trim();
    if (!label) return;
    await sb.from('poll_options').insert({ poll_id: pollId, label });
    setNewOpt((m) => ({ ...m, [pollId]: '' }));
    load();
  };

  const now = new Date();
  const live = (polls ?? []).filter((p) => new Date(p.end_at) > now);
  const past = (polls ?? []).filter((p) => new Date(p.end_at) <= now);

  const renderPoll = (p: Poll) => {
    const ended = new Date(p.end_at) <= now;
    const opts = [...(byPoll.o.get(p.id) ?? [])].sort((a, b) => a.label.localeCompare(b.label));
    const pv = byPoll.v.get(p.id) ?? [];
    const myVote = pv.find((v) => v.user_id === user.id)?.option_id;
    return (
      <article key={p.id} className={`wl-poll ${ended ? 'is-ended' : ''}`}>
        <header className="wl-poll__head">
          <h3 className="wl-h3">{p.title}</h3>
          <p className="wl-small wl-muted">
            {ended ? `Closed ${dayLabel(p.end_at.slice(0, 10), true)}` : timeLeft(p.end_at)}, {pv.length} vote{pv.length === 1 ? '' : 's'}
          </p>
        </header>
        <ul className="wl-poll__opts">
          {opts.map((o) => {
            const ov = pv.filter((v) => v.option_id === o.id);
            const share = pv.length ? Math.round((ov.length / pv.length) * 100) : 0;
            const carried = ov.length >= MAJORITY;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  className={`wl-opt ${myVote === o.id ? 'is-mine' : ''} ${carried ? 'is-carried' : ''}`}
                  onClick={() => vote(p, o)}
                  disabled={ended}
                  aria-pressed={myVote === o.id}
                >
                  <span className="wl-opt__fill" style={{ width: `${share}%` }} aria-hidden="true" />
                  <span className="wl-opt__label">
                    {o.label}
                    {carried && <span className="wl-badge">Majority</span>}
                  </span>
                  <span className="wl-num wl-opt__n">
                    {ov.length} <span className="wl-muted">({share}%)</span>
                  </span>
                </button>
                {ov.length > 0 && (
                  <p className="wl-opt__voters wl-small wl-muted">{ov.map((v) => v.voter_name || 'Member').join(', ')}</p>
                )}
              </li>
            );
          })}
        </ul>
        {!ended && (
          <div className="wl-poll__add">
            <input
              value={newOpt[p.id] ?? ''}
              placeholder="Add another option"
              aria-label={`Add an option to “${p.title}”`}
              onChange={(e) => setNewOpt((m) => ({ ...m, [p.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addOption(p.id)}
            />
            <button type="button" className="wl-btn wl-btn--sm" onClick={() => addOption(p.id)}>
              Add
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="wl-page">
      <header className="wl-page__head">
        <h1 className="wl-h1">Polls</h1>
        <p className="wl-lede">Decide things together. You can change your vote until a poll closes; {MAJORITY} votes carries an option.</p>
      </header>
      {error && (
        <p className="wl-notice wl-notice--error" role="alert">
          {error}
        </p>
      )}

      <form className="wl-panel wl-pollform" onSubmit={create}>
        <h2 className="wl-h3">Start a poll</h2>
        <div className="wl-pollform__grid">
          <label className="wl-field wl-field--grow">
            <span>Question</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Should we take profit on NVDA?" />
          </label>
          <label className="wl-field">
            <span>Open for</span>
            <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              <option value={24}>1 day</option>
              <option value={48}>2 days</option>
              <option value={72}>3 days</option>
              <option value={168}>1 week</option>
            </select>
          </label>
        </div>
        <div className="wl-pollform__opts">
          {labels.map((l, i) => (
            <div key={i} className="wl-pollform__opt">
              <input
                value={l}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                onChange={(e) => setLabels((ls) => ls.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {labels.length > 2 && (
                <button type="button" className="wl-link wl-link--quiet" onClick={() => setLabels((ls) => ls.filter((_, j) => j !== i))}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="wl-row">
          <button type="button" className="wl-btn wl-btn--ghost" onClick={() => setLabels((ls) => [...ls, ''])}>
            Add option
          </button>
          <button type="submit" className="wl-btn wl-btn--primary" disabled={busy}>
            {busy ? 'Starting…' : 'Start poll'}
          </button>
        </div>
      </form>

      <section aria-labelledby="wl-live-polls">
        <h2 id="wl-live-polls" className="wl-h2">
          Open <span className="wl-count">{live.length}</span>
        </h2>
        {!polls ? (
          <div className="wl-skeleton" style={{ height: 200 }} />
        ) : live.length === 0 ? (
          <p className="wl-empty">No open polls. Start one above.</p>
        ) : (
          <div className="wl-poll-grid">
            {live.map(renderPoll)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="wl-past-polls">
          <h2 id="wl-past-polls" className="wl-h2">
            Closed <span className="wl-count">{past.length}</span>
          </h2>
          <div className="wl-poll-grid">
            {past.map(renderPoll)}
          </div>
        </section>
      )}
    </div>
  );
}
