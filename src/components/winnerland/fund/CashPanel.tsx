import { dayLabel, money } from '@/lib/winnerland/format';
import { agmDate, type CashPlan, daysBetween, quarterEnd, subtractBusinessDays } from '@/lib/winnerland/rules';

/** Cash on hand, plus what the weekly contributions (clause 5.2A) add. */
export function CashPanel({ plan, f }: { plan: CashPlan; f: number }) {
  const short = plan.expectedSinceStart != null && plan.depositedSinceStart != null ? plan.expectedSinceStart - plan.depositedSinceStart : null;
  return (
    <section className="wl-panel" aria-labelledby="wl-cash-title">
      <h2 id="wl-cash-title" className="wl-h2">
        Cash on hand
      </h2>
      <p className="wl-cash__now wl-num">{money(plan.cash / f)}</p>
      <p className="wl-small wl-muted">In IBKR at the latest statement.</p>
      <dl className="wl-stats">
        <div>
          <dt>Weekly contributions</dt>
          <dd className="wl-num">
            +{money(plan.weeklyTotal / f)}
            <span className="wl-small wl-muted">
              {' '}
              {f === 1 ? `${plan.members} × ${money(plan.weeklyPerMember)}` : 'your share'}
            </span>
          </dd>
        </div>
        <div>
          <dt>In 4 weeks</dt>
          <dd className="wl-num">{money(plan.in4Weeks / f)}</dd>
        </div>
        <div>
          <dt>By the AGM ({dayLabel(plan.agm)})</dt>
          <dd className="wl-num">{money(plan.byAgm / f)}</dd>
        </div>
        {short != null && (
          <div>
            <dt>Contributions since {dayLabel(plan.start!, true)}</dt>
            <dd className={`wl-num ${short > 1 ? 'wl-tone-down' : ''}`}>
              {money(plan.depositedSinceStart! / f)}{' '}
              <span className="wl-small wl-muted">of {money(plan.expectedSinceStart! / f)} expected</span>
            </dd>
          </div>
        )}
      </dl>
      <p className="wl-small wl-muted">
        If every member pays {money(plan.weeklyPerMember)} a week and nothing is bought. Weekly contributions go to the safe
        fund unless expenses are due (clause 5.2A).
        {short == null && ' Set a contributions start date in Admin to track what’s been paid in.'}
      </p>
    </section>
  );
}

/** AGM and quarterly review reminders (clause 4.2, Schedule 1). */
export function ComingUp({ today }: { today: string }) {
  const agm = agmDate(today);
  const notice = subtractBusinessDays(agm, 7);
  const qEnd = quarterEnd(today);
  const items = [
    { date: notice, label: 'Last day to send AGM notice (7 business days before)' },
    { date: agm, label: 'AGM, third Saturday of December' },
    { date: qEnd, label: 'Quarter ends: rebalance review due (safe fund 10%+, 50/50 VEA/BKLC)' },
  ]
    .filter((i) => i.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <section className="wl-panel" aria-labelledby="wl-coming-title">
      <h2 id="wl-coming-title" className="wl-h2">
        Coming up
      </h2>
      <ul className="wl-plainlist wl-coming">
        {items.map((i) => {
          const d = daysBetween(today, i.date);
          return (
            <li key={i.label}>
              <strong className="wl-num">{dayLabel(i.date, true)}</strong>{' '}
              <span className="wl-muted wl-small">{d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`}</span>
              <br />
              {i.label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
