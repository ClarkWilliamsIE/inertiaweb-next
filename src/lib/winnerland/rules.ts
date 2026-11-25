/**
 * BC Limited shareholder agreement: the parts the dashboard can check.
 * Pure functions only (no database), so the Fund page, Admin page and the
 * API share one set of rules. Clause numbers refer to the agreement dated
 * 21 June 2025 and its Schedule 1 (Investment Policy).
 */

// ── Settings (stored in pf_settings) ────────────────────────────────────────

export interface RulesSettings {
  /** Holdings that make up the members' "Competition ETF" (treated as one holding). */
  competitionSymbols: string[];
  /** Where a holding's assets are really domiciled, overriding IBKR's issuer country (e.g. VEA → "Developed ex-US"). */
  countryOverrides: Record<string, string>;
  /** Companies the fund must not hold because a member works there (clause 5.6). */
  excluded: { symbol: string; note: string }[];
  /** Weekly contribution per member, NZD (clause 5.2A). */
  weeklyContribution: number;
  /** First week the weekly contributions apply from (yyyy-mm-dd), for the contributions tracker. */
  contributionsStart: string | null;
  /** From each IBKR sync: issuer country and IBKR sub-category per symbol. */
  securityInfo: Record<string, { country: string | null; sub: string | null }>;
}

const upper = (s: unknown) => String(s ?? '').trim().toUpperCase();
const isDay = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function readRulesSettings(settings: Record<string, unknown>): RulesSettings {
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const weekly = Number(settings.weekly_contribution);
  return {
    competitionSymbols: Array.isArray(settings.competition_symbols)
      ? Array.from(new Set(settings.competition_symbols.map(upper).filter(Boolean)))
      : [],
    countryOverrides: Object.fromEntries(
      Object.entries(obj(settings.country_overrides))
        .map(([k, v]) => [upper(k), String(v ?? '').trim()])
        .filter(([k, v]) => k && v),
    ),
    excluded: Array.isArray(settings.excluded_symbols)
      ? settings.excluded_symbols
          .map((e) => ({ symbol: upper(e?.symbol), note: String(e?.note ?? '').trim() }))
          .filter((e) => e.symbol)
      : [],
    weeklyContribution: Number.isFinite(weekly) && weekly >= 0 ? weekly : 25,
    contributionsStart: isDay(settings.contributions_start) ? settings.contributions_start : null,
    securityInfo: Object.fromEntries(
      Object.entries(obj(settings.security_info)).map(([k, v]) => {
        const o = obj(v);
        return [upper(k), { country: o.country ? String(o.country) : null, sub: o.sub ? String(o.sub) : null }];
      }),
    ),
  };
}

// ── Dates ───────────────────────────────────────────────────────────────────

const toDay = (d: Date) => d.toISOString().slice(0, 10);
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Adds business days (Mon–Fri). Public holidays aren't counted, so treat it as a guide. */
export function addBusinessDays(iso: string, n: number): string {
  const d = parse(iso);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return toDay(d);
}

export function subtractBusinessDays(iso: string, n: number): string {
  const d = parse(iso);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return toDay(d);
}

/** The AGM is the third Saturday of December (clause 4.2a). */
export function agmDate(today: string): string {
  const year = Number(today.slice(0, 4));
  const third = (y: number) => {
    const d = new Date(Date.UTC(y, 11, 1));
    const firstSat = 1 + ((6 - d.getUTCDay() + 7) % 7);
    return toDay(new Date(Date.UTC(y, 11, firstSat + 14)));
  };
  const thisYear = third(year);
  return thisYear >= today ? thisYear : third(year + 1);
}

/** Last day of the current calendar quarter (quarterly rebalance review, Schedule 1). */
export function quarterEnd(today: string): string {
  const d = parse(today);
  const q = Math.floor(d.getUTCMonth() / 3);
  return toDay(new Date(Date.UTC(d.getUTCFullYear(), q * 3 + 3, 0)));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86400_000);
}

// ── Policy checks ───────────────────────────────────────────────────────────

export type RuleStatus = 'ok' | 'warn' | 'breach' | 'info' | 'unknown';

export interface RuleCheck {
  id: string;
  clause: string;
  title: string;
  status: RuleStatus;
  summary: string;
  details: string[];
}

export const SAFE_FUND = ['VEA', 'BKLC'] as const;
export const COMPETITION_KEY = 'COMPETITION';

export interface RulesInput {
  today: string; // yyyy-mm-dd
  /** Current holdings, values in base currency. */
  holdings: { symbol: string; assetCategory: string | null; value: number }[];
  cash: number;
  total: number;
  settings: RulesSettings;
  /** Symbol (or COMPETITION_KEY) → first saved day of its current run below 1%. */
  below1Since: Record<string, string | null>;
  /** Buys in the last 120 days worth under 3% of the fund at the time (competition & safe fund excluded). */
  smallBuys: { symbol: string; date: string; amount: number; pct: number }[];
  /** Dividends (after tax withheld) received since that holding was last bought. */
  dividendsToReinvest: { symbol: string; amount: number; since: string | null }[];
}

const pctText = (v: number) => `${v.toFixed(1)}%`;
const nzd = (v: number) => `$${Math.round(v).toLocaleString('en-NZ')}`;

/** Holdings with the competition picks merged into one line. */
export function groupedHoldings(input: Pick<RulesInput, 'holdings' | 'settings'>) {
  const comp = new Set(input.settings.competitionSymbols);
  const out: { symbol: string; label: string; value: number; isEtf: boolean }[] = [];
  let compValue = 0;
  for (const h of input.holdings) {
    const sym = h.symbol.toUpperCase();
    if (comp.has(sym)) {
      compValue += h.value;
      continue;
    }
    const sub = input.settings.securityInfo[sym]?.sub?.toUpperCase();
    out.push({ symbol: sym, label: sym, value: h.value, isEtf: sub === 'ETF' });
  }
  if (compValue > 0) out.push({ symbol: COMPETITION_KEY, label: 'Competition ETF', value: compValue, isEtf: true });
  return out;
}

export function checkRules(input: RulesInput): RuleCheck[] {
  const { total, settings } = input;
  const checks: RuleCheck[] = [];
  if (!(total > 0)) return checks;
  const weight = (v: number) => (v / total) * 100;
  const grouped = groupedHoldings(input);

  // 1. Asset classes: listed securities only, no derivatives (Schedule 1).
  const allowed = new Set(['STK', 'BOND', 'FUND', 'ETF', 'CASH']);
  const odd = input.holdings.filter((h) => h.assetCategory && !allowed.has(h.assetCategory.toUpperCase()));
  checks.push({
    id: 'asset-classes',
    clause: 'Schedule 1 · Asset classes',
    title: 'No derivatives',
    status: odd.length ? 'breach' : 'ok',
    summary: odd.length
      ? `${odd.length} holding${odd.length > 1 ? 's are' : ' is'} not a share, ETF or bond.`
      : 'Everything held is listed shares or ETFs.',
    details: odd.map((h) => `${h.symbol}: ${h.assetCategory}`),
  });

  // 2. No margin or debt (clause 5.5).
  checks.push({
    id: 'no-debt',
    clause: 'Clause 5.5',
    title: 'No margin or debt',
    status: input.cash < -1 ? 'breach' : 'ok',
    summary: input.cash < -1 ? `Cash is negative (${nzd(input.cash)}), which means borrowing from the broker.` : 'Cash is not negative.',
    details: [],
  });

  // 3. Max 70% in any one country (Schedule 1).
  const byCountry = new Map<string, number>();
  let unknownCountry = 0;
  for (const h of input.holdings) {
    const sym = h.symbol.toUpperCase();
    const c = settings.countryOverrides[sym] ?? settings.securityInfo[sym]?.country ?? null;
    if (!c) unknownCountry += h.value;
    else byCountry.set(c, (byCountry.get(c) ?? 0) + h.value);
  }
  const countries = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]);
  const [topCountry, topValue] = countries[0] ?? [null, 0];
  const topPct = weight(topValue);
  checks.push({
    id: 'country',
    clause: 'Schedule 1 · Geographic diversification',
    title: 'Max 70% in one country',
    status: !countries.length ? 'unknown' : topPct > 70 ? 'breach' : topPct > 65 ? 'warn' : 'ok',
    summary: !countries.length
      ? 'Country data arrives with the next IBKR sync.'
      : `${topCountry} is ${pctText(topPct)} of the portfolio (limit 70%).`,
    details: [
      ...countries.map(([c, v]) => `${c}: ${pctText(weight(v))}`),
      ...(unknownCountry > 0 ? [`Unknown: ${pctText(weight(unknownCountry))}`] : []),
      `Cash: ${pctText(weight(Math.max(input.cash, 0)))}`,
      'Countries are where each issuer is registered (from IBKR). An ETF counts as its registered country unless you set an override in Admin.',
    ],
  });

  // 4. Max 35% in one stock or bond (Schedule 1). ETFs are funds, so not "a single security".
  const singles = grouped.filter((g) => !g.isEtf).sort((a, b) => b.value - a.value);
  const biggest = singles[0];
  checks.push({
    id: 'single-security',
    clause: 'Schedule 1 · Single security concentration',
    title: 'Max 35% in one stock',
    status: !biggest ? 'ok' : weight(biggest.value) > 35 ? 'breach' : weight(biggest.value) > 30 ? 'warn' : 'ok',
    summary: biggest ? `Largest single stock is ${biggest.label} at ${pctText(weight(biggest.value))}.` : 'No individual stocks held.',
    details: singles.slice(0, 3).map((g) => `${g.label}: ${pctText(weight(g.value))}`),
  });

  // 5. Holdings under 1% need a top-up-or-sell vote within 7 business days (Schedule 1).
  const small = grouped.filter((g) => weight(g.value) < 1).sort((a, b) => a.value - b.value);
  const overdue = small.filter((g) => {
    const since = input.below1Since[g.symbol];
    return since && addBusinessDays(since, 7) < input.today;
  });
  checks.push({
    id: 'under-1pct',
    clause: 'Schedule 1 · Single security concentration',
    title: 'Holdings under 1%',
    status: overdue.length ? 'breach' : small.length ? 'warn' : 'ok',
    summary: small.length
      ? `${small.length} holding${small.length > 1 ? 's are' : ' is'} under 1%. Each needs a vote to top up to 3% or sell, within 7 business days.`
      : 'Every holding is at least 1% of the portfolio.',
    details: small.map((g) => {
      const since = input.below1Since[g.symbol];
      return `${g.label}: ${pctText(weight(g.value))}${since ? ` · under 1% since ${since} (at least) · vote due by ${addBusinessDays(since, 7)}` : ''}`;
    }),
  });

  // 6. Minimum purchase 3% (Schedule 1; directors may allow staging in).
  checks.push({
    id: 'min-purchase',
    clause: 'Schedule 1 · Single security concentration',
    title: 'Minimum purchase 3%',
    status: input.smallBuys.length ? 'warn' : 'ok',
    summary: input.smallBuys.length
      ? `${input.smallBuys.length} buy${input.smallBuys.length > 1 ? 's' : ''} in the last 120 days ${input.smallBuys.length > 1 ? 'were' : 'was'} under 3% of the fund. Fine if directors approved staging in.`
      : 'No buys under 3% in the last 120 days (Competition ETF and safe fund excluded).',
    details: input.smallBuys.map((b) => `${b.date} ${b.symbol}: ${nzd(b.amount)} (${pctText(b.pct)})`),
  });

  // 7. Safe fund: at least 10%, split 50/50 VEA / BKLC (Schedule 1).
  const safe = SAFE_FUND.map((s) => ({ s, v: input.holdings.find((h) => h.symbol.toUpperCase() === s)?.value ?? 0 }));
  const safeTotal = safe.reduce((a, x) => a + x.v, 0);
  const vea = safeTotal ? (safe[0].v / safeTotal) * 100 : 0;
  const lopsided = safeTotal > 0 && Math.abs(vea - 50) > 10;
  checks.push({
    id: 'safe-fund',
    clause: 'Schedule 1 · Strategic liquidity allocation',
    title: 'Safe fund at least 10%, 50/50',
    status: weight(safeTotal) < 10 ? 'breach' : lopsided ? 'warn' : 'ok',
    summary: `Safe fund is ${pctText(weight(safeTotal))} of the portfolio, split ${vea.toFixed(0)}/${(100 - vea).toFixed(0)} VEA/BKLC.`,
    details: [
      ...safe.map((x) => `${x.s}: ${nzd(x.v)} (${pctText(weight(x.v))})`),
      'Rebalance quarterly to keep it at least 10% and close to 50/50.',
    ],
  });

  // 8. Not invested where a member works (clause 5.6).
  const heldExcluded = settings.excluded.filter((e) => input.holdings.some((h) => h.symbol.toUpperCase() === e.symbol));
  checks.push({
    id: 'excluded',
    clause: 'Clause 5.6',
    title: 'No members’ employers',
    status: heldExcluded.length ? 'breach' : settings.excluded.length ? 'ok' : 'unknown',
    summary: heldExcluded.length
      ? `The fund holds ${heldExcluded.map((e) => e.symbol).join(', ')}, where a member works.`
      : settings.excluded.length
        ? `None of the ${settings.excluded.length} listed employers are held.`
        : 'No employers listed yet. Add members’ listed employers in Admin.',
    details: heldExcluded.map((e) => `${e.symbol}${e.note ? `: ${e.note}` : ''}`),
  });

  // 9. Dividends reinvested in the asset they came from (clause 7.2).
  const toReinvest = input.dividendsToReinvest.filter((d) => d.amount >= 1).sort((a, b) => b.amount - a.amount);
  checks.push({
    id: 'reinvest',
    clause: 'Clause 7.2',
    title: 'Reinvest dividends',
    status: toReinvest.length ? 'info' : 'ok',
    summary: toReinvest.length
      ? `${nzd(toReinvest.reduce((a, d) => a + d.amount, 0))} in dividends hasn’t been put back into the holdings that paid it yet.`
      : 'No dividends waiting to be reinvested.',
    details: toReinvest.map((d) => `${d.symbol}: ${nzd(d.amount)}${d.since ? ` since last buy on ${d.since}` : ''}`),
  });

  return checks;
}

// ── Cash on hand and weekly contributions (clause 5.2A) ─────────────────────

export interface CashPlan {
  cash: number;
  members: number;
  weeklyPerMember: number;
  weeklyTotal: number;
  /** Cash expected in 4 weeks and by the AGM if every member pays every week and nothing is bought. */
  in4Weeks: number;
  agm: string;
  byAgm: number;
  /** Contributions tracker (needs a start date in Admin). */
  start: string | null;
  expectedSinceStart: number | null;
  depositedSinceStart: number | null;
}

export function cashPlan(opts: {
  today: string;
  cash: number;
  members: number;
  settings: RulesSettings;
  deposits: { date: string; amount: number }[];
}): CashPlan {
  const weeklyTotal = opts.members * opts.settings.weeklyContribution;
  const agm = agmDate(opts.today);
  const weeksToAgm = Math.max(0, Math.floor(daysBetween(opts.today, agm) / 7));
  const start = opts.settings.contributionsStart;
  let expected: number | null = null;
  let deposited: number | null = null;
  if (start && start <= opts.today) {
    const weeks = Math.floor(daysBetween(start, opts.today) / 7) + 1;
    expected = weeks * weeklyTotal;
    deposited = opts.deposits.filter((d) => d.date >= start).reduce((a, d) => a + d.amount, 0);
  }
  return {
    cash: opts.cash,
    members: opts.members,
    weeklyPerMember: opts.settings.weeklyContribution,
    weeklyTotal,
    in4Weeks: opts.cash + 4 * weeklyTotal,
    agm,
    byAgm: opts.cash + weeksToAgm * weeklyTotal,
    start,
    expectedSinceStart: expected,
    depositedSinceStart: deposited,
  };
}

// ── Buy-in / buy-out prices (clauses 10–12) ─────────────────────────────────

export type ExitCase = 'join' | 'quit' | 'dissent' | 'death' | 'default';

export const EXIT_CASES: { id: ExitCase; label: string; clause: string }[] = [
  { id: 'join', label: 'New member buying in', clause: '10.1(c)–(e)' },
  { id: 'quit', label: 'Member quitting', clause: '10.2(c)' },
  { id: 'dissent', label: 'Leaving after a rule change they voted against', clause: '10.2(g)' },
  { id: 'death', label: 'Death, insolvency or incapacity', clause: '11' },
  { id: 'default', label: 'Defaulting member (forced sale)', clause: '12.2' },
];

export interface ExitQuote {
  stake: number; // NAV ÷ members
  adjustment: number; // + premium paid in, − levy taken off
  amount: number; // what the person pays (join) or receives (others)
  rule: string;
  navDate: string;
  dueBy: string;
  dueNote: string;
}

/** Sunday NAV date for a payment/buy-in date: the Sunday immediately before it. */
export function sundayBefore(iso: string): string {
  const d = parse(iso);
  const back = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - back);
  return toDay(d);
}

/**
 * The agreement prices everything off "pro rata NAV as at 12pm on the Sunday".
 * Premiums/levies are applied to one member's whole stake (NAV ÷ members),
 * and `actualCosts` covers option (iii) "actual, verifiable costs".
 */
export function quoteExit(opts: {
  kind: ExitCase;
  nav: number;
  navDate: string;
  members: number;
  actualCosts?: number;
  /** The date entered (payment, buy-in or Board resolution date). */
  date?: string;
}): ExitQuote {
  const stake = opts.members > 0 ? opts.nav / opts.members : 0;
  const costs = Math.max(0, opts.actualCosts ?? 0);
  const friday = (() => {
    const d = parse(opts.navDate);
    d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7 || 7));
    return toDay(d);
  })();
  const monday = (() => {
    const d = parse(opts.navDate);
    d.setUTCDate(d.getUTCDate() + ((1 - d.getUTCDay() + 7) % 7 || 7));
    return toDay(d);
  })();
  switch (opts.kind) {
    case 'join': {
      const premium = Math.max(stake * 0.02, 50, costs);
      return {
        stake,
        adjustment: premium,
        amount: stake + premium,
        rule: 'Stake plus a premium: the greater of 2%, $50 or actual admission costs.',
        navDate: opts.navDate,
        dueBy: monday,
        dueNote: 'New member deposits by the Monday after the NAV date.',
      };
    }
    case 'quit': {
      const levy = Math.max(stake * 0.04, 100, costs);
      return {
        stake,
        adjustment: -levy,
        amount: stake - levy,
        rule: 'Stake minus the Quitters Levy: the greater of 4%, $100 or actual selling costs.',
        navDate: opts.navDate,
        dueBy: friday,
        dueNote: 'Company pays by the Friday after the NAV date (after 14 days’ notice).',
      };
    }
    case 'dissent':
      return {
        stake,
        adjustment: -stake * 0.025,
        amount: stake * 0.975,
        rule: 'Stake minus 2.5% (instead of the 4% Quitters Levy).',
        navDate: opts.navDate,
        dueBy: friday,
        dueNote: 'Notice within 7 days of the vote; company pays by the Friday after the NAV date.',
      };
    case 'death':
      return {
        stake,
        adjustment: 0,
        amount: stake,
        rule: 'Full stake, no levy or discount.',
        navDate: opts.navDate,
        dueBy: friday,
        dueNote: 'Company pays by the Friday after the NAV date.',
      };
    case 'default':
      return {
        stake,
        adjustment: -stake * 0.04,
        amount: stake * 0.96,
        rule: 'Stake minus 4%.',
        navDate: opts.navDate,
        dueBy: addBusinessDays(opts.date ?? opts.navDate, 7),
        dueNote: 'Company pays within 7 business days of the Board resolution (the date entered).',
      };
  }
}

// ── Polls (clause 6.3) ──────────────────────────────────────────────────────

export const POLL_MIN_HOURS = 48;
export const POLL_TURNOUT = 0.65;

/** Votes needed for a poll to count: 65% of members, rounded up. */
export const requiredTurnout = (members: number) => Math.ceil(members * POLL_TURNOUT - 1e-9);

/** An option carries when turnout is met and it has more than half the votes cast. */
export function pollResult(optionVotes: number[], members: number) {
  const cast = optionVotes.reduce((a, b) => a + b, 0);
  const needed = requiredTurnout(members);
  const quorate = cast >= needed;
  const winner = quorate ? optionVotes.findIndex((v) => v * 2 > cast) : -1;
  return { cast, needed, quorate, winner };
}
