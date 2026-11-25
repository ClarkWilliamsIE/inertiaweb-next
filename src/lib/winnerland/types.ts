// Shapes shared by the Winnerland API routes and the dashboard UI.
import type { CashPlan, RuleCheck } from './rules';

export type Point = [string, number]; // [YYYY-MM-DD, value]

export interface HoldingView {
  key: string;
  symbol: string;
  yahoo: string;
  name: string | null;
  assetCategory: string | null;
  currency: string;
  quantity: number;
  /** Latest price in the holding's own currency (live if available). */
  price: number | null;
  /** Average cost per unit, own currency. */
  avgCost: number | null;
  /** Values below are in the fund's base currency. */
  value: number;
  cost: number | null;
  unrealized: number | null;
  unrealizedPct: number | null;
  weight: number;
  dayChange: number | null;
  dayChangePct: number | null;
  isLive: boolean;
  spark: number[];
  /** True for the combined "Competition ETF" row (quantity = number of picks). */
  isGroup?: boolean;
}

export interface ActivityItem {
  id: string;
  date: string;
  kind: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal' | 'interest' | 'fee' | 'tax' | 'other';
  symbol: string | null;
  label: string;
  quantity: number | null;
  price: number | null;
  currency: string | null;
  amountBase: number;
}

export interface PortfolioResponse {
  baseCurrency: string;
  memberCount: number;
  accounts: string[];
  /** Date of the latest IBKR statement data. */
  asOf: string | null;
  lastSync: { at: string; status: string; message: string | null } | null;
  totals: {
    value: number;
    cash: number;
    invested: number;
    costBasis: number | null;
    unrealized: number | null;
    contributions: number | null;
    gain: number | null;
    gainPct: number | null;
    dividends12m: number;
    realized12m: number;
  };
  live: {
    total: number;
    dayChange: number;
    dayChangePct: number;
    isOpen: boolean;
    asOf: string | null;
    coverage: number; // share of holdings value with a live quote (0–1)
  } | null;
  nav: Point[];
  contributions: Point[];
  intraday: [number, number][];
  holdings: HoldingView[];
  activity: ActivityItem[];
  /** Holdings that make up the members' Competition ETF (shown as one row). */
  competitionSymbols: string[];
  /** Shareholder agreement / investment policy checks. */
  rules: RuleCheck[];
  /** Cash on hand and expected weekly contributions; null if it couldn't be worked out. */
  cashPlan: CashPlan | null;
  empty: boolean;
}

export interface HoldingDetailResponse {
  symbol: string;
  yahoo: string;
  currency: string | null;
  history: [number, number][];
  trades: {
    date: string;
    side: string;
    quantity: number;
    price: number | null;
    currency: string | null;
  }[];
  dividendsBase: number;
}
