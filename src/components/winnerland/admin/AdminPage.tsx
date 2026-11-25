'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';
import { parseSplits, type ShareSplit } from '@/lib/winnerland/costBasis';
import { dayLabel, money, price, relativeTime } from '@/lib/winnerland/format';

import type { PortfolioResponse } from '@/lib/winnerland/types';

import { useMember } from '../AuthProvider';
import ExitCalculator from './ExitCalculator';
import PolicySettings from './PolicySettings';

interface Run {
  id: number;
  started_at: string;
  finished_at: string | null;
  trigger: string | null;
  status: string;
  message: string | null;
}
interface Entrant {
  id: string;
  name: string;
  ticker: string;
  start_price: number;
}

const TRIGGER: Record<string, string> = { cron: 'Scheduled', manual: 'Sync now', upload: 'File upload' };

export default function AdminPage() {
  const { api } = useMember();
  const sb = getBrowserSupabase();
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [settings, setSettings] = useState({ member_count: '11', contributions_before_records: '0' });
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [entrantForm, setEntrantForm] = useState({ name: '', ticker: '', start: '' });
  const [members, setMembers] = useState<{ email: string; display_name: string | null }[]>([]);
  const [splits, setSplits] = useState<ShareSplit[]>([]);
  const [splitForm, setSplitForm] = useState({ symbol: '', date: '', ratio: '' });
  const [splitMsg, setSplitMsg] = useState<string | null>(null);
  const [fund, setFund] = useState<PortfolioResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [r, s, e, m] = await Promise.all([
      sb.from('pf_sync_runs').select('*').order('started_at', { ascending: false }).limit(12),
      sb.from('pf_settings').select('key,value'),
      sb.from('etf_members').select('*').order('name'),
      sb.from('pf_members').select('email,display_name').order('email'),
    ]);
    setRuns((r.data ?? []) as Run[]);
    const map = Object.fromEntries(((s.data ?? []) as { key: string; value: unknown }[]).map((x) => [x.key, x.value]));
    setSettings({
      member_count: String(map.member_count ?? 11),
      contributions_before_records: String(map.contributions_before_records ?? 0),
    });
    setSplits(parseSplits(map.splits).sort((a, b) => (a.date < b.date ? 1 : -1)));
    setEntrants((e.data ?? []) as Entrant[]);
    setMembers((m.data ?? []) as { email: string; display_name: string | null }[]);
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  // Holdings and NAV history for the policy settings and the buy-in/out calculator.
  useEffect(() => {
    api<PortfolioResponse>('/api/portfolio?live=0')
      .then(setFund)
      .catch(() => setFund(null));
  }, [api]);

  const syncNow = async () => {
    setSyncing(true);
    setSyncMsg({ ok: true, text: 'Asking IBKR for the latest statement. This usually takes 10–40 seconds…' });
    try {
      const r = await api<{ message: string }>('/api/ibkr/sync', { method: 'POST' });
      setSyncMsg({ ok: true, text: r.message });
    } catch (e) {
      setSyncMsg({ ok: false, text: e instanceof Error ? e.message : 'Sync failed.' });
    }
    setSyncing(false);
    load();
  };

  const upload = async (file: File) => {
    setSyncing(true);
    setSyncMsg({ ok: true, text: `Importing ${file.name}…` });
    try {
      const text = await file.text();
      const r = await api<{ message: string }>('/api/ibkr/import', { method: 'POST', headers: { 'Content-Type': 'application/xml' }, body: text });
      setSyncMsg({ ok: true, text: r.message });
    } catch (e) {
      setSyncMsg({ ok: false, text: e instanceof Error ? e.message : 'Import failed.' });
    }
    setSyncing(false);
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, Math.round(Number(settings.member_count) || 1));
    const before = Number(settings.contributions_before_records) || 0;
    const { error } = await sb.from('pf_settings').upsert([
      { key: 'member_count', value: count, updated_at: new Date().toISOString() },
      { key: 'contributions_before_records', value: before, updated_at: new Date().toISOString() },
    ]);
    setSettingsMsg(error ? `Couldn’t save: ${error.message}` : 'Saved.');
  };

  const saveSplits = async (next: ShareSplit[]) => {
    const { error } = await sb
      .from('pf_settings')
      .upsert({ key: 'splits', value: next, updated_at: new Date().toISOString() });
    if (error) {
      setSplitMsg(`Couldn’t save: ${error.message}`);
      return false;
    }
    setSplits([...next].sort((a, b) => (a.date < b.date ? 1 : -1)));
    return true;
  };

  const addSplit = async (e: FormEvent) => {
    e.preventDefault();
    const [s] = parseSplits([{ symbol: splitForm.symbol, date: splitForm.date, ratio: Number(splitForm.ratio) }]);
    if (!s) {
      setSplitMsg('Enter a ticker, a date and a ratio other than 1 (e.g. 3 for a 3-for-1 split).');
      return;
    }
    if (splits.some((x) => x.symbol === s.symbol && x.date === s.date)) {
      setSplitMsg(`${s.symbol} already has a split on that date.`);
      return;
    }
    if (await saveSplits([...splits, s])) {
      setSplitForm({ symbol: '', date: '', ratio: '' });
      setSplitMsg(`Added. ${s.symbol}’s average cost updates next time the Fund page loads.`);
    }
  };

  const removeSplit = async (s: ShareSplit) => {
    if (!window.confirm(`Remove the ${s.symbol} split on ${dayLabel(s.date, true)}?`)) return;
    if (await saveSplits(splits.filter((x) => x !== s))) setSplitMsg('Removed.');
  };

  const addEntrant = async (e: FormEvent) => {
    e.preventDefault();
    const name = entrantForm.name.trim();
    const ticker = entrantForm.ticker.trim().toUpperCase();
    const start = Number(entrantForm.start);
    if (!name || !ticker || !start) return;
    await sb.from('etf_members').insert({ name, ticker, start_price: start, current_price: start });
    setEntrantForm({ name: '', ticker: '', start: '' });
    load();
  };

  const removeEntrant = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the competition?`)) return;
    await sb.from('etf_members').delete().eq('id', id);
    load();
  };

  const lastOk = runs?.find((r) => r.status === 'success');

  return (
    <div className="wl-page">
      <header className="wl-page__head">
        <h1 className="wl-h1">Admin</h1>
        <p className="wl-lede">
          Fund data comes from an IBKR Flex Query every weekday afternoon (NZ time). Last successful sync:{' '}
          <strong>{lastOk ? relativeTime(lastOk.finished_at ?? lastOk.started_at) : 'never'}</strong>.
        </p>
      </header>

      <section className="wl-panel" aria-labelledby="wl-sync-title">
        <div className="wl-panel__head">
          <h2 id="wl-sync-title" className="wl-h2">
            IBKR sync
          </h2>
          <div className="wl-row">
            <label className="wl-btn wl-btn--ghost">
              Import a Flex XML file
              <input
                ref={fileRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="wl-sr-only"
                disabled={syncing}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
            <button type="button" className="wl-btn wl-btn--primary" onClick={syncNow} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        </div>
        {syncMsg && (
          <p className={`wl-notice ${syncMsg.ok ? '' : 'wl-notice--error'}`} role="status">
            {syncMsg.text}
          </p>
        )}
        <p className="wl-small wl-muted">
          Use “Import a Flex XML file” to load history older than a year: run the Flex Query in IBKR for an earlier date
          range, download it as XML, and import it here (files up to about 4 MB, so one year at a time).
        </p>
        {runs && runs.length > 0 ? (
          <table className="wl-table wl-table--compact">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">How</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="wl-nowrap">{relativeTime(r.finished_at ?? r.started_at)}</td>
                  <td>{TRIGGER[r.trigger ?? ''] ?? r.trigger}</td>
                  <td className={r.status === 'error' ? 'wl-tone-down' : r.status === 'running' ? 'wl-muted' : undefined}>
                    {r.status === 'running' ? 'Running…' : r.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="wl-empty">No syncs yet.</p>
        )}
      </section>

      <div className="wl-columns wl-columns--even">
        <form className="wl-panel" onSubmit={saveSettings} aria-labelledby="wl-settings-title">
          <h2 id="wl-settings-title" className="wl-h2">
            Fund settings
          </h2>
          <label className="wl-field">
            <span>Number of members</span>
            <input
              type="number"
              min={1}
              value={settings.member_count}
              onChange={(e) => setSettings({ ...settings, member_count: e.target.value })}
            />
            <small className="wl-muted">“My share” divides the fund by this.</small>
          </label>
          <label className="wl-field">
            <span>Money put in before the IBKR records start (NZD)</span>
            <input
              type="number"
              step="any"
              value={settings.contributions_before_records}
              onChange={(e) => setSettings({ ...settings, contributions_before_records: e.target.value })}
            />
            <small className="wl-muted">
              Deposits IBKR reports are added automatically. Use this for anything older than the imported statements.
            </small>
          </label>
          <div className="wl-row">
            <button type="submit" className="wl-btn wl-btn--primary">
              Save settings
            </button>
            {settingsMsg && (
              <span className="wl-small" role="status">
                {settingsMsg}
              </span>
            )}
          </div>
        </form>

        <section className="wl-panel" aria-labelledby="wl-members-title">
          <h2 id="wl-members-title" className="wl-h2">
            Who can see the fund
          </h2>
          {members.length === 0 ? (
            <p>
              Anyone with a Winnerland login can see the fund. To limit it to members, add their emails to the{' '}
              <code>pf_members</code> table in Supabase.
            </p>
          ) : (
            <ul className="wl-plainlist">
              {members.map((m) => (
                <li key={m.email}>
                  {m.display_name ? `${m.display_name}, ` : ''}
                  <span className="wl-muted">{m.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="wl-panel" aria-labelledby="wl-splits-title">
        <h2 id="wl-splits-title" className="wl-h2">
          Share splits
        </h2>
        <p className="wl-small wl-muted">
          IBKR’s Flex Query doesn’t include splits, so a holding that split shows no average cost. Add the split here.
          The date can be any day after the last trade before the split and before the first trade after it.
        </p>
        <form className="wl-addform__row" onSubmit={addSplit}>
          <label className="wl-field">
            <span>Ticker</span>
            <input
              value={splitForm.symbol}
              onChange={(e) => setSplitForm({ ...splitForm, symbol: e.target.value })}
              placeholder="BKLC"
              spellCheck={false}
            />
          </label>
          <label className="wl-field">
            <span>Split date</span>
            <input type="date" value={splitForm.date} onChange={(e) => setSplitForm({ ...splitForm, date: e.target.value })} />
          </label>
          <label className="wl-field">
            <span>New shares per old share</span>
            <input
              type="number"
              step="any"
              min={0}
              value={splitForm.ratio}
              onChange={(e) => setSplitForm({ ...splitForm, ratio: e.target.value })}
              placeholder="3"
            />
          </label>
          <button type="submit" className="wl-btn wl-btn--primary">
            Add split
          </button>
        </form>
        <p className="wl-small wl-muted">3-for-1 split: enter 3. 1-for-10 reverse split: enter 0.1.</p>
        {splitMsg && (
          <p className="wl-small" role="status">
            {splitMsg}
          </p>
        )}
        {splits.length > 0 && (
          <table className="wl-table wl-table--compact">
            <thead>
              <tr>
                <th scope="col">Ticker</th>
                <th scope="col">Date</th>
                <th scope="col" className="wl-right">
                  Ratio
                </th>
                <th scope="col">
                  <span className="wl-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {splits.map((s) => (
                <tr key={`${s.symbol}-${s.date}`}>
                  <td>
                    <span className="wl-ticker">{s.symbol}</span>
                  </td>
                  <td>{dayLabel(s.date, true)}</td>
                  <td className="wl-right wl-num">{s.ratio >= 1 ? `${s.ratio}-for-1` : `1-for-${Math.round(1 / s.ratio)}`}</td>
                  <td className="wl-right">
                    <button type="button" className="wl-link wl-link--quiet" onClick={() => removeSplit(s)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <PolicySettings heldSymbols={(fund?.holdings ?? []).map((h) => ({ symbol: h.symbol, name: h.name }))} />

      {fund && <ExitCalculator nav={fund.nav} members={fund.memberCount} />}

      <section className="wl-panel" aria-labelledby="wl-entrants-title">
        <h2 id="wl-entrants-title" className="wl-h2">
          Competition picks
        </h2>
        <form className="wl-addform__row" onSubmit={addEntrant}>
          <label className="wl-field">
            <span>Member</span>
            <input value={entrantForm.name} onChange={(e) => setEntrantForm({ ...entrantForm, name: e.target.value })} placeholder="Alex" />
          </label>
          <label className="wl-field">
            <span>Ticker</span>
            <input
              value={entrantForm.ticker}
              onChange={(e) => setEntrantForm({ ...entrantForm, ticker: e.target.value })}
              placeholder="NVDA"
              spellCheck={false}
            />
          </label>
          <label className="wl-field">
            <span>Price when picked</span>
            <input
              type="number"
              step="any"
              value={entrantForm.start}
              onChange={(e) => setEntrantForm({ ...entrantForm, start: e.target.value })}
              placeholder="0.00"
            />
          </label>
          <button type="submit" className="wl-btn wl-btn--primary">
            Add pick
          </button>
        </form>
        {entrants.length > 0 && (
          <table className="wl-table wl-table--compact">
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Ticker</th>
                <th scope="col" className="wl-right">
                  Picked at
                </th>
                <th scope="col">
                  <span className="wl-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entrants.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>
                    <span className="wl-ticker">{e.ticker}</span>
                  </td>
                  <td className="wl-right wl-num">{price(Number(e.start_price))}</td>
                  <td className="wl-right">
                    <button type="button" className="wl-link wl-link--quiet" onClick={() => removeEntrant(e.id, e.name)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="wl-small wl-muted">Each pick is a pretend {money(1000)} stake.</p>
      </section>
    </div>
  );
}
