import { describe, expect, it } from "vitest";
import { formatMoney, isPurchasable, parsePlanKey, parsePricing } from "./pricing";
import { pricing } from "../e2e/fixtures";

describe("formatMoney", () => {
  it("formats minor units with cents only when needed", () => {
    expect(formatMoney(4999, "usd")).toBe("$49.99");
    expect(formatMoney(14999, "USD")).toBe("$149.99");
    expect(formatMoney(1000, "usd")).toBe("$10");
    expect(formatMoney(0, "usd")).toBe("$0");
    expect(formatMoney(1050, "usd")).toBe("$10.50");
  });
  it("respects zero-decimal currencies", () => {
    expect(formatMoney(5000, "jpy")).toBe("¥5,000");
  });
});

describe("parsePlanKey", () => {
  it("accepts only the three plan keys, exactly", () => {
    expect(parsePlanKey("basic")).toBe("basic");
    expect(parsePlanKey("growth")).toBe("growth");
    expect(parsePlanKey(["enterprise", "basic"])).toBe("enterprise");
    for (const bad of [undefined, null, "", "Growth", " basic", "pro", "basic ", "__proto__", 1, ["x"]]) expect(parsePlanKey(bad)).toBeNull();
  });
});

describe("parsePricing", () => {
  it("accepts the contract and orders plans basic → enterprise", () => {
    const shuffled = { ...pricing, plans: [...pricing.plans].reverse() };
    expect(parsePricing(shuffled)?.plans.map((p) => p.key)).toEqual(["basic", "growth", "enterprise"]);
  });
  it("treats invalid bodies as unavailable", () => {
    expect(parsePricing(null)).toBeNull();
    expect(parsePricing({ ...pricing, plans: [] })).toBeNull();
    expect(parsePricing({ ...pricing, plans: [{ ...pricing.plans[0], key: "pro" }] })).toBeNull();
    expect(parsePricing({ ...pricing, plans: [{ ...pricing.plans[0], priceMinor: 49.99 }] })).toBeNull();
    expect(parsePricing({ ...pricing, plans: [pricing.plans[0], pricing.plans[0]] })).toBeNull();
    expect(parsePricing({ ...pricing, currency: "dollars" })).toBeNull();
  });
  it("keeps a plan without a price but marks it not purchasable", () => {
    const p = parsePricing({ ...pricing, plans: [{ ...pricing.plans[0], priceMinor: null }] });
    expect(p?.plans[0].priceMinor).toBeNull();
    expect(isPurchasable(p!.plans[0])).toBe(false);
    expect(isPurchasable({ ...pricing.plans[0], available: false } as never)).toBe(false);
  });
});
