import { afterEach, describe, expect, it, vi } from "vitest";
import { issueFields, safeRedirectUrl } from "./signup";

afterEach(() => vi.unstubAllEnvs());

describe("safeRedirectUrl", () => {
  it("allows https only, with no credentials", () => {
    vi.stubEnv("SIDEKICK_API_URL", "https://api.sidekick.example");
    expect(safeRedirectUrl("https://checkout.stripe.com/c/pay/cs_1#x")).toBe("https://checkout.stripe.com/c/pay/cs_1#x");
    for (const bad of ["http://checkout.stripe.com", "javascript:alert(1)", "data:text/html,x", "//evil.example", "/relative", "https://user:pw@evil.example", "", 42, null, `https://a.example/${"x".repeat(2100)}`]) {
      expect(safeRedirectUrl(bad)).toBeNull();
    }
  });

  it("allows http on localhost only in a local stack", () => {
    vi.stubEnv("SIDEKICK_API_URL", "https://api.sidekick.example");
    expect(safeRedirectUrl("http://127.0.0.1:4999/pay")).toBeNull();
    vi.stubEnv("SIDEKICK_API_URL", "http://127.0.0.1:4999");
    expect(safeRedirectUrl("http://127.0.0.1:4999/pay")).toBe("http://127.0.0.1:4999/pay");
    expect(safeRedirectUrl("http://localhost:3000/x")).toBe("http://localhost:3000/x");
    expect(safeRedirectUrl("http://evil.example/x")).toBeNull();
    vi.stubEnv("SIDEKICK_API_URL", "http://127.0.0.1.evil.example");
    expect(safeRedirectUrl("http://127.0.0.1:4999/pay")).toBeNull();
  });
});

describe("issueFields", () => {
  it("maps known array or dotted paths and ignores the rest", () => {
    expect(issueFields({ issues: [{ path: ["email"] }, { path: "phone.0" }, { path: ["planKey"] }, { path: ["__proto__"] }, null] })).toEqual({
      email: "Please enter a valid work email.",
      phone: "Please enter a phone number we can reach you on.",
    });
    expect(issueFields(null)).toEqual({});
  });
});
