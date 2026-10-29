-- Winnerland: tables for portfolio data imported from IBKR Flex Queries.
-- Run this once in Supabase → SQL Editor. It is safe to run again.
-- Existing tables (watchlist_items, watchlist_votes, polls, poll_options,
-- poll_votes, etf_members) are not touched.

-- ── Members list ────────────────────────────────────────────────────────────
-- Leave this table EMPTY and every signed-in account can see the fund (same as
-- before). Add the members' emails and only those accounts can.
create table if not exists public.pf_members (
  email text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.pf_is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    not exists (select 1 from public.pf_members)
    or exists (
      select 1 from public.pf_members
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
$$;

grant execute on function public.pf_is_member() to authenticated, anon;

-- ── Settings (member count for the per-member split, base currency, …) ──────
create table if not exists public.pf_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

insert into public.pf_settings (key, value) values
  ('member_count', '11'::jsonb),
  ('contributions_before_records', '0'::jsonb)
on conflict (key) do nothing;

-- ── Daily account value (IBKR "Equity Summary in Base") ─────────────────────
create table if not exists public.pf_nav_daily (
  account_id text not null,
  report_date date not null,
  currency text,
  cash numeric,
  stock numeric,
  options numeric,
  funds numeric,
  crypto numeric,
  interest_accruals numeric,
  dividend_accruals numeric,
  total numeric not null,
  source text not null default 'ibkr',      -- 'ibkr' or 'legacy'
  updated_at timestamptz not null default now(),
  primary key (account_id, report_date)
);

-- ── Holdings snapshot per day (IBKR "Open Positions") ───────────────────────
create table if not exists public.pf_positions (
  account_id text not null,
  report_date date not null,
  conid text not null,
  symbol text not null,
  description text,
  asset_category text,
  currency text,
  listing_exchange text,
  quantity numeric not null,
  multiplier numeric default 1,
  mark_price numeric,
  position_value numeric,          -- in the position's own currency
  cost_basis_price numeric,
  cost_basis_money numeric,        -- in the position's own currency
  unrealized_pnl numeric,
  fx_rate_to_base numeric default 1,
  percent_of_nav numeric,
  primary key (account_id, report_date, conid)
);
create index if not exists pf_positions_date_idx on public.pf_positions (report_date desc);

-- ── Trades (IBKR "Trades", execution level) ─────────────────────────────────
create table if not exists public.pf_trades (
  account_id text not null,
  trade_id text not null,
  trade_date date not null,
  date_time timestamptz,
  symbol text not null,
  description text,
  conid text,
  asset_category text,
  currency text,
  buy_sell text,
  quantity numeric not null,
  trade_price numeric,
  proceeds numeric,
  commission numeric,
  net_cash numeric,
  fx_rate_to_base numeric default 1,
  realized_pnl numeric,
  primary key (account_id, trade_id)
);
create index if not exists pf_trades_date_idx on public.pf_trades (trade_date desc);

-- ── Cash movements: deposits, dividends, interest, fees (IBKR "Cash Transactions")
create table if not exists public.pf_cash_transactions (
  account_id text not null,
  transaction_id text not null,
  date date not null,
  date_time timestamptz,
  type text not null,
  symbol text,
  description text,
  currency text,
  amount numeric not null,
  fx_rate_to_base numeric default 1,
  primary key (account_id, transaction_id)
);
create index if not exists pf_cash_date_idx on public.pf_cash_transactions (date desc);

-- ── Sync log ────────────────────────────────────────────────────────────────
create table if not exists public.pf_sync_runs (
  id bigserial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trigger text,                    -- 'cron', 'manual', 'upload'
  status text not null,            -- 'running', 'success', 'error'
  message text,
  report_from date,
  report_to date,
  counts jsonb
);

-- ── Watchlist: remember which market a ticker trades on (for live prices) ──
alter table if exists public.watchlist_items add column if not exists market text;

-- ── Row Level Security: members can read; only the server (service role) writes
alter table public.pf_members enable row level security;
alter table public.pf_settings enable row level security;
alter table public.pf_nav_daily enable row level security;
alter table public.pf_positions enable row level security;
alter table public.pf_trades enable row level security;
alter table public.pf_cash_transactions enable row level security;
alter table public.pf_sync_runs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['pf_settings','pf_nav_daily','pf_positions','pf_trades','pf_cash_transactions','pf_sync_runs','pf_members']
  loop
    execute format('drop policy if exists "members read" on public.%I', t);
    execute format('create policy "members read" on public.%I for select to authenticated using (public.pf_is_member())', t);
  end loop;
end $$;

drop policy if exists "members edit settings" on public.pf_settings;
create policy "members edit settings" on public.pf_settings
  for all to authenticated using (public.pf_is_member()) with check (public.pf_is_member());
