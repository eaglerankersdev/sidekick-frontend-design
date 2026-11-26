import { describe, expect, it } from "vitest";
import { pricing as fixture } from "../e2e/fixtures";
import { addonPrices, addonsPayload, clampQty, orderTotals, parseAddons } from "./addons";
import { parsePricing } from "./pricing";

const live = parsePricing(fixture)!;
const growth = live.plans.find((p) => p.key === "growth")!;

describe("addonPrices", () => {
  it("reads `addons` from the pricing API", () => {
    const custom = { ...live, addons: { extraMember: { priceMinor: 1200, interval: "month" as const }, creditPack: { credits: 500, priceMinor: 700 } } };
    expect(addonPrices(custom, growth)).toEqual({ seatMinor: 1200, pack: { credits: 500, priceMinor: 700 } });
  });

  it("falls back to the plan's extra-member price and topUp when `addons` is missing, and honours null as not sold", () => {
    const { addons: _ignored, ...old } = live;
    expect(addonPrices(old, { ...growth, extraMemberMinor: 900 })).toEqual({ seatMinor: 900, pack: { credits: 1000, priceMinor: 1000 } });
    expect(addonPrices({ ...live, addons: { extraMember: null, creditPack: null } }, growth)).toEqual({ seatMinor: null, pack: null });
  });
});

describe("orderTotals", () => {
  const prices = addonPrices(live, growth);
  const plan = { name: "Growth", priceMinor: growth.priceMinor! };

  it("is the plan alone with nothing added", () => {
    expect(orderTotals(plan, prices, { extraSeats: 0, creditPacks: 0, callRail: false })).toMatchObject({ dueTodayMinor: 9999, monthlyMinor: 9999, lines: [{ key: "plan" }] });
  });

  it("adds seats monthly, packs once and CallRail at no charge", () => {
    const t = orderTotals(plan, prices, { extraSeats: 3, creditPacks: 2, callRail: true });
    expect(t.monthlyMinor).toBe(9999 + 3000);
    expect(t.dueTodayMinor).toBe(9999 + 3000 + 2000);
    expect(t.lines.map((l) => [l.label, l.amountMinor, l.cadence])).toEqual([
      ["Growth plan", 9999, "month"],
      ["3 extra team members", 3000, "month"],
      ["2 AI credit packs", 2000, "once"],
      ["CallRail call tracking", null, "external"],
    ]);
    expect(t.lines[2].detail).toBe("2,000 credits");
  });

  it("ignores add-ons that are not sold and clamps quantities", () => {
    const t = orderTotals(plan, { seatMinor: null, pack: prices.pack }, { extraSeats: 4, creditPacks: 99, callRail: false });
    expect(t.lines.map((l) => l.key)).toEqual(["plan", "packs"]);
    expect(t.dueTodayMinor).toBe(9999 + 20 * 1000);
  });
});

describe("form parsing", () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  it("clamps to whole numbers within the limits", () => {
    expect(clampQty("2.7", 50)).toBe(2);
    expect(clampQty("abc", 50)).toBe(0);
    expect(clampQty(-1, 50)).toBe(0);
    expect(clampQty("80", 50)).toBe(50);
    expect(parseAddons(fd({ extraSeats: "4", creditPacks: "21", callRail: "on" }))).toEqual({ extraSeats: 4, creditPacks: 20, callRail: true });
    expect(parseAddons(fd({ extraSeats: "4" }), { seatMinor: null, pack: null })).toEqual({ extraSeats: 0, creditPacks: 0, callRail: false });
  });
  it("omits the payload when nothing was added", () => {
    expect(addonsPayload({ extraSeats: 0, creditPacks: 0, callRail: false })).toBeUndefined();
    expect(addonsPayload({ extraSeats: 0, creditPacks: 0, callRail: true })).toEqual({ extraSeats: 0, creditPacks: 0, callRail: true });
  });
});
