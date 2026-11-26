"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { ADDON_LIMITS, clampQty } from "@/lib/addons";
import { EMAIL, UUID } from "@/lib/inquiry";
import { parsePlanKey, type PlanKey } from "@/lib/pricing";
import {
  ACCOUNT_COOKIE,
  ACCOUNT_COOKIE_MAX_AGE,
  ACCOUNT_COOKIE_PATH,
  CODE,
  PUBLIC_ID,
  UPGRADE_MESSAGES as M,
  challengeSchema,
  changeSchema,
  previewSchema,
  safeStripeInvoiceUrl,
  verifiedSchema,
  type AccountBusiness,
  type UpgradePreview,
} from "@/lib/upgrade";

type Fail = { ok: false; error: string; expired?: boolean; field?: "email" | "code" };

type Api = { status: number; body: unknown } | null;

/** One call to the SideKick API with the site token, the visitor's IP and, when given, the account token. Null = not reachable. */
async function api(path: string, init: { body?: unknown; key?: string; account?: string; method?: string }): Promise<Api | "unconfigured"> {
  const base = process.env.SIDEKICK_API_URL;
  const token = process.env.SIDEKICK_SITE_TOKEN;
  if (!base || !token) return "unconfigured";
  const clientIp = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim();
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
      method: init.method ?? "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(init.key ? { "Idempotency-Key": init.key } : {}),
        ...(init.account ? { "x-sidekick-account-token": init.account } : {}),
        ...(clientIp ? { "x-sidekick-client-ip": clientIp } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return null;
  }
}

const common = (r: Api | "unconfigured"): Fail => {
  if (r === "unconfigured" || r?.status === 503) return { ok: false, error: M.unavailable };
  if (r?.status === 429) return { ok: false, error: M.rateLimited };
  return { ok: false, error: M.failed };
};

/** Step a: always answers with the same neutral result, whether or not the email has an account. */
export async function requestCode(email: string): Promise<{ ok: true; challengeId: string; expiresAt: string } | Fail> {
  const value = String(email ?? "").trim();
  if (!EMAIL.test(value) || value.length > 254) return { ok: false, error: M.email, field: "email" };
  const r = await api("/v1/public/account-codes", { body: { email: value }, key: randomUUID() });
  if (r && r !== "unconfigured" && (r.status === 202 || r.status === 200)) {
    const parsed = challengeSchema.safeParse(r.body);
    if (parsed.success) return { ok: true, ...parsed.data };
  }
  if (r && r !== "unconfigured" && (r.status === 400 || r.status === 422)) return { ok: false, error: M.email, field: "email" };
  return common(r);
}

/** Step b: on success the account token goes into an httpOnly cookie; the browser only gets the businesses. */
export async function verifyCode(challengeId: string, code: string): Promise<{ ok: true; email: string; businesses: AccountBusiness[] } | Fail> {
  const digits = String(code ?? "").replace(/\D/g, "");
  if (!PUBLIC_ID.test(String(challengeId))) return { ok: false, error: M.expired, expired: true };
  if (!CODE.test(digits)) return { ok: false, error: M.code, field: "code" };
  const r = await api(`/v1/public/account-codes/${encodeURIComponent(challengeId)}/verify`, { body: { code: digits } });
  if (r && r !== "unconfigured" && r.status === 200) {
    const parsed = verifiedSchema.safeParse(r.body);
    if (!parsed.success) return { ok: false, error: M.failed };
    const host = (await headers()).get("host");
    (await cookies()).set(ACCOUNT_COOKIE, parsed.data.accountToken, {
      httpOnly: true,
      secure: !(!!host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)),
      sameSite: "lax",
      path: ACCOUNT_COOKIE_PATH,
      maxAge: ACCOUNT_COOKIE_MAX_AGE,
    });
    return { ok: true, email: parsed.data.email, businesses: parsed.data.businesses };
  }
  if (r && r !== "unconfigured" && (r.status === 400 || r.status === 404 || r.status === 410)) return { ok: false, error: M.codeInvalid, field: "code" };
  return common(r);
}

export type ChangeRequest = { businessId: string; planKey?: PlanKey | null; extraSeats?: number | null; creditPacks?: number | null };

/** Builds the API body from untrusted input: only known plan keys, whole quantities within the limits. Null = invalid. */
function changeBody(req: ChangeRequest) {
  if (!PUBLIC_ID.test(String(req?.businessId))) return null;
  const body: { businessId: string; planKey?: PlanKey; extraSeats?: number; creditPacks?: number } = { businessId: req.businessId };
  if (req.planKey != null) {
    const key = parsePlanKey(req.planKey);
    if (!key) return null;
    body.planKey = key;
  }
  if (req.extraSeats != null) body.extraSeats = clampQty(req.extraSeats, ADDON_LIMITS.extraSeats);
  if (req.creditPacks) body.creditPacks = clampQty(req.creditPacks, ADDON_LIMITS.creditPacks);
  return body.planKey || body.extraSeats !== undefined || body.creditPacks ? body : null;
}

async function accountToken() {
  return (await cookies()).get(ACCOUNT_COOKIE)?.value ?? null;
}

const expired: Fail = { ok: false, error: M.expired, expired: true };

function changeFailure(r: Api | "unconfigured"): Fail {
  if (r && r !== "unconfigured" && (r.status === 401 || r.status === 403)) return expired;
  if (r && r !== "unconfigured" && (r.status === 400 || r.status === 409 || r.status === 422)) return { ok: false, error: M.conflict };
  return common(r);
}

/** Step d: what the change costs now and from the next bill. */
export async function previewUpgrade(req: ChangeRequest): Promise<{ ok: true; preview: UpgradePreview } | Fail> {
  const body = changeBody(req);
  if (!body) return { ok: false, error: M.noChange };
  const account = await accountToken();
  if (!account) return expired;
  const r = await api("/v1/public/upgrades/preview", { body, account });
  if (r && r !== "unconfigured" && r.status === 200) {
    const parsed = previewSchema.safeParse(r.body);
    return parsed.success ? { ok: true, preview: parsed.data } : { ok: false, error: M.failed };
  }
  return changeFailure(r);
}

/** Step e: applies the change; the browser then follows it on /checkout/upgrade/complete. */
export async function confirmUpgrade(req: ChangeRequest, idempotencyKey: string): Promise<{ ok: true; changeId: string } | Fail> {
  const body = changeBody(req);
  if (!body) return { ok: false, error: M.noChange };
  const account = await accountToken();
  if (!account) return expired;
  const r = await api("/v1/public/upgrades", { body, account, key: UUID.test(idempotencyKey) ? idempotencyKey : randomUUID() });
  if (r && r !== "unconfigured" && r.status >= 200 && r.status < 300) {
    const parsed = changeSchema.safeParse(r.body);
    if (!parsed.success) return { ok: false, error: M.failed };
    const { changeId, nextAction } = parsed.data;
    // The status page shows the payment link; refuse here already if it isn't a Stripe invoice.
    if (nextAction && !safeStripeInvoiceUrl(nextAction.url)) return { ok: false, error: M.failed };
    return { ok: true, changeId };
  }
  return changeFailure(r);
}
