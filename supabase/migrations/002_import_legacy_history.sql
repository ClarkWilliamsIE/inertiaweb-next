-- OPTIONAL: keep the chart history from the old dashboard.
--
-- The old Winnerland dashboard stored snapshots in `flex_summary` (built from
-- trades typed in by hand). This copies one value per day into pf_nav_daily as
-- account 'legacy'. The dashboard only uses legacy days that are earlier than
-- the first day of real IBKR data, so overlapping days are ignored.
--
-- Run after 001_winnerland_ibkr.sql. Safe to run again.

insert into public.pf_nav_daily (account_id, report_date, total, source, currency)
select distinct on (d)
  'legacy',
  d,
  (data -> 'totals' ->> 'value')::numeric,
  'legacy',
  'NZD'
from (
  select
    (coalesce((data ->> 'lastUpdated')::timestamptz, last_updated) at time zone 'Pacific/Auckland')::date as d,
    data,
    last_updated
  from public.flex_summary
  where (data -> 'totals' ->> 'value') is not null
    and (data -> 'totals' ->> 'value')::numeric > 0
) s
order by d, last_updated desc
on conflict (account_id, report_date) do update
  set total = excluded.total, updated_at = now();
