
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

/** Service-role client: bypasses RLS. Only for the IBKR sync writing data. */
export function getServiceSupabase(): SupabaseClient {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client that acts as the signed-in member, so Row Level Security applies. */
export function getUserSupabase(accessToken: string): SupabaseClient {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export type AuthedRequest = { user: User; token: string; db: SupabaseClient };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Verifies the member's Supabase access token (sent as `Authorization: Bearer …`)
 * and checks they are on the members list (if one is set up).
 */
export async function requireMember(req: Request): Promise<AuthedRequest> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Sign in to see this.');

  const db = getUserSupabase(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Sign in again.');

  const { data: isMember, error: rpcError } = await db.rpc('pf_is_member');
  if (rpcError) {
    throw new HttpError(
      500,
      'The Winnerland database tables are missing. Run supabase/migrations/001_winnerland_ibkr.sql.',
    );
  }
  if (!isMember) throw new HttpError(403, "Your account isn't on the Winnerland members list.");

  return { user: data.user, token, db };
}

/** Admin = member whose email is in WINNERLAND_ADMIN_EMAILS (or any member if unset). */
export function isAdminEmail(email: string | undefined | null): boolean {
  const list = (process.env.WINNERLAND_ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true;
  return !!email && list.includes(email.toLowerCase());
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : 'Unexpected error';
  return Response.json({ error: message }, { status: 500 });
}
