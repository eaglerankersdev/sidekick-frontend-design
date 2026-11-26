import type { LivePlan, Pricing } from "./pricing";

/** Quantity limits the checkout offers (owner brief); the API enforces its own. */
export const ADDON_LIMITS = { extraSeats: 50, creditPacks: 20 } as const;

export type AddonPrices = {
  /** Monthly price of one team member above the plan's limit, or null when not sold. */
  seatMinor: number | null;
  /** One-time AI credit pack, or null when not sold. */
  pack: { credits: number; priceMinor: number } | null;
};

export type AddonSelection = { extraSeats: number; creditPacks: number; callRail: boolean };
export const NO_ADDONS: AddonSelection = { extraSeats: 0, creditPacks: 0, callRail: false };

/** Add-on prices from GET /v1/public/pricing: `addons` when the API sends it, else the older `extraMemberMinor` / `topUp`. */
export function addonPrices(pricing: Pricing, plan: LivePlan): AddonPrices {
  const a = pricing.addons;
  return {
    seatMinor: a?.extraMember !== undefined ? (a.extraMember?.priceMinor ?? null) : plan.extraMemberMinor,
    pack: a?.creditPack !== undefined ? a.creditPack : pricing.topUp,
  };
}

/** Whole numbers within 0…max; anything else (text, decimals, negatives) becomes the nearest valid value or 0. */
export function clampQty(value: unknown, max: number) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim() || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.trunc(n)));
}

/** Reads the add-on fields of the checkout form. Add-ons that are not sold are always 0. */
export function parseAddons(formData: FormData, prices: Pick<AddonPrices, "seatMinor" | "pack"> | null = null): AddonSelection {
  const seatsSold = !prices || prices.seatMinor !== null;
  const packsSold = !prices || prices.pack !== null;
  return {
    extraSeats: seatsSold ? clampQty(formData.get("extraSeats"), ADDON_LIMITS.extraSeats) : 0,
    creditPacks: packsSold ? clampQty(formData.get("creditPacks"), ADDON_LIMITS.creditPacks) : 0,
    callRail: formData.get("callRail") === "on",
  };
}

/** The optional `addons` field of POST /v1/public/signups; omitted when nothing was added so the Phase B body is unchanged. */
export function addonsPayload(sel: AddonSelection): AddonSelection | undefined {
  return sel.extraSeats || sel.creditPacks || sel.callRail ? { ...sel } : undefined;
}

export type OrderLine = { key: "plan" | "seats" | "packs" | "callRail"; label: string; detail?: string; amountMinor: number | null; cadence: "month" | "once" | "external" };

const n = (v: number) => v.toLocaleString("en-US");

/** The order summary, computed only from API prices: plan + seats are monthly, credit packs are one-time, CallRail is billed by CallRail. */
export function orderTotals(plan: { name: string; priceMinor: number }, prices: AddonPrices, sel: AddonSelection) {
  const lines: OrderLine[] = [{ key: "plan", label: `${plan.name} plan`, amountMinor: plan.priceMinor, cadence: "month" }];
  const seats = prices.seatMinor !== null ? clampQty(sel.extraSeats, ADDON_LIMITS.extraSeats) : 0;
  const packs = prices.pack ? clampQty(sel.creditPacks, ADDON_LIMITS.creditPacks) : 0;
  if (seats) lines.push({ key: "seats", label: `${n(seats)} extra team ${seats === 1 ? "member" : "members"}`, amountMinor: seats * prices.seatMinor!, cadence: "month" });
  if (packs)
    lines.push({
      key: "packs",
      label: `${n(packs)} AI credit ${packs === 1 ? "pack" : "packs"}`,
      detail: `${n(packs * prices.pack!.credits)} credits`,
      amountMinor: packs * prices.pack!.priceMinor,
      cadence: "once",
    });
  if (sel.callRail) lines.push({ key: "callRail", label: "CallRail call tracking", detail: "Billed by CallRail", amountMinor: null, cadence: "external" });

  const monthlyMinor = lines.reduce((sum, l) => sum + (l.cadence === "month" ? l.amountMinor! : 0), 0);
  const dueTodayMinor = monthlyMinor + lines.reduce((sum, l) => sum + (l.cadence === "once" ? l.amountMinor! : 0), 0);
  return { lines, monthlyMinor, dueTodayMinor };
}
