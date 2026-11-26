import { afterEach, describe, expect, it, vi } from "vitest";
import { safeStripeInvoiceUrl, toChangeView } from "./upgrade";

afterEach(() => vi.unstubAllEnvs());

describe("safeStripeInvoiceUrl", () => {
  it("accepts only https Stripe invoice pages", () => {
    vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test");
    expect(safeStripeInvoiceUrl("https://invoice.stripe.com/i/acct_1/test_x")).toBe("https://invoice.stripe.com/i/acct_1/test_x");
    for (const bad of ["http://invoice.stripe.com/i/x", "https://invoice.stripe.com.evil.example/i", "https://evil.example/invoice.stripe.com", "https://user:pw@invoice.stripe.com/i", "javascript:alert(1)", "https://invoice.stripe.com:8443/i", 42, null])
      expect(safeStripeInvoiceUrl(bad)).toBeNull();
    expect(safeStripeInvoiceUrl("http://127.0.0.1:4999/__invoice/chg_1")).toBeNull();
  });

  it("allows the local mock only when the API itself is local", () => {
    vi.stubEnv("SIDEKICK_API_URL", "http://127.0.0.1:4999");
    expect(safeStripeInvoiceUrl("http://127.0.0.1:4999/__invoice/chg_1")).toBe("http://127.0.0.1:4999/__invoice/chg_1");
  });
});

describe("toChangeView", () => {
  const base = { changeId: "chg_1", nextAction: null };
  it("maps each status and checks every URL", () => {
    vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test");
    expect(toChangeView({ ...base, status: "processing" })).toEqual({ state: "wait" });
    expect(toChangeView({ ...base, status: "requires_action", nextAction: { kind: "pay", url: "https://invoice.stripe.com/i/x" } })).toEqual({ state: "pay", url: "https://invoice.stripe.com/i/x" });
    expect(toChangeView({ ...base, status: "requires_action", nextAction: { kind: "pay", url: "https://evil.example" } })).toEqual({ state: "error" });
    expect(toChangeView({ ...base, status: "paid", crmUrl: "https://app.sidekickgrp.com/billing" })).toEqual({ state: "paid", crmUrl: "https://app.sidekickgrp.com/billing" });
    expect(toChangeView({ ...base, status: "paid", crmUrl: "javascript:alert(1)" })).toEqual({ state: "paid", crmUrl: null });
    expect(toChangeView({ ...base, status: "scheduled", renewalAt: "2026-12-15T00:00:00Z" })).toEqual({ state: "scheduled", crmUrl: null, renewalAt: "2026-12-15T00:00:00Z" });
    expect(toChangeView({ ...base, status: "failed" })).toEqual({ state: "failed" });
  });
});
