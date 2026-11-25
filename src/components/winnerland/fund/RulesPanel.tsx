import type { RuleCheck, RuleStatus } from '@/lib/winnerland/rules';

const LABEL: Record<RuleStatus, string> = {
  ok: 'OK',
  warn: 'Check',
  breach: 'Outside the rules',
  info: 'To do',
  unknown: 'Not set up',
};
const ICON: Record<RuleStatus, string> = { ok: '✓', warn: '!', breach: '✕', info: 'i', unknown: '?' };
const ORDER: RuleStatus[] = ['breach', 'warn', 'info', 'unknown', 'ok'];

/** Shareholder agreement / investment policy checks (see src/lib/winnerland/rules.ts). */
export default function RulesPanel({ rules }: { rules: RuleCheck[] }) {
  if (!rules.length) return null;
  const sorted = [...rules].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const breaches = rules.filter((r) => r.status === 'breach').length;
  const warns = rules.filter((r) => r.status === 'warn').length;

  return (
    <section className="wl-panel" aria-labelledby="wl-rules-title">
      <div className="wl-panel__head">
        <h2 id="wl-rules-title" className="wl-h2">
          Rules check
        </h2>
        <p className="wl-small wl-muted">
          {breaches || warns
            ? [breaches && `${breaches} outside the rules`, warns && `${warns} to check`].filter(Boolean).join(' · ')
            : 'Everything is within the investment policy.'}
        </p>
      </div>
      <ul className="wl-rules">
        {sorted.map((r) => (
          <li key={r.id} className={`wl-rule wl-rule--${r.status}`}>
            <details>
              <summary>
                <span className="wl-rule__icon" aria-hidden="true">
                  {ICON[r.status]}
                </span>
                <span className="wl-rule__body">
                  <span className="wl-rule__title">
                    {r.title} <span className="wl-rule__status">{LABEL[r.status]}</span>
                  </span>
                  <span className="wl-rule__summary">{r.summary}</span>
                </span>
              </summary>
              {r.details.length > 0 && (
                <ul className="wl-rule__details">
                  {r.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
              <p className="wl-rule__clause">{r.clause}</p>
            </details>
          </li>
        ))}
      </ul>
      <p className="wl-small wl-muted">
        A guide based on the latest IBKR data and the shareholder agreement (21 June 2025). Business days don’t count public
        holidays.
      </p>
    </section>
  );
}
