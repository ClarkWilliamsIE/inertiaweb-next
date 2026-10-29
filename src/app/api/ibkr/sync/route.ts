import { fetchFlexStatement, flexConfig } from '@/lib/ibkr/flex';
import { parseFlexStatement } from '@/lib/ibkr/parse';
import { finishSyncRun, startSyncRun, storeFlexResult } from '@/lib/ibkr/store';
import { errorResponse, getServiceSupabase, HttpError, isAdminEmail, requireMember } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function runSync(trigger: string, range?: { from?: string; to?: string }) {
  const db = getServiceSupabase();
  const runId = await startSyncRun(db, trigger);
  try {
    const { token, queryId } = flexConfig();
    const xml = await fetchFlexStatement({ token, queryId, fromDate: range?.from, toDate: range?.to, timeoutMs: 45_000 });
    const parsed = parseFlexStatement(xml);
    const counts = await storeFlexResult(db, parsed);
    const message = `Imported ${counts.navDays} days of account value, ${counts.positions} holdings, ${counts.trades} trades and ${counts.cashTransactions} cash movements.`;
    await finishSyncRun(db, runId, 'success', message, counts);
    return Response.json({ ok: true, message, counts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishSyncRun(db, runId, 'error', message);
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}

/** Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runSync('cron');
}

/** "Sync now" from the admin page. Optional body { from: 'yyyyMMdd', to: 'yyyyMMdd' }. */
export async function POST(req: Request) {
  try {
    const { user } = await requireMember(req);
    if (!isAdminEmail(user.email)) throw new HttpError(403, 'Only Winnerland admins can run a sync.');
    let range: { from?: string; to?: string } | undefined;
    try {
      const body = await req.json();
      const ok = (v: unknown) => (typeof v === 'string' && /^\d{8}$/.test(v) ? v : undefined);
      range = { from: ok(body?.from), to: ok(body?.to) };
    } catch {
      range = undefined;
    }
    return await runSync('manual', range);
  } catch (err) {
    return errorResponse(err);
  }
}
