/**
 * IBKR Flex Web Service client.
 *
 * 1. SendRequest?t=<token>&q=<queryId>&v=3   → a reference code
 * 2. GetStatement?t=<token>&q=<refCode>&v=3  → the statement (once IBKR has generated it)
 *
 * IBKR allows 1 request/second and 10/minute per token, and statement generation
 * usually takes a few seconds, so we poll politely.
 */
import { flexErrorFromXml } from './parse';

const BASE =
  process.env.IBKR_FLEX_BASE_URL ??
  'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService';

// IBKR rejects requests without a User-Agent.
const HEADERS = { 'User-Agent': 'Winnerland/2.0 (+https://inertia.education)' };

// Codes IBKR documents as "try again shortly".
const RETRYABLE = new Set(['1001', '1004', '1005', '1006', '1007', '1008', '1009', '1018', '1019', '1021']);

const HINTS: Record<string, string> = {
  '1012': 'The Flex token has expired. Generate a new one in IBKR → Settings → Flex Web Service and update IBKR_FLEX_TOKEN.',
  '1013': 'IBKR is blocking this server by IP. Remove the IP restriction on the Flex Web Service token.',
  '1014': 'The query ID is invalid. Check IBKR_FLEX_QUERY_ID matches the Activity Flex Query.',
  '1015': 'The Flex token is invalid. Check IBKR_FLEX_TOKEN.',
  '1010': 'This is a legacy Flex Query. Create a new Activity Flex Query.',
};

export class FlexError extends Error {
  constructor(
    public code: string | null,
    message: string,
  ) {
    super(code ? `IBKR Flex error ${code}: ${message}${HINTS[code] ? ` ${HINTS[code]}` : ''}` : message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new FlexError(null, `IBKR responded with HTTP ${res.status}.`);
  return text;
}

export interface FetchFlexOptions {
  token: string;
  queryId: string;
  /** Optional override of the query's period, yyyyMMdd (max 365 days apart). */
  fromDate?: string;
  toDate?: string;
  /** Give up polling after this many ms (keep under the function time limit). */
  timeoutMs?: number;
}

export async function fetchFlexStatement(opts: FetchFlexOptions): Promise<string> {
  const { token, queryId, fromDate, toDate, timeoutMs = 45_000 } = opts;
  const started = Date.now();

  const sendParams = new URLSearchParams({ t: token, q: queryId, v: '3' });
  if (fromDate) sendParams.set('fd', fromDate);
  if (toDate) sendParams.set('td', toDate);

  // Step 1: ask IBKR to generate the statement.
  let refCode: string | null = null;
  let statementUrl = `${BASE}/GetStatement`;
  for (let attempt = 0; attempt < 4 && !refCode; attempt++) {
    const xml = await get(`${BASE}/SendRequest?${sendParams}`);
    const status = /<Status>([^<]*)<\/Status>/i.exec(xml)?.[1]?.trim().toLowerCase();
    if (status === 'success') {
      refCode = /<ReferenceCode>([^<]*)<\/ReferenceCode>/i.exec(xml)?.[1]?.trim() ?? null;
      statementUrl = /<Url>([^<]*)<\/Url>/i.exec(xml)?.[1]?.trim() || statementUrl;
      break;
    }
    const err = flexErrorFromXml(xml);
    if (!err || !err.code || !RETRYABLE.has(err.code)) {
      throw new FlexError(err?.code ?? null, err?.message ?? 'SendRequest failed.');
    }
    await sleep(2_000 * (attempt + 1));
  }
  if (!refCode) throw new FlexError(null, 'IBKR did not return a reference code.');

  // Step 2: poll until the statement is ready.
  let wait = 2_000;
  await sleep(wait);
  while (Date.now() - started < timeoutMs) {
    const getParams = new URLSearchParams({ t: token, q: refCode, v: '3' });
    const xml = await get(`${statementUrl}?${getParams}`);
    if (/<FlexQueryResponse/i.test(xml)) return xml;

    const err = flexErrorFromXml(xml);
    if (err && err.code && !RETRYABLE.has(err.code)) throw new FlexError(err.code, err.message);
    wait = Math.min(wait + 1_500, 6_000);
    await sleep(wait);
  }
  throw new FlexError(
    null,
    'IBKR is still generating the statement. It usually works on the next try, so run the sync again in a minute.',
  );
}

export function flexConfig(): { token: string; queryId: string } {
  const token = process.env.IBKR_FLEX_TOKEN;
  const queryId = process.env.IBKR_FLEX_QUERY_ID;
  if (!token || !queryId) {
    throw new FlexError(null, 'IBKR_FLEX_TOKEN and IBKR_FLEX_QUERY_ID must be set in the environment.');
  }
  return { token, queryId };
}
