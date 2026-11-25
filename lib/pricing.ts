import { z } from "zod";

/** Plan keys the public site accepts anywhere (pricing cards, ?plan=, inquiries). */
export const PLAN_KEYS = ["basic", "growth", "enterprise"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

/** Exact-match parser for untrusted input such as `?plan=`; anything else is null. */
export function parsePlanKey(value: unknown): PlanKey | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && (PLAN_KEYS as readonly string[]).includes(v) ? (v as PlanKey) : null;
}

const minor = z.number().int().nonnegative();

const planSchema = z.object({
  key: z.enum(PLAN_KEYS),
  name: z.string().min(1),
  priceMinor: minor.nullable(),
  interval: z.literal("month"),
  workspaces: z.number().int().positive(),
  aiCredits: z.number().int().nonnegative(),
  teamMembers: z.number().int().positive(),
  extraMemberMinor: minor.nullable(),
  website: z.object({
    maxPages: z.number().int().positive().nullable(),
    policyPagesCount: z.boolean(),
    servicePages: z.enum(["none", "single", "dedicated"]),
  }),
  modules: z.array(z.string()),
  available: z.boolean(),
});

/** GET /v1/public/pricing (SideKick API). */
export const pricingSchema = z.object({
  currency: z.string().regex(/^[a-z]{3}$/i),
  plans: z.array(planSchema).min(1),
  topUp: z.object({ credits: z.number().int().positive(), priceMinor: minor }).nullable(),
});

export type Pricing = z.infer<typeof pricingSchema>;
export type LivePlan = Pricing["plans"][number];

/** Validates an API body; invalid or duplicate plans mean "pricing unavailable". */
export function parsePricing(body: unknown): Pricing | null {
  const parsed = pricingSchema.safeParse(body);
  if (!parsed.success) return null;
  const keys = parsed.data.plans.map((p) => p.key);
  if (new Set(keys).size !== keys.length) return null;
  const plans = [...parsed.data.plans].sort((a, b) => PLAN_KEYS.indexOf(a.key) - PLAN_KEYS.indexOf(b.key));
  return { ...parsed.data, plans };
}

/** Server-only: live plans, cached for 5 minutes. Null when the API is missing, down or wrong. */
export async function getPricing(): Promise<Pricing | null> {
  const base = process.env.SIDEKICK_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/public/pricing`, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return parsePricing(await res.json());
  } catch {
    return null;
  }
}

/** Formats minor units (4999 → "$49.99", 1000 → "$10") using the currency's own decimals. */
export function formatMoney(amountMinor: number, currency: string) {
  const code = currency.toUpperCase();
  const digits = new Intl.NumberFormat("en-US", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits ?? 2;
  const whole = amountMinor % 10 ** digits === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: whole ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(amountMinor / 10 ** digits);
}

/** A plan can be bought online only when the API says so and has a price. */
export const isPurchasable = (p: LivePlan) => p.available && p.priceMinor !== null;
