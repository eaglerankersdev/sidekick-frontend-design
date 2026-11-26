import { z } from "zod";
import { PLAN_KEYS } from "./pricing";

/** Signup ids become part of a cookie name and a URL, so only plain id characters are accepted. */
export const SIGNUP_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const signupCookie = (signupId: string) => `sk_signup_${signupId}`;
export const SIGNUP_COOKIE_PATH = "/checkout";
export const SIGNUP_COOKIE_MAX_AGE = 2 * 24 * 60 * 60;

/** Only local test stacks (dev server, or an API on localhost) may send http:// redirect targets. */
function allowLocalHttp() {
  const api = process.env.SIDEKICK_API_URL ?? "";
  return process.env.NODE_ENV === "development" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(api);
}

/** A URL from the API is followed only when it is https (or http on localhost in a local stack) and has no credentials. */
export function safeRedirectUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === "https:") return url.href;
  if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1") && allowLocalHttp()) return url.href;
  return null;
}

/** POST /v1/public/signups → 201. `checkoutMode: "embedded"` answers carry a Stripe client secret instead of a URL. */
export const createdSchema = z.object({
  signupId: z.string().regex(SIGNUP_ID),
  checkoutUrl: z.string().min(1).nullish(),
  signupToken: z.string().min(1).max(512),
  expiresAt: z.string().min(1),
  checkoutMode: z.enum(["embedded", "hosted"]).optional(),
  clientSecret: z.string().nullish(),
});

/** A Checkout Session client secret (`cs_…_secret_…`): made for the browser, unlike the signup token. */
export const CLIENT_SECRET = /^cs_[A-Za-z0-9_]{1,500}$/;

const next = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("wait") }),
  z.object({ kind: z.literal("set_password"), url: z.string() }),
  z.object({ kind: z.literal("sign_in"), url: z.string() }),
  z.object({ kind: z.literal("retry"), url: z.string() }),
]);

export const SIGNUP_STATUSES = ["pending_payment", "processing", "ready", "existing_account", "failed", "expired"] as const;

/** GET /v1/public/signups/:signupId. */
export const statusSchema = z.object({
  signupId: z.string(),
  planKey: z.enum(PLAN_KEYS),
  status: z.enum(SIGNUP_STATUSES),
  next,
});

export type SignupStatus = z.infer<typeof statusSchema>;

/** What the status route hands the browser: the token never leaves the server, URLs are already checked. */
export type StatusView =
  | { state: "wait"; status: "pending_payment" | "processing" }
  | { state: "set_password"; url: string }
  | { state: "sign_in"; url: string }
  | { state: "retry"; status: "failed" | "expired"; planKey: SignupStatus["planKey"] }
  | { state: "not_found" }
  | { state: "error" };

/** Maps a validated API status to the browser view; any mismatch or unsafe URL is an error, never a redirect. */
export function toView(s: SignupStatus): StatusView {
  const n = s.next;
  if (n.kind === "wait" && (s.status === "pending_payment" || s.status === "processing")) return { state: "wait", status: s.status };
  if (n.kind === "retry" && (s.status === "failed" || s.status === "expired")) return { state: "retry", status: s.status, planKey: s.planKey };
  if (n.kind === "set_password" && s.status === "ready") {
    const url = safeRedirectUrl(n.url);
    return url ? { state: "set_password", url } : { state: "error" };
  }
  if (n.kind === "sign_in" && s.status === "existing_account") {
    const url = safeRedirectUrl(n.url);
    return url ? { state: "sign_in", url } : { state: "error" };
  }
  return { state: "error" };
}

export type CheckoutField = "name" | "email" | "phone" | "businessName" | "acceptTerms";

export type CheckoutState =
  | { status: "idle" }
  /** Embedded Stripe Checkout: the browser mounts Stripe's form with this client secret (the signup token stays in the cookie). */
  | { status: "embedded"; signupId: string; clientSecret: string }
  /** `nextKey`: a fresh Idempotency-Key after the API rejected the request (4xx), so the corrected retry is a new signup. */
  | { status: "error"; formError?: string; errors?: Partial<Record<CheckoutField, string>>; nextKey?: string; salesLink?: boolean };

export const FIELD_MESSAGES: Record<CheckoutField, string> = {
  name: "Please enter your full name.",
  email: "Please enter a valid work email.",
  phone: "Please enter a phone number we can reach you on.",
  businessName: "Please enter your business name.",
  acceptTerms: "Please agree to the Terms and Privacy Policy to continue.",
};

export const CHECKOUT_MESSAGES = {
  fix: "Please fix the highlighted fields.",
  planUnavailable: "This plan can't be bought online right now. Our sales team can set it up for you.",
  notConfigured: "Online checkout isn't available right now. Our sales team can set up your account.",
  mismatch: "Your details changed since your last attempt. Please check them and continue again.",
  failed: "We couldn't start checkout right now. Please try again in a moment.",
  rateLimited: (retryAfter?: number) => {
    const minutes = retryAfter && retryAfter > 0 ? Math.ceil(retryAfter / 60) : 0;
    return minutes
      ? `Too many attempts in a short time. Please wait ${minutes === 1 ? "a minute" : `${minutes} minutes`} and try again.`
      : "Too many attempts in a short time. Please wait a few minutes and try again.";
  },
};

/** Turns API `issues: [{ path, message }]` into our field messages; unknown paths are ignored. */
export function issueFields(body: unknown): Partial<Record<CheckoutField, string>> {
  const out: Partial<Record<CheckoutField, string>> = {};
  const issues = (body as { issues?: unknown } | null)?.issues;
  if (!Array.isArray(issues)) return out;
  for (const issue of issues) {
    const raw = (issue as { path?: unknown })?.path;
    const f = Array.isArray(raw) ? raw[0] : typeof raw === "string" ? raw.split(".")[0] : undefined;
    if (typeof f === "string" && Object.hasOwn(FIELD_MESSAGES, f)) out[f as CheckoutField] = FIELD_MESSAGES[f as CheckoutField];
  }
  return out;
}
