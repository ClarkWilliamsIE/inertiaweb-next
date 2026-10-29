# Inertia Education website

The public site for Inertia Education (a not-for-profit mobile innovation lab in Aotearoa), plus
**Winnerland**, the private members' fund dashboard at `/winnerland`.

Built with Next.js 15 (App Router), React 19, Tailwind CSS and TypeScript, and deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values (see docs/winnerland-setup.md)
npm run dev                  # http://localhost:3000
```

`npm run build` does a production build, and `npm run typecheck` checks types.

## Project layout

```
src/
  app/
    page.tsx                 Homepage (composes the sections below)
    layout.tsx, globals.css  Site-wide shell, fonts and Tailwind
    api/
      ibkr/sync/             Pulls the IBKR Flex Query (Vercel Cron + "Sync now")
      ibkr/import/           Imports an uploaded Flex XML file (history backfill)
      portfolio/             Fund summary + live prices for the dashboard
      portfolio/holding/     One holding's price history and our trades
      market/quotes/         Delayed quotes for typed-in tickers (competition)
      market/performance/    "Since added" performance (watchlist)
    winnerland/
      layout.tsx             Dashboard fonts + stylesheet (winnerland.css)
      login/                 Sign in / create account
      (members)/             Pages behind the login: Fund, Watchlist,
                             Competition, Polls, Admin
  components/
    site/                    Homepage sections (Hero, Vision, Impact, Projects, Team, Budget, Partner, Footer)
    winnerland/              Dashboard UI (fund/, watchlist/, polls/, competition/, admin/, charts/)
  content/site.ts            Homepage copy: projects, team, budget
  lib/
    ibkr/                    Flex Web Service client, XML parser, database writer
    market/                  Yahoo Finance quotes and ticker mapping
    supabase/                Browser and server Supabase clients, member auth check
    winnerland/              Portfolio maths, shared types, formatting
public/
  images/  favicon/  fonts/  svg/
  docs/makertruck-proposal.pdf
  library/                   Library display screens (events, legacy events, dashboard)
supabase/migrations/         SQL to run once in Supabase
docs/winnerland-setup.md     IBKR Flex Query + Supabase + Vercel setup guide
scripts/fixtures/            Sample Flex statement used for testing the parser
```

Old URLs (`/winnerland.html`, `/school-portal-demo/*`, `/levents.html`, `/librarydash.html`,
`/Makertruck Proposal.pdf`) redirect to their new homes. See `next.config.js`.

## Winnerland

See **[docs/winnerland-setup.md](docs/winnerland-setup.md)** for the one-off setup: the IBKR Flex
Query, Supabase tables, environment variables and the daily sync schedule.
