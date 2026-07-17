# FreightFlow

FreightFlow is a portfolio-grade transport management dashboard for dispatchers and freight teams. It centralizes shipments, clients, carriers and profitability in one clear operational workspace.

## Current status

FreightFlow now includes a complete locally verified mini-TMS. The deployed portfolio demo remains a read-only sample until a hosted Supabase project is provisioned.

| Area | Status |
| --- | --- |
| Responsive dashboard, tables and charts | Live with Supabase; sample data in public demo |
| Shipment CRUD, server search, filters, sorting and pagination | Working with Supabase configured |
| Supabase schema, grants and row-level security | Implemented and tested locally |
| Email/password auth, recovery and sign-out | Working with Supabase configured |
| Shipment create, read, edit, status update and delete | Working with Supabase configured |
| Client and carrier CRUD, ratings, statistics and related shipments | Working with Supabase configured |
| Live Dashboard, Analytics and saved FX conversion | Working with Supabase configured |
| CSV/PDF export | Planned |

## Tech stack

Next.js 16, TypeScript, Tailwind CSS 4, Supabase/PostgreSQL, Recharts, Zod, Vitest and Playwright.

## Getting started

```bash
npm install
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
$env:SUPABASE_E2E="true"
npm run test:e2e -- --workers=1
```

## Data security

Every business record is owned by a Supabase Auth user. PostgreSQL row-level security isolates profiles, clients, carriers and shipments. Cross-user client/carrier relationships are rejected, while restrictive foreign keys preserve historical shipment integrity.

## Deployment

Deploy to Vercel, configure both public Supabase environment variables, then register the Vercel callback URL in Supabase Auth. GitHub Actions validates linting, types, unit tests and the production build.

## Demo

Read-only demo: [freight-flow-tau.vercel.app](https://freight-flow-tau.vercel.app). The deployed demo intentionally has no Supabase credentials; authenticated persistence is verified locally until a hosted project is provisioned.

## Screenshots

![FreightFlow dashboard](public/screenshots/dashboard.png)

<details>
<summary>More screens</summary>

![Shipment management](public/screenshots/shipments.png)

![Freight analytics](public/screenshots/analytics.png)
</details>

## License

MIT
