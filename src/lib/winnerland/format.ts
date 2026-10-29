// Number, date and season helpers for the Winnerland UI (en-NZ formatting).

export function money(v: number | null | undefined, opts: { currency?: string; sign?: boolean; cents?: boolean } = {}): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const digits = opts.cents ?? abs < 100 ? 2 : 0;
  const s = abs.toLocaleString('en-NZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const prefix = opts.currency && opts.currency !== 'NZD' ? `${opts.currency} ` : '$';
  const sign = v < 0 ? '−' : opts.sign && v > 0 ? '+' : '';
  return `${sign}${prefix}${s}`;
}

/** Compact money for axes: $85k, $1.2m. */
export function moneyShort(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}k`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export function pct(v: number | null | undefined, opts: { sign?: boolean; digits?: number } = {}): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const d = opts.digits ?? (Math.abs(v) >= 100 ? 0 : 1);
  const sign = v < 0 ? '−' : opts.sign !== false && v > 0 ? '+' : '';
  return `${sign}${Math.abs(v).toFixed(d)}%`;
}

export function price(v: number | null | undefined, currency?: string | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const digits = Math.abs(v) < 1 ? 3 : 2;
  const s = v.toLocaleString('en-NZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return currency && currency !== 'NZD' ? `${s} ${currency}` : `$${s}`;
}

export function qty(v: number): string {
  return v.toLocaleString('en-NZ', { maximumFractionDigits: 4 });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDay(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function dayLabel(d: string | Date, withYear = false): string {
  const x = typeof d === 'string' ? parseDay(d) : d;
  return `${x.getDate()} ${MONTHS[x.getMonth()]}${withYear ? ` ${x.getFullYear()}` : ''}`;
}

export function monthLabel(d: string | Date): string {
  const x = typeof d === 'string' ? parseDay(d) : d;
  return `${MONTHS[x.getMonth()]} ${String(x.getFullYear()).slice(2)}`;
}

export function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Club seasons run July → June, e.g. "FY2026-27". */
export function seasonOf(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `FY${y}-${String(y + 1).slice(2)}` : `FY${y - 1}-${String(y).slice(2)}`;
}

export function seasonLabel(fy: string): string {
  const m = /^FY(\d{4})-(\d{2})$/.exec(fy);
  return m ? `${m[1]}–${m[2]} season` : fy;
}

export function tone(v: number | null | undefined): 'up' | 'down' | 'flat' {
  if (v == null || Math.abs(v) < 1e-9) return 'flat';
  return v > 0 ? 'up' : 'down';
}
