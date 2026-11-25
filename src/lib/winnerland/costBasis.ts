/**
 * Works out a holding's cost from its trade history, because IBKR's Flex
 * Query sends 0 for cost basis / average price on this account.
 *
 * Method: FIFO (IBKR's default). Buys are added as lots (price × quantity plus
 * commission); sells use up the oldest lots first. What's left is the cost of
 * the shares still held.
 *
 * It only returns a number when the trades account for EXACTLY the quantity
 * held. If history is missing (shares bought before the imported period, a
 * transfer in, a split), it returns null so the page shows "—" instead of a
 * wrong figure. Import older years via Admin → "Import a Flex XML file" to
 * fill gaps.
 */

export interface CostTrade {
  quantity: number; // + buy, − sell
  price: number | null;
  commission: number | null; // IBKR reports commissions as negative numbers
  when: string; // ISO date/time, for ordering
  id: string; // tie-breaker for trades at the same time
}

/**
 * A share split entered by hand in Admin → Fund settings (IBKR's Flex Query
 * doesn't include them as trades). ratio = new shares per old share:
 * 3 for a 3-for-1 split, 0.1 for a 1-for-10 reverse split.
 */
export interface ShareSplit {
  symbol: string;
  date: string; // yyyy-mm-dd: any day after the last trade before the split and before the first trade after it
  ratio: number;
}

/** Reads the `splits` setting, dropping anything malformed. */
export function parseSplits(value: unknown): ShareSplit[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => ({
      symbol: String(v?.symbol ?? '').trim().toUpperCase(),
      date: String(v?.date ?? '').slice(0, 10),
      ratio: Number(v?.ratio),
    }))
    .filter((s) => s.symbol && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && Number.isFinite(s.ratio) && s.ratio > 0 && s.ratio !== 1);
}

const TOLERANCE = 1e-6;

/** Total cost (in the trade currency) of `held` units, or null if the trades don't explain the holding. */
export function fifoCost(
  trades: CostTrade[],
  held: number,
  multiplier = 1,
  splits: { date: string; ratio: number }[] = [],
): number | null {
  if (!(held > 0) || trades.length === 0) return null;
  // A split dated "yyyy-mm-dd" sorts before any trade on that day ("yyyy-mm-ddT…"),
  // i.e. it takes effect at the start of the day, like an ex-date.
  type Event = { when: string; id: string; trade?: CostTrade; ratio?: number };
  const events: Event[] = [
    ...trades.map((t) => ({ when: t.when, id: t.id, trade: t })),
    ...splits.map((s, i) => ({ when: s.date, id: `split-${i}`, ratio: s.ratio })),
  ].sort((a, b) => (a.when === b.when ? (a.id < b.id ? -1 : 1) : a.when < b.when ? -1 : 1));

  const lots: { qty: number; unitCost: number }[] = [];
  for (const e of events) {
    if (e.ratio != null) {
      // Each share becomes `ratio` shares; the money paid for the lot doesn't change.
      for (const lot of lots) {
        lot.qty *= e.ratio;
        lot.unitCost /= e.ratio;
      }
      continue;
    }
    const t = e.trade!;
    if (t.quantity > 0) {
      if (t.price == null) return null;
      const total = t.quantity * t.price * multiplier + Math.abs(t.commission ?? 0);
      lots.push({ qty: t.quantity, unitCost: total / t.quantity });
    } else if (t.quantity < 0) {
      let toSell = -t.quantity;
      while (toSell > TOLERANCE) {
        const lot = lots[0];
        if (!lot) return null; // sold shares we have no record of buying → history incomplete
        const used = Math.min(lot.qty, toSell);
        lot.qty -= used;
        toSell -= used;
        if (lot.qty <= TOLERANCE) lots.shift();
      }
    }
  }

  const remaining = lots.reduce((a, l) => a + l.qty, 0);
  if (Math.abs(remaining - held) > Math.max(TOLERANCE, held * 1e-6)) return null;
  return lots.reduce((a, l) => a + l.qty * l.unitCost, 0);
}
