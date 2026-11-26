import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { parsePricing, type Pricing } from "@/lib/pricing";
import { pricing as fixture } from "../../e2e/fixtures";

let live: Pricing | null = parsePricing(fixture);
vi.mock("@/lib/pricing", async (orig) => ({ ...(await orig<typeof import("@/lib/pricing")>()), getPricing: async () => live }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
}));
vi.mock("./actions", () => ({ startCheckout: async () => ({ status: "idle" }) }));
const { default: CheckoutPage } = await import("./page");

const render = async (sp: Record<string, string>) => renderToStaticMarkup(await CheckoutPage({ searchParams: Promise.resolve(sp) }));

describe("/checkout", () => {
  it("shows the form and the live order summary", async () => {
    const html = await render({ plan: "growth" });
    expect(html).toContain("Start your Growth plan");
    for (const s of ["$99.99", "1,500", "$10/month each", "1,000 credits for $10, one-time", "Upgrade your plan", "/checkout/upgrade?plan=growth", 'autoComplete="organization"'.toLowerCase()]) expect(html.toLowerCase()).toContain(s.toLowerCase());
    expect(html).not.toContain("Checkout cancelled");
    expect(await render({ plan: "growth", cancelled: "1" })).toContain("Checkout cancelled. Nothing was charged.");
  });

  it("offers sales instead of the form when the plan is not purchasable or pricing is down", async () => {
    live = { ...parsePricing(fixture)!, plans: parsePricing(fixture)!.plans.map((p) => (p.key === "basic" ? { ...p, available: false } : p)) };
    let html = await render({ plan: "basic" });
    expect(html).toContain("isn&#x27;t available online right now");
    expect(html).toContain('href="/contact?plan=basic"');
    expect(html).not.toContain("<form");
    live = null;
    html = await render({ plan: "growth" });
    expect(html).not.toMatch(/\$\d/);
    expect(html).not.toContain("<form");
  });

  it("sends unknown plans back to pricing", async () => {
    await expect(render({ plan: "platinum" })).rejects.toMatchObject({ url: "/pricing#plans" });
  });
});
