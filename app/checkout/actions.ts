"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { addonsPayload, parseAddons } from "@/lib/addons";
import { EMAIL, UUID } from "@/lib/inquiry";
import { parsePlanKey } from "@/lib/pricing";
import {
  CHECKOUT_MESSAGES as M,
  FIELD_MESSAGES,
  SIGNUP_COOKIE_MAX_AGE,
  SIGNUP_COOKIE_PATH,
  CLIENT_SECRET,
  createdSchema,
  issueFields,
  safeRedirectUrl,
  signupCookie,
  type CheckoutField,
  type CheckoutState,
} from "@/lib/signup";

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const field = (k: string) => String(formData.get(k) ?? "").trim();
  const planKey = parsePlanKey(field("plan"));
  const name = field("name");
  const email = field("email");
  const phone = field("phone");
  const businessName = field("businessName");
  const acceptTerms = formData.get("acceptTerms") === "on";
  const addons = addonsPayload(parseAddons(formData));
  const sentKey = field("idempotencyKey");
  const idempotencyKey = UUID.test(sentKey) ? sentKey : randomUUID();
  // The page asks for embedded Checkout only when the API has a publishable key; otherwise the body stays as before.
  const embedded = field("checkoutMode") === "embedded";

  if (!planKey) return { status: "error", formError: M.planUnavailable, salesLink: true };

  // Mirrors the API's rules so most mistakes never leave the browser's round trip.
  const errors: Partial<Record<CheckoutField, string>> = {};
  if (name.length < 2 || name.length > 120) errors.name = FIELD_MESSAGES.name;
  if (!EMAIL.test(email) || email.length > 254) errors.email = FIELD_MESSAGES.email;
  if (phone.length < 5 || phone.length > 40 || !/\d/.test(phone)) errors.phone = FIELD_MESSAGES.phone;
  if (businessName.length < 2 || businessName.length > 160) errors.businessName = FIELD_MESSAGES.businessName;
  if (!acceptTerms) errors.acceptTerms = FIELD_MESSAGES.acceptTerms;
  if (Object.keys(errors).length) return { status: "error", errors, formError: M.fix };

  const base = process.env.SIDEKICK_API_URL;
  const token = process.env.SIDEKICK_SITE_TOKEN;
  if (!base || !token) return { status: "error", formError: M.notConfigured, salesLink: true };

  const clientIp = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim();

  let res: Response;
  let body: unknown;
  try {
    res = await fetch(`${base.replace(/\/+$/, "")}/v1/public/signups`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "Idempotency-Key": idempotencyKey,
        ...(clientIp ? { "x-sidekick-client-ip": clientIp } : {}),
      },
      body: JSON.stringify({
        planKey,
        name,
        email,
        phone,
        businessName,
        acceptTerms: true,
        ...(addons ? { addons } : {}),
        ...(embedded ? { checkoutMode: "embedded" } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    body = await res.json().catch(() => null);
  } catch {
    // Network error or timeout: keep the key, so retrying replays the same signup instead of creating another.
    return { status: "error", formError: M.failed };
  }

  if (res.status === 201 || res.status === 200) {
    const created = createdSchema.safeParse(body);
    if (!created.success) return { status: "error", formError: M.failed };
    const { signupId, signupToken, clientSecret } = created.data;
    const inPage = embedded && created.data.checkoutMode === "embedded" && typeof clientSecret === "string" && CLIENT_SECRET.test(clientSecret);
    // Hosted fallback: the API chose Stripe's hosted page (or sent no usable secret).
    const checkoutUrl = inPage ? null : safeRedirectUrl(created.data.checkoutUrl);
    if (!inPage && !checkoutUrl) return { status: "error", formError: M.failed };
    (await cookies()).set(signupCookie(signupId), signupToken, {
      httpOnly: true,
      secure: !isLocalHost((await headers()).get("host")),
      sameSite: "lax",
      path: SIGNUP_COOKIE_PATH,
      maxAge: SIGNUP_COOKIE_MAX_AGE,
    });
    if (inPage) return { status: "embedded", signupId, clientSecret: clientSecret! };
    redirect(checkoutUrl!); // 303 for no-JS submits, client navigation otherwise
  }

  const code = (body as { code?: unknown } | null)?.code;
  const nextKey = randomUUID();
  if (res.status === 400 || res.status === 422) {
    const fields = issueFields(body);
    return Object.keys(fields).length ? { status: "error", errors: fields, formError: M.fix, nextKey } : { status: "error", formError: M.failed, nextKey };
  }
  if (res.status === 409 && code === "PLAN_UNAVAILABLE") return { status: "error", formError: M.planUnavailable, salesLink: true, nextKey };
  if (res.status === 409) return { status: "error", formError: M.mismatch, nextKey };
  if (res.status === 429) {
    const retryAfter = Number((body as { retryAfter?: unknown } | null)?.retryAfter ?? res.headers.get("retry-after"));
    return { status: "error", formError: M.rateLimited(Number.isFinite(retryAfter) ? retryAfter : undefined), nextKey };
  }
  if (res.status === 503) return { status: "error", formError: M.notConfigured, salesLink: true };
  if (res.status >= 400 && res.status < 500) return { status: "error", formError: M.failed, nextKey };
  return { status: "error", formError: M.failed };
}

/** Browsers refuse Secure cookies over plain http, which only local test stacks use. */
function isLocalHost(host: string | null) {
  return !!host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}
