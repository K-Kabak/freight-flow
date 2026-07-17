# FreightFlow

FreightFlow is a portfolio-grade transport management dashboard for dispatchers and freight teams. It centralizes shipments, clients, carriers and profitability in one clear operational workspace.

## Current status

FreightFlow is a published, portfolio-ready mini-TMS backed by hosted Supabase and deployed on Vercel. Visitors can create an isolated account, load a deterministic sample workspace and evaluate the complete application without local configuration.

| Area | Status |
| --- | --- |
| Responsive dashboard, tables and charts | Live on Vercel with hosted Supabase |
| Shipment CRUD, server search, filters, sorting and pagination | Production verified |
| Supabase schema, grants and row-level security | Full CRUD matrix and tenant isolation verified locally and hosted |
| Email/password auth, recovery and sign-out | Production verified |
| Shipment create, read, edit, status update and delete | Production verified |
| Client and carrier CRUD, ratings, statistics and related shipments | Production verified |
| Live Dashboard, Analytics and saved FX conversion | Deterministic rounding and currency invariants tested |
| GitHub Actions | Lint, types, unit tests, build, Supabase reset/lint and E2E |
| CSV/PDF export | Planned |

## Tech stack

Next.js 16, TypeScript, Tailwind CSS 4, Supabase/PostgreSQL, Recharts, Zod, Vitest and Playwright.

## Architecture

Next.js App Router renders authenticated views and executes validated server actions. Supabase Auth owns sessions, while PostgreSQL stores profiles, clients, carriers and shipments. Explicit grants, row-level security and database constraints enforce ownership, cross-tenant relationship safety and reporting-currency invariants independently of the UI. Financial reporting uses saved FX snapshots and deterministic server-side TypeScript aggregation appropriate for the portfolio dataset.

## Getting started

```bash
npm ci
cp .env.example .env.local
npx supabase start
npm run dev
```

Open `http://localhost:3000`. Without Supabase environment variables the app starts in a read-only portfolio demo mode with realistic freight data.

## Supabase setup

For local development, install Docker and run `npx supabase start`. Copy the reported API URL and publishable key to `.env.local`; all migrations are applied automatically.

For a hosted project:

1. Create and link a Supabase project with `npx supabase link`.
2. Apply every migration with `npx supabase db push`.
3. Add the project URL and publishable key to `.env.local` and Vercel.
4. Allow local and production `/auth/callback` URLs in Supabase Auth settings.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The authenticated CRUD and RLS suite requires the local Supabase stack:

```powershell
npx supabase db reset
npx supabase db lint --local
$env:SUPABASE_E2E="true"
npm run test:e2e -- --workers=1
```

CI starts only the Supabase services required by Auth, PostgREST and PostgreSQL, resets the database from migrations, lints the schema and runs Playwright serially for repeatability.

## Data security

Every business record is owned by a Supabase Auth user. PostgreSQL row-level security and explicit table grants isolate profiles, clients, carriers and shipments across SELECT, INSERT, UPDATE and DELETE. Cross-user relationships are rejected, profile updates are column-limited, and database triggers preserve reporting-currency and FX snapshot integrity.

## Deployment

Production runs on Vercel with a hosted Supabase project. Vercel stores only the public project URL and publishable client key; privileged Supabase keys are not used by the application. Auth permits the exact production callback plus local development callbacks. GitHub Actions validates linting, types, unit tests, the production build and the complete local-Supabase E2E suite.

## Known dependency limitation

`npm audit` currently reports no high or critical vulnerabilities and two moderate findings in the PostCSS version bundled by the latest stable Next.js 16.2.10. The automated fix would downgrade Next.js to 9.3.3, so it is intentionally not applied; the advisory should be revisited when a safe stable upgrade is available.

The hosted project currently uses Supabase's default email service. Password recovery was verified end to end for the project owner's authorized address, but a custom SMTP provider would be required for dependable delivery to arbitrary public addresses.

## Demo

Live demo: [freight-flow-tau.vercel.app](https://freight-flow-tau.vercel.app).

1. Create an account with any email and a password of at least eight characters.
2. Select **Load sample workspace** on the empty Dashboard.
3. Explore ten realistic shipments, four clients and four carriers across PLN, EUR and USD.

Every account receives a private workspace protected by RLS. Sample data is created atomically for that user only, can be loaded once into an empty workspace and never exposes another visitor's records. No shared demo password is stored in the repository.

## Screenshots

![FreightFlow dashboard](public/screenshots/dashboard.png)

<details>
<summary>More screens</summary>

![Shipment management](public/screenshots/shipments.png)

![Freight analytics](public/screenshots/analytics.png)
</details>

## License

MIT
