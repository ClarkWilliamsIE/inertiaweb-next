'use client';

import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';

interface Ctx {
  session: Session;
  user: User;
  displayName: string;
  /** fetch() against our own API with the member's access token attached. */
  api: <T>(path: string, init?: RequestInit) => Promise<T>;
  signOut: () => Promise<void>;
  /** Per-member view: divide money by the number of members. */
  split: boolean;
  setSplit: (v: boolean) => void;
}

const AuthContext = createContext<Ctx | null>(null);

export function useMember(): Ctx {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useMember must be used inside <MemberGate>');
  return c;
}

export function nameFor(user: User): string {
  const meta = user.user_metadata as { first_name?: string } | undefined;
  return meta?.first_name?.trim() || user.email?.split('@')[0] || 'Member';
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function MemberGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [split, setSplitState] = useState(false);

  useEffect(() => {
    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    try {
      setSplitState(localStorage.getItem('wl-split') === '1');
    } catch {
      /* storage unavailable */
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.replace('/winnerland/login');
  }, [session, router]);

  const setSplit = useCallback((v: boolean) => {
    setSplitState(v);
    try {
      localStorage.setItem('wl-split', v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const token = session?.access_token;
  const api = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const { data } = await getBrowserSupabase().auth.getSession();
    const bearer = data.session?.access_token ?? token ?? '';
    const res = await fetch(path, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${bearer}` },
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      const msg = (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
      throw new ApiError(res.status, msg);
    }
    return body as T;
  }, [token]);

  const value = useMemo<Ctx | null>(() => {
    if (!session) return null;
    return {
      session,
      user: session.user,
      displayName: nameFor(session.user),
      split,
      setSplit,
      signOut: async () => {
        await getBrowserSupabase().auth.signOut();
        router.replace('/winnerland/login');
      },
      api,
    };
  }, [session, split, setSplit, router, api]);

  if (!value) {
    return (
      <div className="wl-boot" aria-busy="true">
        <span className="wl-wordmark wl-wordmark--small">Winnerland</span>
      </div>
    );
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
