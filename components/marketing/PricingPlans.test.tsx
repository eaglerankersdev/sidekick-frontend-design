import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddOns, CompareTable, PlanCards } from "./PricingPlans";
import { parsePricing } from "@/lib/pricing";
import { pricing as fixture } from "../../e2e/fixtures";

const live = parsePricing(fixture)!;

describe("PlanCards", () => {
  it("shows live prices with Get started and Talk to sales for each plan", () => {
    const html = renderToStaticMarkup(<PlanCards pricing={live} />);
    for (const price of ["$49.99", "$99.99", "$149.99"]) expect(html).toContain(price);
    for (const key of ["basic", "growth", "enterprise"]) {
      expect(html).toContain(`href="/checkout?plan=${key}"`);
      expect(html).toContain(`href="/contact?plan=${key}"`);
    }
    expect(html).toContain("1,500 AI credits each month");
  });

  it("never shows a number when the API is unavailable", () => {
    const html = renderToStaticMarkup(<PlanCards pricing={null} />);
    expect(html).not.toMatch(/\$\d/);
    expect(html).not.toContain("/checkout");
    expect(html.match(/Talk to sales/g)).toHaveLength(3);
    expect(renderToStaticMarkup(<AddOns pricing={null} />)).toBe("");
  });

  it("drops the price and checkout for a plan without priceMinor", () => {
    const partial = { ...live, plans: live.plans.map((p) => (p.key === "enterprise" ? { ...p, priceMinor: null } : p)) };
    const html = renderToStaticMarkup(<PlanCards pricing={partial} />);
    expect(html).not.toContain("$149.99");
    expect(html).not.toContain("/checkout?plan=enterprise");
    expect(html).toContain("/checkout?plan=growth");
  });
});

describe("AddOns and CompareTable", () => {
  it("shows add-on prices from the API", () => {
    const html = renderToStaticMarkup(<AddOns pricing={live} />);
    expect(html).toContain("$10 per month each");
    expect(html).toContain("$10 for 1,000 credits");
  });
  it("hides an add-on the API does not price", () => {
    const html = renderToStaticMarkup(<AddOns pricing={{ ...live, topUp: null }} />);
    expect(html).not.toContain("top-up");
  });
  it("renders website allowances per plan", () => {
    const html = renderToStaticMarkup(<CompareTable pricing={live} />);
    expect(html).toContain("Home page");
    expect(html).toContain("Up to 6");
    expect(html).toContain("One per service");
  });
});
