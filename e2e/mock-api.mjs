// Minimal stand-in for the SideKick API used by the Playwright tests and local screenshots.
// PRICING_MODE=down → 503 for /v1/public/pricing. Inquiry email "limit@…" → 429, "bad@…" → 422 on email.
// Signups: "limit@…" → 429, "bad@…" → 400 on email, "sold@…" → 409 PLAN_UNAVAILABLE. After the mock "Stripe" page:
// emails starting "existing" → existing_account, "fail" → failed, "expired" → expired, "slow" stays processing, others → ready
// after two processing polls.
// Upgrades: any email gets a 202 challenge ("limit@" → 429); code 123456 verifies, 999999 → 429, anything else → 400 CODE_INVALID.
// Emails starting "multi" own two businesses, "nobiz" none, "sca" needs a bank check (requires_action → mock invoice page),
// "decline" fails; others own one Basic business. A lower plan is scheduled for the renewal with an over-limit warning.
import http from "node:http";
import { pricing } from "./fixtures.ts";

const port = Number(process.env.MOCK_API_PORT ?? 4999);
const site = process.env.MOCK_SITE_URL ?? "http://127.0.0.1:3311";
const self = `http://127.0.0.1:${port}`;
export const received = [];
const signups = new Map();
const challenges = new Map();
const accounts = new Map();
const changes = new Map();
const upgradeCalls = [];
const RENEWAL = "2026-12-15T12:00:00.000Z";
const rank = (k) => ["basic", "growth", "enterprise"].indexOf(k);
const planOf = (k) => pricing.plans.find((p) => p.key === k);
const biz = (businessId, name, planKey, extraSeats) => ({ businessId, name, planKey, planName: planOf(planKey).name, extraSeats, status: "active" });
function businessesFor(email) {
  if (email.startsWith("nobiz")) return [];
  if (email.startsWith("multi")) return [biz("biz_1", "Brightside Washing", "basic", 0), biz("biz_2", "Clearview Towing", "enterprise", 2)];
  if (email.startsWith("sca")) return [biz("biz_3", "Harbor Painting", "basic", 0)];
  return [biz("biz_1", "Brightside Washing", "basic", 1)];
}
function quote(b, data) {
  const cur = planOf(b.planKey);
  const tgt = planOf(data.planKey ?? b.planKey);
  const seats = data.extraSeats ?? b.extraSeats;
  const packs = data.creditPacks ?? 0;
  const later = rank(tgt.key) < rank(cur.key);
  const lines = [];
  if (tgt.key !== cur.key) lines.push(later ? { label: `${tgt.name} plan from your renewal`, amountMinor: 0 } : { label: `${tgt.name} plan, rest of this cycle`, amountMinor: Math.round((tgt.priceMinor - cur.priceMinor) / 2) });
  if (seats > b.extraSeats) lines.push({ label: `${seats - b.extraSeats} extra team ${seats - b.extraSeats === 1 ? "member" : "members"}, rest of this cycle`, amountMinor: (seats - b.extraSeats) * 500 });
  if (packs) lines.push({ label: `${packs} AI credit ${packs === 1 ? "pack" : "packs"}`, amountMinor: packs * 1000 });
  const warnings = later ? [{ code: "OVER_LIMIT", message: `${tgt.name} includes ${tgt.teamMembers} team members. Remove extra people before your renewal or they are billed as extra members.` }] : [];
  return {
    lines,
    dueNowMinor: lines.reduce((s, l) => s + l.amountMinor, 0),
    newMonthlyMinor: tgt.priceMinor + seats * 1000,
    currency: "usd",
    effective: later ? "next_renewal" : "now",
    renewalAt: RENEWAL,
    warnings,
    paymentMethod: { brand: "visa", last4: "4242" },
  };
}
function changeStatus(c) {
  if (c.scheduled) return { status: "scheduled", nextAction: null };
  if (c.email.startsWith("sca") && !c.paid) return { status: "requires_action", nextAction: { kind: "pay", url: `${self}/__invoice/${c.id}` } };
  if (c.email.startsWith("decline")) return c.polls++ < 1 ? { status: "processing", nextAction: null } : { status: "failed", nextAction: null };
  if (!c.paid && c.polls++ < 1) return { status: "processing", nextAction: null };
  return { status: "paid", nextAction: null };
}

const page = (title, body) =>
  `<!doctype html><meta name=viewport content="width=device-width"><title>${title}</title>` +
  `<body style="font-family:system-ui;max-width:480px;margin:64px auto;padding:0 20px"><h1>${title}</h1>${body}</body>`;

function status(s) {
  const email = s.data.email;
  if (!s.paid) return { status: "pending_payment", next: { kind: "wait" } };
  if (email.startsWith("existing")) return { status: "existing_account", next: { kind: "sign_in", url: `${self}/__crm/sign-in` } };
  if (email.startsWith("fail")) return { status: "failed", next: { kind: "retry", url: `${site}/checkout?plan=${s.data.planKey}` } };
  if (email.startsWith("expired")) return { status: "expired", next: { kind: "retry", url: `${site}/checkout?plan=${s.data.planKey}` } };
  if (email.startsWith("slow") || s.polls++ < 2) return { status: "processing", next: { kind: "wait" } };
  return { status: "ready", next: { kind: "set_password", url: `${self}/__crm/set-password?t=mock` } };
}

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const send = (code, json) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
      const html = (code, markup) => { res.writeHead(code, { "content-type": "text/html" }); res.end(markup); };
      const url = new URL(req.url, self);
      if (req.method === "GET" && url.pathname === "/v1/public/pricing") {
        return process.env.PRICING_MODE === "down" ? send(503, { code: "UNAVAILABLE" }) : send(200, pricing);
      }
      if (req.method === "POST" && url.pathname === "/v1/public/inquiries") {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const data = JSON.parse(body || "{}");
        if (String(data.email).startsWith("limit@")) return send(429, { code: "RATE_LIMITED" });
        if (String(data.email).startsWith("bad@")) return send(422, { code: "VALIDATION_FAILED", issues: [{ path: ["email"], message: "Invalid email" }] });
        received.push({ headers: req.headers, data });
        return send(201, { id: "inq_1" });
      }
      if (req.method === "POST" && url.pathname === "/v1/public/signups") {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const data = JSON.parse(body || "{}");
        const email = String(data.email);
        if (email.startsWith("limit@")) return send(429, { code: "RATE_LIMITED", retryAfter: 120 });
        if (email.startsWith("bad@")) return send(400, { code: "VALIDATION_FAILED", issues: [{ path: ["email"], message: "Invalid email" }] });
        if (email.startsWith("sold@")) return send(409, { code: "PLAN_UNAVAILABLE" });
        const key = req.headers["idempotency-key"];
        const prior = [...signups.values()].find((s) => s.key === key);
        if (prior && JSON.stringify(prior.data) !== JSON.stringify(data)) return send(409, { code: "IDEMPOTENCY_MISMATCH" });
        const s = prior ?? { id: `su_${signups.size + 1}`, key, data, token: `tok_${Math.random().toString(36).slice(2)}`, paid: false, polls: 0, headers: req.headers };
        signups.set(s.id, s);
        return send(201, { signupId: s.id, checkoutUrl: `${self}/__stripe/${s.id}`, signupToken: s.token, expiresAt: new Date(Date.now() + 864e5).toISOString() });
      }
      const statusMatch = url.pathname.match(/^\/v1\/public\/signups\/([\w-]+)$/);
      if (req.method === "GET" && statusMatch) {
        const s = signups.get(statusMatch[1]);
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        if (!s || req.headers["x-sidekick-signup-token"] !== s.token) return send(404, { code: "SIGNUP_NOT_FOUND" });
        return send(200, { signupId: s.id, planKey: s.data.planKey, ...status(s) });
      }
      if (req.method === "POST" && url.pathname === "/v1/public/account-codes") {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const email = String(JSON.parse(body || "{}").email ?? "");
        upgradeCalls.push({ path: url.pathname, headers: req.headers, data: { email } });
        if (email.startsWith("limit@")) return send(429, { code: "RATE_LIMITED" });
        const challengeId = `ch_${challenges.size + 1}`;
        challenges.set(challengeId, { email });
        return send(202, { challengeId, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() });
      }
      const verify = url.pathname.match(/^\/v1\/public\/account-codes\/([\w-]+)\/verify$/);
      if (req.method === "POST" && verify) {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const ch = challenges.get(verify[1]);
        const code = String(JSON.parse(body || "{}").code ?? "");
        if (code === "999999") return send(429, { code: "RATE_LIMITED" });
        if (!ch || code !== "123456") return send(400, { code: "CODE_INVALID" });
        const accountToken = `acct_${Math.random().toString(36).slice(2)}`;
        accounts.set(accountToken, { email: ch.email, businesses: businessesFor(ch.email) });
        return send(200, { accountToken, email: ch.email, businesses: accounts.get(accountToken).businesses });
      }
      if (req.method === "POST" && (url.pathname === "/v1/public/upgrades/preview" || url.pathname === "/v1/public/upgrades")) {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const acct = accounts.get(req.headers["x-sidekick-account-token"]);
        if (!acct) return send(401, { code: "ACCOUNT_TOKEN_INVALID" });
        const data = JSON.parse(body || "{}");
        upgradeCalls.push({ path: url.pathname, headers: req.headers, data, email: acct.email });
        const b = acct.businesses.find((x) => x.businessId === data.businessId);
        if (!b) return send(404, { code: "BUSINESS_NOT_FOUND" });
        const q = quote(b, data);
        if (url.pathname.endsWith("/preview")) return send(200, q);
        const key = req.headers["idempotency-key"];
        const c = [...changes.values()].find((x) => x.key === key) ?? { id: `chg_${changes.size + 1}`, key, email: acct.email, token: req.headers["x-sidekick-account-token"], scheduled: q.effective === "next_renewal", paid: false, polls: 0 };
        changes.set(c.id, c);
        const first = changeStatus({ ...c, polls: 0 });
        return send(201, { changeId: c.id, ...first });
      }
      const changeMatch = url.pathname.match(/^\/v1\/public\/upgrades\/([\w-]+)$/);
      if (req.method === "GET" && changeMatch) {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const c = changes.get(changeMatch[1]);
        if (!c || req.headers["x-sidekick-account-token"] !== c.token) return send(404, { code: "CHANGE_NOT_FOUND" });
        return send(200, { changeId: c.id, ...changeStatus(c), crmUrl: `${self}/__crm/billing`, renewalAt: RENEWAL });
      }
      // Mock Stripe hosted invoice (bank check): pay marks the change paid.
      const invoice = url.pathname.match(/^\/__invoice\/([\w-]+)(\/pay)?$/);
      if (invoice && changes.has(invoice[1])) {
        const c = changes.get(invoice[1]);
        if (invoice[2]) {
          c.paid = true;
          return html(200, page("Mock invoice paid", "<p>You can close this tab.</p>"));
        }
        return html(200, page("Mock Stripe invoice", `<p><a href="/__invoice/${c.id}/pay">Pay invoice</a></p>`));
      }
      // Mock "Stripe Checkout": pay → success URL, cancel → cancel URL.
      const stripe = url.pathname.match(/^\/__stripe\/([\w-]+)(\/pay)?$/);
      if (stripe && signups.has(stripe[1])) {
        const s = signups.get(stripe[1]);
        if (stripe[2]) {
          s.paid = true;
          res.writeHead(303, { location: `${site}/checkout/complete?signup=${s.id}` });
          return res.end();
        }
        return html(200, page("Mock Stripe Checkout", `<p>${s.data.planKey} plan for ${s.data.email}</p><p><a href="/__stripe/${s.id}/pay">Pay</a></p><p><a href="${site}/checkout?plan=${s.data.planKey}&cancelled=1">Cancel</a></p>`));
      }
      if (url.pathname.startsWith("/__crm/")) return html(200, page(url.pathname.endsWith("sign-in") ? "Mock CRM sign in" : url.pathname.endsWith("billing") ? "Mock CRM billing" : "Mock CRM set password", ""));
      if (url.pathname === "/__upgrades") return send(200, upgradeCalls);
      if (url.pathname === "/__received") return send(200, received);
      if (url.pathname === "/__signups") return send(200, [...signups.values()].map(({ token, ...s }) => s));
      send(404, { code: "NOT_FOUND" });
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`mock SideKick API on :${port}`));
