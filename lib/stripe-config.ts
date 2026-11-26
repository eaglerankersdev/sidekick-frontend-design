/** A Stripe publishable key: the only Stripe key the browser may see. */
export const PUBLISHABLE_KEY = /^pk_(test|live)_[A-Za-z0-9]{8,200}$/;

/**
 * Server-only: the publishable key for embedded Stripe Checkout from GET /v1/public/stripe-config.
 * Null when the API is missing, not configured (503) or answers anything unexpected; checkout then uses Stripe's hosted page.
 */
export async function getStripePublishableKey(): Promise<string | null> {
  const base = process.env.SIDEKICK_API_URL;
  const token = process.env.SIDEKICK_SITE_TOKEN;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/public/stripe-config`, {
      headers: { accept: "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const key = ((await res.json()) as { publishableKey?: unknown } | null)?.publishableKey;
    return typeof key === "string" && PUBLISHABLE_KEY.test(key) ? key : null;
  } catch {
    return null;
  }
}
