# Winnerland setup: IBKR Flex Query → Supabase → dashboard

Winnerland is the members' fund dashboard at `/winnerland`. It no longer uses
trades typed in by hand. Interactive Brokers sends the real numbers every weekday
through a **Flex Query**, and delayed live prices from Yahoo Finance fill in between syncs.

```
IBKR Flex Web Service ──(weekday cron, or "Sync now")──▶ /api/ibkr/sync ──▶ Supabase pf_* tables
                                                                                │
Yahoo Finance (delayed quotes) ─────────────────────────▶ /api/portfolio ◀──────┘ ──▶ dashboard
```

Allow about 20 minutes, once.

---

## 1. Create the Activity Flex Query in IBKR

1. Log in to the IBKR Portal → **Performance & Reports → Flex Queries**.
2. Next to **Activity Flex Query**, click **+** (create).
3. Name it `Winnerland`.
4. Tick these **Sections**. In each one, click **Select All** for the fields (extra fields are ignored):

   | Section | Options to choose |
   |---|---|
   | Account Information | — |
   | Equity Summary in Base | — |
   | Open Positions | **Summary** |
   | Trades | **Execution** |
   | Cash Transactions | Tick every type (Dividends, Withholding Tax, Deposits & Withdrawals, Broker Interest, Fees…) and **Detail** |
   | Change in NAV | — (optional) |

5. **Delivery Configuration**
   - Format: **XML**
   - Period: **Last 365 Calendar Days**
6. **General Configuration**
   - Date format: **yyyyMMdd**
   - Time format: **HHmmss**
   - Date/time separator: **; (semi-colon)**
   - Include canceled trades: **No**
7. Save, then note the **Query ID** shown in the list. That's `IBKR_FLEX_QUERY_ID`.

## 2. Turn on the Flex Web Service and get a token

1. IBKR Portal → **Performance & Reports → Flex Queries** → the gear / **Flex Web Service Configuration**.
2. Enable it and **Generate a new token**. Choose the longest expiry (1 year) and **no IP restriction**,
   because Vercel's servers don't have fixed IPs.
3. Copy the token. That's `IBKR_FLEX_TOKEN`.
4. Put a reminder in your calendar a week before the token expires. When it does, the Admin page shows
   "Token has expired" and you generate a new one.

## 3. Create the tables in Supabase

1. Supabase → your project → **SQL Editor** → **New query**.
2. Paste in `supabase/migrations/001_winnerland_ibkr.sql` and **Run**.
3. Optional: to keep the chart history from the old dashboard, run
   `supabase/migrations/002_import_legacy_history.sql` too.

Your existing watchlist, polls and competition tables are kept as they are (001 adds one column, `market`, to `watchlist_items`).

**Optional, recommended: limit who can see the fund.** Add each member's login email to the
`pf_members` table (Table Editor → pf_members → Insert row). While that table is empty, anyone who
can sign in can see the fund, which is how the old dashboard worked. Also consider turning
off public sign-ups: Supabase → Authentication → Providers → Email → "Allow new users to sign up".

## 4. Add the environment variables in Vercel

Vercel → your project → **Settings → Environment Variables** (Production and Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://acdlgvcxzxjvcwiqlydj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (Supabase → Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (same page). **Secret.** |
| `IBKR_FLEX_TOKEN` | from step 2 |
| `IBKR_FLEX_QUERY_ID` | from step 1 |
| `CRON_SECRET` | any long random string (e.g. from a password generator) |
| `WINNERLAND_ADMIN_EMAILS` | optional: `you@example.com` limits Sync/Import to you |

Then redeploy.

## 5. First sync and history

1. Sign in at `/winnerland`, open **Admin**, and click **Sync now**. It takes 10–40 seconds.
2. That loads the last 365 days. For older history, in IBKR run the Flex Query for an earlier
   period (Run → Custom Date Range, up to a year at a time), download the **XML**, and use
   **Import a Flex XML file** on the Admin page. Repeat for each year.
3. In **Fund settings**, check the number of members (used by "My share") and, if your IBKR
   records don't go back to the very first deposit, enter the money put in before that.

## 6. The schedule

`vercel.json` runs the sync at **01:30 UTC, Tuesday–Saturday**, which is about 2:30pm NZ
time after each US trading day once IBKR has prepared its statements. Vercel calls
`/api/ibkr/sync` with your `CRON_SECRET`. You can see each run on the Admin page.

## 7. Retire the old pieces

Once the new dashboard shows the right numbers:

- In Supabase → Edge Functions, delete or unschedule **update-prices**. The new dashboard doesn't use it.
- The `trades` and `flex_summary` tables aren't used any more. Keep them as a backup, or drop them later.
- The old Google Apps Script (watchlist prices) is no longer called.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| "IBKR Flex error 1015 / 1012" | Token invalid or expired. Generate a new token (step 2) and update `IBKR_FLEX_TOKEN`. |
| "IBKR Flex error 1014" | Wrong Query ID. Check `IBKR_FLEX_QUERY_ID`. |
| "IBKR Flex error 1013" | The token has an IP restriction. Remove it. |
| "still generating the statement" | IBKR was slow. Click Sync now again a minute later. |
| "The Winnerland database tables are missing" | Run `001_winnerland_ibkr.sql` (step 3). |
| "Your account isn't on the Winnerland members list" | Add that email to `pf_members`, or empty the table. |
| Live prices missing for one holding | Yahoo uses a different ticker. Add a mapping in `src/lib/market/symbols.ts` (`EXCHANGE_SUFFIX`). |
| "Money put in" looks too low | Deposits older than your imported IBKR data are missing. Import older statements or set "Money put in before the IBKR records start". |

## How the numbers are worked out

- **Fund value**: IBKR's daily *Equity Summary in Base* (everything converted to NZD). During market
  hours it's the IBKR holdings priced at the latest delayed quote, converted at the latest FX rate, plus cash.
- **Money put in**: all *Deposits & Withdrawals* cash transactions, plus the Admin setting for older ones.
- **Ahead / behind**: fund value minus money put in. That's what decides **Winnerland** vs **Loserland**.
- **Gain** on a holding: value minus IBKR's cost basis (FIFO).
- **Change over a range**: end value minus start value minus deposits made during the range.
- **My share**: every money figure divided by the number of members.
