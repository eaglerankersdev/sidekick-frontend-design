# SideKick CRM public website

Next.js 16 (App Router) + React 19 marketing site. Styling: the site's design tokens in `app/globals.css`, with
Tailwind CSS 4 for new and rewritten UI (pricing, contact, checkout). See "Styling" below.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | Type check (`tsc --noEmit`) |
| `npm test` | Unit tests (Vitest): money formatting, plan parsing, pricing contract, contact action, checkout action and add-ons, order summary math, upgrade code actions, status routes, redirect and Stripe-invoice URL safety |
| `npm run test:e2e` | Playwright against a production build and `e2e/mock-api.mjs` (a stand-in for the SideKick API) |

First Playwright run: `npx playwright install chromium`.

## Environment variables

Both are **server-only**. Never prefix them with `NEXT_PUBLIC_`; they are read in server components and server
actions and never reach the browser.

| Variable | Used by | Notes |
|---|---|---|
| `SIDEKICK_API_URL` | `/pricing` and `/checkout` (`GET /v1/public/pricing`, cached 5 minutes), `/contact` (`POST /v1/public/inquiries`), `/checkout` (`POST /v1/public/signups`, `GET /v1/public/signups/:id`) | Base URL of the SideKick API, no trailing `/v1`. Example: `https://api.example.com` |
| `SIDEKICK_SITE_TOKEN` | `/contact`, `/checkout` | Bearer token the API issues for the public website. Sent as `authorization: Bearer …` |
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

## Checkout (pay first) → SideKick API → Stripe

1. Pricing "Get started" → `/checkout?plan=basic|growth|enterprise` (any other plan redirects to `/pricing`). The plan
   name, price and allowances come from `GET /v1/public/pricing`; a plan that is missing, unavailable or unpriced (or
   pricing that is down) shows "Talk to sales" instead of the form.
2. `app/checkout/actions.ts` validates on the server, then posts `{ planKey, name, email, phone, businessName,
   acceptTerms: true }` to `POST /v1/public/signups` with the site token, an `Idempotency-Key` (one UUID per form
   render, rotated after a 4xx) and `x-sidekick-client-ip`. On 201 it stores `signupToken` in an httpOnly, Secure,
   SameSite=Lax cookie `sk_signup_<signupId>` (path `/checkout`, 2 days) and redirects (303 without JS) to the
   returned Stripe `checkoutUrl`. 400 issues map to fields; 409/429/503 become friendly messages.
3. Stripe returns to `/checkout/complete?signup=<id>` (cancel: `/checkout?plan=…&cancelled=1`). The page polls
   `app/checkout/complete/status/route.ts`, which reads the cookie server-side and calls
   `GET /v1/public/signups/:id` with `x-sidekick-signup-token`. The browser never sees the token.
4. `ready` → auto-forward to the API's set-password URL (button fallback) and the cookie is cleared;
   `existing_account` → sign-in button; `failed`/`expired` → retry `/checkout?plan=…`; no answer after ~2 minutes →
   "we'll also email you a link". Redirect targets must be https (http only on localhost when the API itself is local)
   and come from the API (`lib/signup.ts`, `safeRedirectUrl`).

The return URL never activates anything: the account exists only after the backend sees Stripe's webhook.

### Add-ons on checkout

The checkout offers extra team members (0–50, monthly), AI credit packs (0–20, one-time) and a CallRail toggle (free here,
billed by CallRail; logo `public/brands/callrail.svg` is CallRail's own logotype from callrail.com). Prices come from
`GET /v1/public/pricing` → `addons.extraMember` / `addons.creditPack` (fallback: each plan's `extraMemberMinor` and `topUp`;
`null` = not sold). The order summary (`lib/addons.ts`, `orderTotals`) shows "Due today" (plan + seats + packs) and
"Then $X per month" (plan + seats). When anything is added, the signup body also carries
`addons: { extraSeats, creditPacks, callRail }`; with nothing added the body is exactly the Phase B one.

## Existing customer upgrade (email code, no account enumeration)

`/checkout/upgrade?plan=basic|growth|enterprise` (linked from pricing and checkout):

1. Email → `POST /v1/public/account-codes { email }` (site token, `Idempotency-Key`, `x-sidekick-client-ip`). The page
   always says "If this email has a SideKick account, we sent a 6-digit code".
2. Code (one-time-code autofill, paste, new code after 30 s) → `POST /v1/public/account-codes/:challengeId/verify { code }`.
   The `accountToken` goes only into the httpOnly, Secure, SameSite=Lax cookie `sk_account` (path `/checkout`, 30 minutes).
3. Pick the business (when there are several), the plan and add-ons. Seats are the new total of extra members. Every
   change is priced by `POST /v1/public/upgrades/preview` (header `x-sidekick-account-token`), shown with the API's lines,
   "Charged now", the card and any warnings; a lower plan shows "Nothing is charged now" and the renewal date.
4. Confirm → `POST /v1/public/upgrades` (one `Idempotency-Key` per exact change) → `/checkout/upgrade/complete?change=…`,
   which polls `GET /v1/public/upgrades/:changeId` through `app/checkout/upgrade/complete/status/route.ts`.
   `requires_action` shows a button to the Stripe invoice page (only `https://invoice.stripe.com`, opened in a new tab
   while this tab keeps polling); `paid` → "Upgrade complete" with the CRM link (`crmUrl`, https only) and the cookie is
   cleared; `scheduled` → the renewal date; `failed` → try again. A 401/403 sends the visitor back to the email step.

All responses are validated with zod (`lib/upgrade.ts`); the token never reaches browser JavaScript.

## Styling

- Tailwind runs **without preflight**: the site keeps its own reset. The element reset sits in `@layer base` so
  Tailwind utilities can override it; all other global rules stay unlayered, exactly as before.
- Brand tokens are mapped in `@theme inline` (e.g. `bg-navy`, `text-cobalt`, `text-muted`, `ring-line`,
  `bg-canvas`, `bg-ice`, `rounded-xl`, `shadow-md`, `text-h2`).
- Shared Tailwind class strings for buttons and layout live in `components/marketing/tw.ts`.
- The global `.grid` rule now only applies with a `grid--N` modifier, so Tailwind's `grid` keeps its `gap-*`.
