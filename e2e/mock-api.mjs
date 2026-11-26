// Minimal stand-in for the SideKick API used by the Playwright tests and local screenshots.
// PRICING_MODE=down → 503 for /v1/public/pricing. Inquiry email "limit@…" → 429, "bad@…" → 422 on email.
// Signups: "limit@…" → 429, "bad@…" → 400 on email, "sold@…" → 409 PLAN_UNAVAILABLE. After the mock "Stripe" page:
// emails starting "existing" → existing_account, "fail" → failed, "expired" → expired, "slow" stays processing, others → ready
// after two processing polls.
import http from "node:http";
import { pricing } from "./fixtures.ts";

const port = Number(process.env.MOCK_API_PORT ?? 4999);
const site = process.env.MOCK_SITE_URL ?? "http://127.0.0.1:3311";
const self = `http://127.0.0.1:${port}`;
export const received = [];
const signups = new Map();

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
      if (url.pathname.startsWith("/__crm/")) return html(200, page(url.pathname.endsWith("sign-in") ? "Mock CRM sign in" : "Mock CRM set password", ""));
      if (url.pathname === "/__received") return send(200, received);
      if (url.pathname === "/__signups") return send(200, [...signups.values()].map(({ token, ...s }) => s));
      send(404, { code: "NOT_FOUND" });
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`mock SideKick API on :${port}`));
