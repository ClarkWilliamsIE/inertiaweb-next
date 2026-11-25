'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';
import { readRulesSettings, type RulesSettings } from '@/lib/winnerland/rules';

/**
 * Settings behind the Fund page's Rules check and Cash on hand panels,
 * stored in pf_settings: competition_symbols, country_overrides,
 * excluded_symbols, weekly_contribution, contributions_start.
 */
export default function PolicySettings({
  heldSymbols,
  inCompetitionEtf,
}: {
  heldSymbols: { symbol: string; name: string | null }[];
  /** Everything currently in the Competition ETF, including picks matched from the Competition page. */
  inCompetitionEtf: string[];
}) {
  const sb = getBrowserSupabase();
  const [s, setS] = useState<RulesSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [countryForm, setCountryForm] = useState({ symbol: '', country: '' });
  const [exclForm, setExclForm] = useState({ symbol: '', note: '' });
  const [weekly, setWeekly] = useState('25');
  const [start, setStart] = useState('');

  const load = useCallback(async () => {
    const { data } = await sb.from('pf_settings').select('key,value');
    const map = Object.fromEntries(((data ?? []) as { key: string; value: unknown }[]).map((x) => [x.key, x.value]));
    const r = readRulesSettings(map);
    setS(r);
    setWeekly(String(r.weeklyContribution));
    setStart(r.contributionsStart ?? '');
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, value: unknown, done: string) => {
    const { error } = await sb.from('pf_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setMsg(error ? `Couldn’t save: ${error.message}` : done);
    if (!error) load();
  };

  if (!s) return <div className="wl-skeleton" style={{ height: 200 }} />;

  const comp = new Set(s.competitionSymbols);
  const fromPicks = new Set(inCompetitionEtf.map((x) => x.toUpperCase()).filter((x) => !comp.has(x)));
  const toggleComp = (sym: string) => {
    const next = comp.has(sym) ? s.competitionSymbols.filter((x) => x !== sym) : [...s.competitionSymbols, sym];
    save('competition_symbols', next, `${sym} ${comp.has(sym) ? 'removed from' : 'added to'} the Competition ETF.`);
  };

  const addCountry = (e: FormEvent) => {
    e.preventDefault();
    const sym = countryForm.symbol.trim().toUpperCase();
    const c = countryForm.country.trim();
    if (!sym || !c) return setMsg('Enter a ticker and a country or region.');
    save('country_overrides', { ...s.countryOverrides, [sym]: c }, `${sym} now counts as “${c}”.`);
    setCountryForm({ symbol: '', country: '' });
  };

  const addExcluded = (e: FormEvent) => {
    e.preventDefault();
    const sym = exclForm.symbol.trim().toUpperCase();
    if (!sym) return setMsg('Enter the employer’s ticker.');
    save('excluded_symbols', [...s.excluded.filter((x) => x.symbol !== sym), { symbol: sym, note: exclForm.note.trim() }], `${sym} added to the do-not-buy list.`);
    setExclForm({ symbol: '', note: '' });
  };

  const saveContrib = async (e: FormEvent) => {
    e.preventDefault();
    const w = Number(weekly);
    if (!Number.isFinite(w) || w < 0) return setMsg('Weekly contribution must be a number.');
    const { error } = await sb.from('pf_settings').upsert([
      { key: 'weekly_contribution', value: w, updated_at: new Date().toISOString() },
      { key: 'contributions_start', value: start || null, updated_at: new Date().toISOString() },
    ]);
    setMsg(error ? `Couldn’t save: ${error.message}` : 'Contribution settings saved.');
    if (!error) load();
  };

  const sortedHeld = [...heldSymbols].sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <section className="wl-panel" aria-labelledby="wl-policy-title">
      <h2 id="wl-policy-title" className="wl-h2">
        Policy settings
      </h2>
      <p className="wl-small wl-muted">These feed the Rules check and Cash on hand panels on the Fund page.</p>
      {msg && (
        <p className="wl-small" role="status">
          {msg}
        </p>
      )}

      <h3 className="wl-h3">Competition ETF</h3>
      <p className="wl-small wl-muted">
        Holdings matching a pick on the Competition page join automatically. Tick any others that belong in it. They show as
        one “Competition ETF” row and count as one holding for the 1% / 3% / 35% rules.
      </p>
      {sortedHeld.length ? (
        <div className="wl-checkgrid">
          {sortedHeld.map((h) => (
            <label key={h.symbol} className="wl-check">
              <input
                type="checkbox"
                checked={comp.has(h.symbol.toUpperCase()) || fromPicks.has(h.symbol.toUpperCase())}
                disabled={fromPicks.has(h.symbol.toUpperCase())}
                onChange={() => toggleComp(h.symbol.toUpperCase())}
              />
              <span className="wl-ticker">{h.symbol}</span>
              <span className="wl-small wl-muted">{fromPicks.has(h.symbol.toUpperCase()) ? 'From the Competition page' : h.name ?? ''}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="wl-empty">Holdings appear here after the first IBKR sync.</p>
      )}

      <h3 className="wl-h3">Country overrides</h3>
      <p className="wl-small wl-muted">
        The 70% country limit uses where each issuer is registered. An ETF like VEA is registered in the US but holds
        non-US shares; give it its real region here (e.g. “Developed ex-US”).
      </p>
      <form className="wl-addform__row" onSubmit={addCountry}>
        <label className="wl-field">
          <span>Ticker</span>
          <input value={countryForm.symbol} onChange={(e) => setCountryForm({ ...countryForm, symbol: e.target.value })} placeholder="VEA" spellCheck={false} />
        </label>
        <label className="wl-field wl-field--grow">
          <span>Counts as</span>
          <input value={countryForm.country} onChange={(e) => setCountryForm({ ...countryForm, country: e.target.value })} placeholder="Developed ex-US" />
        </label>
        <button type="submit" className="wl-btn">
          Save
        </button>
      </form>
      {Object.keys(s.countryOverrides).length > 0 && (
        <ul className="wl-plainlist">
          {Object.entries(s.countryOverrides).map(([sym, c]) => (
            <li key={sym}>
              <span className="wl-ticker">{sym}</span> counts as {c}{' '}
              <button
                type="button"
                className="wl-link wl-link--quiet"
                onClick={() => {
                  const next = { ...s.countryOverrides };
                  delete next[sym];
                  save('country_overrides', next, `${sym} override removed.`);
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="wl-h3">Members’ employers (clause 5.6)</h3>
      <p className="wl-small wl-muted">The fund can’t invest in a company where a member works. Listed ones are flagged if ever held.</p>
      <form className="wl-addform__row" onSubmit={addExcluded}>
        <label className="wl-field">
          <span>Ticker</span>
          <input value={exclForm.symbol} onChange={(e) => setExclForm({ ...exclForm, symbol: e.target.value })} placeholder="AIR" spellCheck={false} />
        </label>
        <label className="wl-field wl-field--grow">
          <span>Note (optional)</span>
          <input value={exclForm.note} onChange={(e) => setExclForm({ ...exclForm, note: e.target.value })} placeholder="Where a member works" />
        </label>
        <button type="submit" className="wl-btn">
          Add
        </button>
      </form>
      {s.excluded.length > 0 && (
        <ul className="wl-plainlist">
          {s.excluded.map((x) => (
            <li key={x.symbol}>
              <span className="wl-ticker">{x.symbol}</span> {x.note && <span className="wl-muted">{x.note}</span>}{' '}
              <button
                type="button"
                className="wl-link wl-link--quiet"
                onClick={() => save('excluded_symbols', s.excluded.filter((y) => y.symbol !== x.symbol), `${x.symbol} removed.`)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="wl-h3">Weekly contributions (clause 5.2A)</h3>
      <form onSubmit={saveContrib}>
        <div className="wl-addform__row">
          <label className="wl-field">
            <span>Per member, per week (NZD)</span>
            <input type="number" step="any" min={0} value={weekly} onChange={(e) => setWeekly(e.target.value)} />
          </label>
          <label className="wl-field">
            <span>Track payments from</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <button type="submit" className="wl-btn">
            Save
          </button>
        </div>
        <p className="wl-small wl-muted">
          With a start date, the Fund page compares deposits IBKR recorded since then with what all members should have paid.
        </p>
      </form>
    </section>
  );
}
