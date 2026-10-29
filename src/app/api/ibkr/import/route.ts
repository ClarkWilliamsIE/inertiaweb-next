import { parseFlexStatement } from '@/lib/ibkr/parse';
import { finishSyncRun, startSyncRun, storeFlexResult } from '@/lib/ibkr/store';
import { errorResponse, getServiceSupabase, HttpError, isAdminEmail, requireMember } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Upload a Flex statement XML file downloaded from IBKR (Performance & Reports →
 * Flex Queries → Run). Used to backfill history older than the scheduled query covers.
 */
export async function POST(req: Request) {
  try {
    const { user } = await requireMember(req);
    if (!isAdminEmail(user.email)) throw new HttpError(403, 'Only Winnerland admins can import statements.');
    const xml = await req.text();
    if (xml.length > 40_000_000) throw new HttpError(413, 'That file is too large. Split it into smaller date ranges.');

    let parsed;
    try {
      parsed = parseFlexStatement(xml);
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : 'Could not read that file.');
    }

    const db = getServiceSupabase();
    const runId = await startSyncRun(db, 'upload');
    try {
      const counts = await storeFlexResult(db, parsed);
      const message = `Imported ${counts.navDays} days of account value, ${counts.positions} holdings, ${counts.trades} trades and ${counts.cashTransactions} cash movements from the uploaded file.`;
      await finishSyncRun(db, runId, 'success', message, counts);
      return Response.json({ ok: true, message, counts });
    } catch (e) {
      await finishSyncRun(db, runId, 'error', e instanceof Error ? e.message : String(e));
      throw e;
    }
  } catch (err) {
    return errorResponse(err);
  }
}
