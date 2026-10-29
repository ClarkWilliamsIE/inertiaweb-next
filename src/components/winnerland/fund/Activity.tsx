import { dayLabel, money, price } from '@/lib/winnerland/format';
import type { ActivityItem } from '@/lib/winnerland/types';

const ICON: Record<ActivityItem['kind'], string> = {
  buy: '+',
  sell: '−',
  dividend: '$',
  deposit: '↓',
  withdrawal: '↑',
  interest: '%',
  fee: '·',
  tax: '·',
  other: '·',
};

export default function Activity({ items, f }: { items: ActivityItem[]; f: number }) {
  return (
    <section className="wl-panel" aria-labelledby="wl-activity-title">
      <h2 id="wl-activity-title" className="wl-h2">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <p className="wl-empty">Trades, dividends and deposits from IBKR will show here.</p>
      ) : (
        <ol className="wl-activity">
          {items.slice(0, 12).map((a) => (
            <li key={a.id} className={`wl-activity__item is-${a.kind}`}>
              <span className="wl-activity__icon" aria-hidden="true">
                {ICON[a.kind]}
              </span>
              <span className="wl-activity__text">
                <span>{a.label}</span>
                <span className="wl-small wl-muted">
                  {dayLabel(a.date, true)}
                  {a.price != null ? ` at ${price(a.price, a.currency)}` : ''}
                </span>
              </span>
              <span className={`wl-num wl-activity__amt ${a.amountBase >= 0 ? 'is-in' : 'is-out'}`}>
                {money(a.amountBase / f, { sign: true })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
