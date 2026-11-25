'use client';

/**
 * Remembers the last Fund data in this browser so the page can show it
 * straight away and refresh in the background. Cleared on sign-out. Storage
 * can be unavailable (private windows, blocked site data), so every access is
 * guarded and the page still works without it.
 */
import type { PortfolioResponse } from '@/lib/winnerland/types';

const KEY = 'wl-fund-cache-v1';

export interface CachedFund {
  data: PortfolioResponse;
  savedAt: string; // ISO
}

export function readFundCache(): CachedFund | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFund;
    // Older shapes (before a site update) are ignored rather than half-rendered.
    if (!parsed?.data?.totals || !Array.isArray(parsed.data.holdings) || !Array.isArray(parsed.data.rules)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFundCache(data: PortfolioResponse) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ data, savedAt: new Date().toISOString() } satisfies CachedFund));
  } catch {
    /* storage full or blocked: fine, just no instant load next time */
  }
}

export function clearFundCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
