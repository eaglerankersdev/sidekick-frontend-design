import { z } from "zod";
import { safeRedirectUrl } from "./signup";

/**
 * Existing-customer upgrade on the public site (SA03 Phase C). The account token from the email-code check lives only in
 * an httpOnly cookie on /checkout; the browser sees businesses and prices, never the token.
 */
export const ACCOUNT_COOKIE = "sk_account";
export const ACCOUNT_COOKIE_PATH = "/checkout";
export const ACCOUNT_COOKIE_MAX_AGE = 30 * 60;

/** Ids become part of a URL, so only plain id characters are accepted. */
export const PUBLIC_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const CODE = /^\d{6}$/;
/** The code input becomes available again after this many seconds. */
export const RESEND_AFTER_S = 30;

/** POST /v1/public/account-codes → 202 (always, whether or not the email has an account). */
export const challengeSchema = z.object({ challengeId: z.string().regex(PUBLIC_ID), expiresAt: z.string().min(1) });

export const businessSchema = z.object({
  businessId: z.string().regex(PUBLIC_ID),
  name: z.string().min(1).max(200),
  // A retired or custom plan may not be one of the public keys; the page then shows no side-by-side comparison.
  planKey: z.string().nullable(),
  planName: z.string().nullable(),
  extraSeats: z.number().int().nonnegative(),
  status: z.string(),
});
export type AccountBusiness = z.infer<typeof businessSchema>;

/** POST /v1/public/account-codes/:challengeId/verify → 200. */
export const verifiedSchema = z.object({
  accountToken: z.string().min(1).max(1024),
  email: z.string().min(1),
  businesses: z.array(businessSchema),
});

const minor = z.number().int();

/** POST /v1/public/upgrades/preview → 200. */
export const previewSchema = z.object({
  lines: z.array(z.object({ label: z.string().min(1), amountMinor: minor })),
  dueNowMinor: minor.nonnegative(),
  newMonthlyMinor: minor.nonnegative(),
  currency: z.string().regex(/^[a-z]{3}$/i),
  effective: z.enum(["now", "next_renewal"]),
  renewalAt: z.string().nullable(),
  warnings: z.array(z.object({ code: z.string(), message: z.string().min(1).max(500) })),
  paymentMethod: z.object({ brand: z.string(), last4: z.string().regex(/^\d{4}$/) }).nullable(),
});
export type UpgradePreview = z.infer<typeof previewSchema>;

export const CHANGE_STATUSES = ["processing", "requires_action", "paid", "scheduled", "failed"] as const;
const nextAction = z.object({ kind: z.literal("pay"), url: z.string() }).nullable();

/** POST /v1/public/upgrades → 200/201/202. */
export const changeSchema = z.object({ changeId: z.string().regex(PUBLIC_ID), status: z.enum(CHANGE_STATUSES), nextAction });

/** GET /v1/public/upgrades/:changeId → 200. `crmUrl` and `renewalAt` are optional until the API sends them. */
export const changeStatusSchema = changeSchema.extend({
  crmUrl: z.string().nullable().optional(),
  renewalAt: z.string().nullable().optional(),
});

/** Only local test stacks may use http (same rule as signups). */
function allowLocalHttp() {
  const api = process.env.SIDEKICK_API_URL ?? "";
  return process.env.NODE_ENV === "development" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(api);
}

/** A payment link is followed only when it is an https Stripe invoice page (or the local mock in a local stack). */
export function safeStripeInvoiceUrl(value: unknown): string | null {
  const href = safeRedirectUrl(value);
  if (!href) return null;
  const url = new URL(href);
  if (url.protocol === "https:" && url.hostname === "invoice.stripe.com" && !url.port) return href;
  if (url.protocol === "http:" && allowLocalHttp()) return href;
  return null;
}

/** What the status route hands the browser: URLs already checked, no token. */
export type ChangeView =
  | { state: "wait" }
  | { state: "pay"; url: string }
  | { state: "paid"; crmUrl: string | null }
  | { state: "scheduled"; crmUrl: string | null; renewalAt: string | null }
  | { state: "failed" }
  | { state: "not_found" }
  | { state: "error" };

export function toChangeView(s: z.infer<typeof changeStatusSchema>): ChangeView {
  const crmUrl = s.crmUrl ? safeRedirectUrl(s.crmUrl) : null;
  switch (s.status) {
    case "processing":
      return { state: "wait" };
    case "requires_action": {
      const url = s.nextAction ? safeStripeInvoiceUrl(s.nextAction.url) : null;
      return url ? { state: "pay", url } : { state: "error" };
    }
    case "paid":
      return { state: "paid", crmUrl };
    case "scheduled":
      return { state: "scheduled", crmUrl, renewalAt: s.renewalAt ?? null };
    case "failed":
      return { state: "failed" };
  }
}

export const UPGRADE_MESSAGES = {
  email: "Please enter the email you use to sign in to SideKick.",
  code: "Enter the 6-digit code from the email.",
  codeInvalid: "That code isn't right or has expired. Check the email, or send a new code.",
  rateLimited: "Too many tries in a short time. Please wait a few minutes and try again.",
  expired: "Your verification has expired. Enter your email again to get a new code.",
  unavailable: "Online upgrades aren't available right now. You can change your plan in the CRM under Billing, or talk to our sales team.",
  failed: "Something went wrong on our side. Please try again in a moment.",
  conflict: "This change can't be made online right now. You can change your plan in the CRM under Billing, or talk to our sales team.",
  noChange: "Choose a new plan or an add-on to see the price.",
};
