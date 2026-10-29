'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { getBrowserSupabase } from '@/lib/supabase/browser';

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getBrowserSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace('/winnerland');
      });
  }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = getBrowserSupabase();
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace('/winnerland');
        return;
      }
      if (mode === 'signup') {
        if (!firstName.trim()) throw new Error('Enter your first name so members know who you are.');
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { first_name: firstName.trim() } },
        });
        if (error) throw error;
        if (data.session) router.replace('/winnerland');
        else setMsg({ ok: true, text: 'Check your email to confirm your account, then sign in.' });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/winnerland/login`,
        });
        if (error) throw error;
        setMsg({ ok: true, text: 'If that email has an account, a reset link is on its way.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    }
    setBusy(false);
  };

  return (
    <main className="wl-login">
      <div className="wl-login__card">
        <p className="wl-wordmark wl-wordmark--login is-winning">Winnerland</p>
        <p className="wl-muted">The members’ fund. Sign in to see how we’re doing.</p>

        <form onSubmit={submit} className="wl-login__form">
          {mode === 'signup' && (
            <label className="wl-field">
              <span>First name</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
            </label>
          )}
          <label className="wl-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          {mode !== 'reset' && (
            <label className="wl-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>
          )}
          {msg && (
            <p className={`wl-small ${msg.ok ? 'wl-tone-up' : 'wl-tone-down'}`} role="status">
              {msg.text}
            </p>
          )}
          <button type="submit" className="wl-btn wl-btn--primary wl-btn--block" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="wl-login__switch">
          {mode === 'signin' ? (
            <>
              <button type="button" className="wl-link" onClick={() => setMode('signup')}>
                Create an account
              </button>
              <button type="button" className="wl-link wl-link--quiet" onClick={() => setMode('reset')}>
                Forgot password
              </button>
            </>
          ) : (
            <button type="button" className="wl-link" onClick={() => setMode('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
