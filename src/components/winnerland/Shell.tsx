'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

import { useMember } from './AuthProvider';
import { siteName, useLosing } from './scoreboard';

const NAV = [
  { href: '/winnerland', label: 'Fund' },
  { href: '/winnerland/watchlist', label: 'Watchlist' },
  { href: '/winnerland/competition', label: 'Competition' },
  { href: '/winnerland/polls', label: 'Polls' },
  { href: '/winnerland/admin', label: 'Admin' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { displayName, signOut } = useMember();
  const losing = useLosing();
  const name = siteName(losing);

  // The browser tab title follows the scoreboard too ("Fund | Loserland").
  useEffect(() => {
    const fix = () => {
      const want = document.title.replace(/Winnerland|Loserland/g, name);
      if (want !== document.title) document.title = want;
    };
    fix();
    const titleEl = document.querySelector('title');
    if (!titleEl) return;
    const obs = new MutationObserver(fix); // Next.js resets the title on navigation
    obs.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => obs.disconnect();
  }, [name, pathname]);

  return (
    <div className="wl-shell">
      <header className="wl-topbar">
        <Link href="/winnerland" className="wl-brand" aria-label={`${name} home`}>
          <span className="wl-brand__mark" aria-hidden="true">{name[0]}</span>
          <span className="wl-brand__name">{name}</span>
        </Link>
        <nav className="wl-nav" aria-label="Winnerland sections">
          {NAV.map((n) => {
            const active = n.href === '/winnerland' ? pathname === n.href : pathname?.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className="wl-nav__link" aria-current={active ? 'page' : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="wl-topbar__me">
          <span className="wl-avatar" aria-hidden="true">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="wl-topbar__name">{displayName}</span>
          <button type="button" className="wl-btn wl-btn--ghost wl-btn--sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="wl-main">{children}</main>
    </div>
  );
}

/** Whole fund ↔ one member's share. */
export function SplitToggle({ memberCount }: { memberCount: number }) {
  const { split, setSplit } = useMember();
  return (
    <div className="wl-segmented" role="group" aria-label="Show values for">
      <button type="button" aria-pressed={!split} onClick={() => setSplit(false)}>
        Whole fund
      </button>
      <button type="button" aria-pressed={split} onClick={() => setSplit(true)}>
        My share <span className="wl-muted">1/{memberCount}</span>
      </button>
    </div>
  );
}
