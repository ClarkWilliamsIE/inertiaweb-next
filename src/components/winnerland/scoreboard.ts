'use client';

/**
 * Whether the fund is currently "losing", so the whole site (top bar, browser
 * tab), not just the fund page heading, can say Loserland. The fund page sets
 * it after loading; other pages show the last known result, remembered in
 * this browser.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'wl-losing';
const EVENT = 'wl-scoreboard';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setLosing(losing: boolean) {
  try {
    if (read() === losing) return;
    localStorage.setItem(KEY, losing ? '1' : '0');
  } catch {
    /* storage blocked: the fund page heading still shows the right name */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useLosing(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

export const siteName = (losing: boolean) => (losing ? 'Loserland' : 'Winnerland');
