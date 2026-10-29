/**
 * Parser for IBKR Activity Flex Query statements (XML format).
 *
 * Flex XML is flat: every record is a single element whose data lives in its
 * attributes, e.g. <OpenPosition symbol="NVDA" position="10" ... />. So rather
 * than pull in an XML library we walk the elements with a small tokenizer.
 */

export type Attrs = Record<string, string>;

export interface FlexNavRow {
  accountId: string;
  reportDate: string; // YYYY-MM-DD
  currency: string | null;
  cash: number | null;
  stock: number | null;
  options: number | null;
  funds: number | null;
  crypto: number | null;
  interestAccruals: number | null;
  dividendAccruals: number | null;
  total: number;
}

export interface FlexPositionRow {
  accountId: string;
  reportDate: string;
  conid: string;
  symbol: string;
  description: string | null;
  assetCategory: string | null;
  currency: string | null;
  listingExchange: string | null;
  quantity: number;
  multiplier: number;
  markPrice: number | null;
  positionValue: number | null;
  costBasisPrice: number | null;
  costBasisMoney: number | null;
  unrealizedPnl: number | null;
  fxRateToBase: number;
  percentOfNav: number | null;
}

export interface FlexTradeRow {
  accountId: string;
  tradeId: string;
  tradeDate: string;
  dateTime: string | null; // ISO timestamp
  symbol: string;
  description: string | null;
  conid: string | null;
  assetCategory: string | null;
  currency: string | null;
  buySell: string | null;
  quantity: number;
  tradePrice: number | null;
  proceeds: number | null;
  commission: number | null;
  netCash: number | null;
  fxRateToBase: number;
  realizedPnl: number | null;
}

export interface FlexCashRow {
  accountId: string;
  transactionId: string;
  date: string;
  dateTime: string | null;
  type: string;
  symbol: string | null;
  description: string | null;
  currency: string | null;
  amount: number;
  fxRateToBase: number;
}

export interface FlexStatementParsed {
  accountId: string;
  baseCurrency: string | null;
  fromDate: string | null;
  toDate: string | null;
  whenGenerated: string | null;
  nav: FlexNavRow[];
  positions: FlexPositionRow[];
  trades: FlexTradeRow[];
  cash: FlexCashRow[];
  changeInNav: Attrs | null;
}

export interface FlexParseResult {
  queryName: string | null;
  statements: FlexStatementParsed[];
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

interface Tag {
  name: string;
  attrs: Attrs;
  closing: boolean;
}

/** Yields every start / self-closing / end tag in document order. */
function* tags(xml: string): Generator<Tag> {
  const re = /<(\/?)([A-Za-z_][\w.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/g;
  const attrRe = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const attrs: Attrs = {};
    if (m[3]) {
      let a: RegExpExecArray | null;
      attrRe.lastIndex = 0;
      while ((a = attrRe.exec(m[3]))) attrs[a[1]] = decode(a[2] ?? a[3] ?? '');
    }
    yield { name: m[2], attrs, closing: m[1] === '/' };
  }
}

export function num(v: string | undefined | null): number | null {
  if (v == null) return null;
  const t = v.trim().replace(/,/g, '');
  if (t === '' || t === '--' || t.toUpperCase() === 'N/A') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Accepts yyyyMMdd, yyyy-MM-dd, MM/dd/yyyy (IBKR's options), with optional time part. */
export function flexDate(v: string | undefined | null): string | null {
  if (!v) return null;
  const s = v.trim();
  let m = /^(\d{4})(\d{2})(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;
  m = /^(\d{2})\/(\d{2})\/(\d{2})(?!\d)/.exec(s);
  if (m) return `20${m[3]}-${m[1]}-${m[2]}`;
  return null;
}

/**
 * IBKR reports execution times in US Eastern time. Converts "20261028;153012"
 * (or "2026-10-28, 15:30:12") into a UTC ISO string.
 */
export function flexDateTime(v: string | undefined | null): string | null {
  const date = flexDate(v);
  if (!date || !v) return null;
  const t = /[;,\sT]\s*(\d{2}):?(\d{2}):?(\d{2})?/.exec(v.slice(8));
  const hh = t ? Number(t[1]) : 0;
  const mm = t ? Number(t[2]) : 0;
  const ss = t && t[3] ? Number(t[3]) : 0;
  const [y, mo, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, mo - 1, d, hh, mm, ss);
  const offset = newYorkOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60_000).toISOString();
}

function newYorkOffsetMinutes(at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'shortOffset',
    }).formatToParts(at);
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-5';
    const m = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(tz);
    if (!m) return -300;
    const h = Number(m[1]);
    return h * 60 + (h < 0 ? -1 : 1) * Number(m[2] ?? 0);
  } catch {
    return -300;
  }
}

function hashKey(parts: (string | undefined)[]): string {
  // Small stable hash (FNV-1a) for rows that have no IBKR id.
  let h = 0x811c9dc5;
  const s = parts.map((p) => p ?? '').join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return 'h' + (h >>> 0).toString(16);
}

const fx = (a: Attrs) => num(a.fxRateToBase) ?? 1;

/** Statement-level problems IBKR reports inside an otherwise "successful" response. */
export function flexErrorFromXml(xml: string): { code: string | null; message: string } | null {
  if (!/<FlexStatementResponse/i.test(xml)) return null;
  const status = /<Status>([^<]*)<\/Status>/i.exec(xml)?.[1]?.trim();
  if (status && status.toLowerCase() === 'success') return null;
  const code = /<ErrorCode>([^<]*)<\/ErrorCode>/i.exec(xml)?.[1]?.trim() ?? null;
  const message = /<ErrorMessage>([^<]*)<\/ErrorMessage>/i.exec(xml)?.[1]?.trim() ?? status ?? 'Unknown error';
  return { code, message: decode(message) };
}

export function parseFlexStatement(xml: string): FlexParseResult {
  if (!/<FlexQueryResponse/i.test(xml)) {
    const err = flexErrorFromXml(xml);
    throw new Error(
      err
        ? `IBKR returned error ${err.code ?? ''}: ${err.message}`.trim()
        : "This doesn't look like an IBKR Flex Query statement in XML format.",
    );
  }

  let queryName: string | null = null;
  const statements: FlexStatementParsed[] = [];
  let cur: FlexStatementParsed | null = null;

  // Trades can be reported at several levels of detail. Keep executions if
  // present, otherwise orders, and never the summary/closed-lot rows.
  const rawTrades: { st: FlexStatementParsed; a: Attrs }[] = [];

  for (const tag of tags(xml)) {
    if (tag.closing) {
      if (tag.name === 'FlexStatement') cur = null;
      continue;
    }
    const a = tag.attrs;
    switch (tag.name) {
      case 'FlexQueryResponse':
        queryName = a.queryName ?? null;
        break;
      case 'FlexStatement':
        cur = {
          accountId: a.accountId ?? 'UNKNOWN',
          baseCurrency: null,
          fromDate: flexDate(a.fromDate),
          toDate: flexDate(a.toDate),
          whenGenerated: a.whenGenerated ? flexDateTime(a.whenGenerated) : null,
          nav: [],
          positions: [],
          trades: [],
          cash: [],
          changeInNav: null,
        };
        statements.push(cur);
        break;
      case 'AccountInformation':
        if (cur && a.currency) cur.baseCurrency = a.currency;
        break;
      case 'EquitySummaryByReportDateInBase': {
        if (!cur) break;
        const reportDate = flexDate(a.reportDate);
        const total = num(a.total);
        if (!reportDate || total == null) break;
        cur.nav.push({
          accountId: a.accountId || cur.accountId,
          reportDate,
          currency: a.currency ?? null,
          cash: num(a.cash),
          stock: num(a.stock),
          options: num(a.options),
          funds: num(a.funds),
          crypto: num(a.crypto),
          interestAccruals: num(a.interestAccruals),
          dividendAccruals: num(a.dividendAccruals),
          total,
        });
        if (!cur.baseCurrency && a.currency) cur.baseCurrency = a.currency;
        break;
      }
      case 'OpenPosition': {
        if (!cur) break;
        if (a.levelOfDetail && a.levelOfDetail.toUpperCase() === 'LOT') break;
        const reportDate = flexDate(a.reportDate) ?? cur.toDate;
        const quantity = num(a.position);
        if (!reportDate || quantity == null || !a.symbol) break;
        cur.positions.push({
          accountId: a.accountId || cur.accountId,
          reportDate,
          conid: a.conid || a.symbol,
          symbol: a.symbol,
          description: a.description ?? null,
          assetCategory: a.assetCategory ?? null,
          currency: a.currency ?? null,
          listingExchange: a.listingExchange ?? null,
          quantity,
          multiplier: num(a.multiplier) ?? 1,
          markPrice: num(a.markPrice),
          positionValue: num(a.positionValue),
          costBasisPrice: num(a.costBasisPrice),
          costBasisMoney: num(a.costBasisMoney),
          unrealizedPnl: num(a.fifoPnlUnrealized),
          fxRateToBase: fx(a),
          percentOfNav: num(a.percentOfNAV),
        });
        break;
      }
      case 'Trade':
        if (cur) rawTrades.push({ st: cur, a });
        break;
      case 'CashTransaction': {
        if (!cur) break;
        const lod = (a.levelOfDetail ?? '').toUpperCase();
        if (lod && lod !== 'DETAIL') break;
        const amount = num(a.amount);
        const date = flexDate(a.dateTime) ?? flexDate(a.settleDate) ?? flexDate(a.reportDate);
        if (amount == null || !date) break;
        cur.cash.push({
          accountId: a.accountId || cur.accountId,
          transactionId:
            a.transactionID ||
            hashKey([a.accountId, a.type, a.dateTime, a.symbol, a.amount, a.currency, a.description]),
          date,
          dateTime: flexDateTime(a.dateTime),
          type: a.type ?? 'Other',
          symbol: a.symbol || null,
          description: a.description ?? null,
          currency: a.currency ?? null,
          amount,
          fxRateToBase: fx(a),
        });
        break;
      }
      case 'ChangeInNAV':
        if (cur) cur.changeInNav = a;
        break;
    }
  }

  const hasExecutions = rawTrades.some((t) => (t.a.levelOfDetail ?? '').toUpperCase() === 'EXECUTION');
  for (const { st, a } of rawTrades) {
    const lod = (a.levelOfDetail ?? '').toUpperCase();
    if (lod) {
      if (hasExecutions && lod !== 'EXECUTION') continue;
      if (!hasExecutions && lod !== 'ORDER') continue;
    }
    const tradeDate = flexDate(a.tradeDate) ?? flexDate(a.dateTime);
    const quantity = num(a.quantity);
    if (!tradeDate || quantity == null || !a.symbol) continue;
    st.trades.push({
      accountId: a.accountId || st.accountId,
      tradeId:
        a.tradeID ||
        a.transactionID ||
        a.ibExecID ||
        hashKey([a.accountId, a.symbol, a.dateTime, a.quantity, a.tradePrice]),
      tradeDate,
      dateTime: flexDateTime(a.dateTime) ?? flexDateTime(a.tradeDate),
      symbol: a.symbol,
      description: a.description ?? null,
      conid: a.conid ?? null,
      assetCategory: a.assetCategory ?? null,
      currency: a.currency ?? null,
      buySell: a.buySell ?? (quantity >= 0 ? 'BUY' : 'SELL'),
      quantity,
      tradePrice: num(a.tradePrice),
      proceeds: num(a.proceeds),
      commission: num(a.ibCommission),
      netCash: num(a.netCash),
      fxRateToBase: fx(a),
      realizedPnl: num(a.fifoPnlRealized),
    });
  }

  if (statements.length === 0) {
    throw new Error('The Flex statement contained no accounts. Check the query includes your account.');
  }
  return { queryName, statements };
}
