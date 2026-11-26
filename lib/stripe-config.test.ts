import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStripePublishableKey } from "./stripe-config";

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test");
  vi.stubEnv("SIDEKICK_SITE_TOKEN", "site-token");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getStripePublishableKey", () => {
  it("returns a publishable key from the API", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { publishableKey: "pk_test_51AbCdEf" }));
    expect(await getStripePublishableKey()).toBe("pk_test_51AbCdEf");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/v1/public/stripe-config");
  });

  it("falls back (null) on 503, network errors, secret keys or junk", async () => {
    fetchMock.mockResolvedValueOnce(json(503, { code: "NOT_CONFIGURED" }));
    expect(await getStripePublishableKey()).toBeNull();
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await getStripePublishableKey()).toBeNull();
    for (const publishableKey of ["sk_test_51AbCdEf", "pk_test_<x>", 42, undefined]) {
      fetchMock.mockResolvedValueOnce(json(200, { publishableKey }));
      expect(await getStripePublishableKey()).toBeNull();
    }
    vi.stubEnv("SIDEKICK_API_URL", "");
    expect(await getStripePublishableKey()).toBeNull();
  });
});
