# SideKick CRM public website

Next.js 16 (App Router) + React 19 marketing site. Styling: the site's design tokens in `app/globals.css`, with
Tailwind CSS 4 for new and rewritten UI (pricing, contact, checkout). See "Styling" below.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | Type check (`tsc --noEmit`) |
| `npm test` | Unit tests (Vitest): money formatting, plan parsing, pricing contract, contact action |
| `npm run test:e2e` | Playwright against a production build and `e2e/mock-api.mjs` (a stand-in for the SideKick API) |

First Playwright run: `npx playwright install chromium`.

## Environment variables

Both are **server-only**. Never prefix them with `NEXT_PUBLIC_`; they are read in server components and server
actions and never reach the browser.

| Variable | Used by | Notes |
|---|---|---|
| `SIDEKICK_API_URL` | `/pricing` (`GET /v1/public/pricing`, cached 5 minutes) and `/contact` (`POST /v1/public/inquiries`) | Base URL of the SideKick API, no trailing `/v1`. Example: `https://api.example.com` |
| `SIDEKICK_SITE_TOKEN` | `/contact` | Bearer token the API issues for the public website. Sent as `authorization: Bearer …` |
| `NEXT_PUBLIC_SITE_URL` | metadata | Canonical site URL (unchanged) |

Without `SIDEKICK_API_URL`, or when the API fails or returns an invalid body, the pricing page shows the plans with
no prices and a "Talk to sales" button. It never falls back to hard-coded prices. Without both variables the contact
form answers "Our contact service is not available yet".

`LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_TOKEN` are no longer used and can be removed from Vercel.

## Contact form → SideKick API

`app/contact/actions.ts` validates on the server (plus a honeypot and a minimum fill time), then posts
`{ audience, name, email, business, industry, phone?, message?, planKey?, source: "public-website" }` with
`Idempotency-Key` (one UUID per form render, rotated only after the API rejects the request) and
`x-sidekick-client-ip` (first `x-forwarded-for` hop). API 400/422 field errors, 429 and 503 become friendly
messages (`lib/inquiry.ts`). `?plan=basic|growth|enterprise` preselects the plan; any other value is ignored.

## Styling

- Tailwind runs **without preflight**: the site keeps its own reset. The element reset sits in `@layer base` so
  Tailwind utilities can override it; all other global rules stay unlayered, exactly as before.
- Brand tokens are mapped in `@theme inline` (e.g. `bg-navy`, `text-cobalt`, `text-muted`, `ring-line`,
  `bg-canvas`, `bg-ice`, `rounded-xl`, `shadow-md`, `text-h2`).
- Shared Tailwind class strings for buttons and layout live in `components/marketing/tw.ts`.
- The global `.grid` rule now only applies with a `grid--N` modifier, so Tailwind's `grid` keeps its `gap-*`.
