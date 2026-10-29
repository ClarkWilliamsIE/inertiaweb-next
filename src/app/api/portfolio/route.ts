import { errorResponse, requireMember } from '@/lib/supabase/server';
import { buildPortfolio } from '@/lib/winnerland/portfolio';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const { db } = await requireMember(req);
    const live = new URL(req.url).searchParams.get('live') !== '0';
    const data = await buildPortfolio(db, { live });
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
