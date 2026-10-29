/**
 * Maps IBKR / member-entered tickers to Yahoo Finance symbols (used for live
 * prices). IBKR gives us the listing exchange, which decides the suffix.
 */

const EXCHANGE_SUFFIX: Record<string, string> = {
  NZE: '.NZ',
  ASX: '.AX',
  LSE: '.L',
  LSEETF: '.L',
  TSE: '.TO',
  VENTURE: '.V',
  SEHK: '.HK',
  AEB: '.AS',
  IBIS: '.DE',
  IBIS2: '.DE',
  FWB: '.F',
  SBF: '.PA',
  BVME: '.MI',
  EBS: '.SW',
  SWX: '.SW',
  TSEJ: '.T',
  SGX: '.SI',
  KSE: '.KS',
};

const CRYPTO = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'LTC', 'BCH', 'DOT', 'AVAX', 'LINK', 'MATIC']);
const KNOWN_SUFFIX = /\.(NZ|AX|L|TO|V|HK|AS|DE|F|PA|MI|SW|T|SI|KS)$/i;

export function yahooForPosition(p: {
  symbol: string;
  listingExchange?: string | null;
  assetCategory?: string | null;
  currency?: string | null;
}): string {
  const sym = p.symbol.trim().toUpperCase();
  if ((p.assetCategory ?? '').toUpperCase() === 'CRYPTO') return `${sym}-${p.currency || 'USD'}`;
  const suffix = EXCHANGE_SUFFIX[(p.listingExchange ?? '').toUpperCase()];
  // IBKR writes share classes with a space ("BRK B"); Yahoo uses a dash.
  const base = sym.replace(/\s+/g, '-');
  if (suffix) return base.replace(/\./g, '-') + suffix;
  return base.replace(/\./g, '-');
}

/** For tickers members type in (watchlist, competition). */
export function yahooForTicker(ticker: string, market?: string | null): string {
  const t = ticker.trim().toUpperCase();
  if (!t) return t;
  if (t.includes('-USD') || t.endsWith('=X')) return t;
  const m = (market ?? 'AUTO').toUpperCase();
  if (m === 'CRYPTO' || (m === 'AUTO' && CRYPTO.has(t))) return `${t}-USD`;
  if (KNOWN_SUFFIX.test(t)) return t;
  if (m === 'NZE' || m === 'NZX') return `${t}.NZ`;
  if (m === 'ASX') return `${t}.AX`;
  return t.replace(/\./g, '-');
}

export function fxSymbol(from: string, to: string): string {
  return `${from.toUpperCase()}${to.toUpperCase()}=X`;
}
