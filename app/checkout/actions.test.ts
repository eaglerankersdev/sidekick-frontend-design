import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = { set: vi.fn() };
let host = "www.sidekick.example";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", host }),
  cookies: async () => jar,
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
}));
const { startCheckout } = await import("./actions");

const KEY = "0b6c3f4e-8a52-4c1e-9d2f-2f4f1b7a9c10";
const form = (over: Record<string, string | null> = {}) => {
  const fd = new FormData();
  const base: Record<string, string | null> = {
    plan: "growth", name: "Sam Rivera", email: "sam@brightside.co", phone: "+1 555 0100", businessName: "Brightside Washing", acceptTerms: "on", idempotencyKey: KEY,
  };
  for (const [k, v] of Object.entries({ ...base, ...over })) if (v !== null) fd.set(k, v);
  return fd;
};
const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const created = { signupId: "su_123", checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1", signupToken: "secret-token", expiresAt: "2026-11-28T00:00:00Z" };
const idle = { status: "idle" } as const;

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test/");
  vi.stubEnv("SIDEKICK_SITE_TOKEN", "site-token");
  fetchMock = vi.fn(async () => json(201, created));
  vi.stubGlobal("fetch", fetchMock);
  jar.set.mockClear();
  host = "www.sidekick.example";
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("startCheckout", () => {
  it("creates the signup, stores the token in an httpOnly cookie and redirects to Stripe", async () => {
    await expect(startCheckout(idle, form())).rejects.toMatchObject({ url: created.checkoutUrl });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/public/signups");
    expect(init.headers).toMatchObject({ authorization: "Bearer site-token", "Idempotency-Key": KEY, "x-sidekick-client-ip": "203.0.113.7" });
    expect(JSON.parse(init.body)).toEqual({ planKey: "growth", name: "Sam Rivera", email: "sam@brightside.co", phone: "+1 555 0100", businessName: "Brightside Washing", acceptTerms: true });
    expect(jar.set).toHaveBeenCalledWith("sk_signup_su_123", "secret-token", { httpOnly: true, secure: true, sameSite: "lax", path: "/checkout", maxAge: 172800 });
  });

  it("sends add-ons only when something was added, clamped to the offered limits", async () => {
    await expect(startCheckout(idle, form({ extraSeats: "3", creditPacks: "2", callRail: "on" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).addons).toEqual({ extraSeats: 3, creditPacks: 2, callRail: true });
    await expect(startCheckout(idle, form({ extraSeats: "999", creditPacks: "-4" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).addons).toEqual({ extraSeats: 50, creditPacks: 0, callRail: false });
    await expect(startCheckout(idle, form({ extraSeats: "0", creditPacks: "0" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).not.toHaveProperty("addons");
  });

  it("drops Secure only on a local http host", async () => {
    host = "127.0.0.1:3311";
    await expect(startCheckout(idle, form())).rejects.toThrow("NEXT_REDIRECT");
    expect(jar.set.mock.calls[0][2]).toMatchObject({ secure: false });
  });

  it("never redirects to an unsafe checkout URL or stores a token from a malformed body", async () => {
    for (const body of [{ ...created, checkoutUrl: "javascript:alert(1)" }, { ...created, checkoutUrl: "http://evil.example/pay" }, { ...created, signupId: "../x" }, { ok: true }]) {
      fetchMock.mockResolvedValueOnce(json(201, body));
      expect(await startCheckout(idle, form())).toMatchObject({ status: "error", formError: expect.stringMatching(/couldn't start checkout/) });
    }
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("embedded mode: asks for it, stores the cookie and hands the browser only the client secret", async () => {
    const embedded = { ...created, checkoutUrl: null, checkoutMode: "embedded", clientSecret: "cs_test_a1B2_secret_c3D4" };
    fetchMock.mockResolvedValueOnce(json(201, embedded));
    const r = await startCheckout(idle, form({ checkoutMode: "embedded" }));
    expect(r).toEqual({ status: "embedded", signupId: "su_123", clientSecret: "cs_test_a1B2_secret_c3D4" });
    expect(JSON.stringify(r)).not.toContain("secret-token");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ checkoutMode: "embedded" });
    expect(jar.set).toHaveBeenCalledWith("sk_signup_su_123", "secret-token", expect.objectContaining({ httpOnly: true, path: "/checkout" }));
  });

  it("embedded mode falls back to the hosted page when the API answers hosted, and never sends the mode otherwise", async () => {
    fetchMock.mockResolvedValueOnce(json(201, { ...created, checkoutMode: "hosted", clientSecret: null }));
    await expect(startCheckout(idle, form({ checkoutMode: "embedded" }))).rejects.toMatchObject({ url: created.checkoutUrl });
    await expect(startCheckout(idle, form())).rejects.toThrow("NEXT_REDIRECT");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).not.toHaveProperty("checkoutMode");
  });

  it("embedded mode with a malformed secret and no URL is an error, not a redirect", async () => {
    fetchMock.mockResolvedValueOnce(json(201, { ...created, checkoutUrl: null, checkoutMode: "embedded", clientSecret: "<script>" }));
    expect(await startCheckout(idle, form({ checkoutMode: "embedded" }))).toMatchObject({ status: "error", formError: expect.stringMatching(/couldn't start checkout/) });
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("validates on the server before calling the API", async () => {
    const r = await startCheckout(idle, form({ name: "S", email: "nope", phone: "12", businessName: "", acceptTerms: null }));
    expect(r).toMatchObject({ status: "error", errors: { name: expect.any(String), email: expect.any(String), phone: expect.any(String), businessName: expect.any(String), acceptTerms: expect.any(String) } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses unknown plans and a missing API config without calling it", async () => {
    expect(await startCheckout(idle, form({ plan: "platinum" }))).toMatchObject({ salesLink: true });
    vi.stubEnv("SIDEKICK_SITE_TOKEN", "");
    expect(await startCheckout(idle, form())).toMatchObject({ salesLink: true, formError: expect.stringMatching(/isn't available/) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps 400 VALIDATION_FAILED issues to fields with a fresh key", async () => {
    fetchMock.mockResolvedValueOnce(json(400, { code: "VALIDATION_FAILED", issues: [{ path: ["phone"], message: "Too short" }, { path: "businessName", message: "x" }] }));
    const r = await startCheckout(idle, form());
    expect(r).toMatchObject({ errors: { phone: "Please enter a phone number we can reach you on.", businessName: "Please enter your business name." } });
    expect(r.status === "error" && r.nextKey).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("maps 409, 429 and 503", async () => {
    fetchMock.mockResolvedValueOnce(json(409, { code: "PLAN_UNAVAILABLE" }));
    expect(await startCheckout(idle, form())).toMatchObject({ salesLink: true, formError: expect.stringMatching(/can't be bought online/), nextKey: expect.any(String) });
    fetchMock.mockResolvedValueOnce(json(409, { code: "IDEMPOTENCY_MISMATCH" }));
    expect(await startCheckout(idle, form())).toMatchObject({ formError: expect.stringMatching(/details changed/), nextKey: expect.any(String) });
    fetchMock.mockResolvedValueOnce(json(429, { code: "RATE_LIMITED", retryAfter: 120 }));
    expect(await startCheckout(idle, form())).toMatchObject({ formError: expect.stringMatching(/wait 2 minutes/) });
    fetchMock.mockResolvedValueOnce(json(503, { code: "SIGNUPS_NOT_CONFIGURED" }));
    expect(await startCheckout(idle, form())).toMatchObject({ salesLink: true, formError: expect.stringMatching(/isn't available/) });
  });

  it("keeps the key after 5xx and network errors, so a retry replays the same signup", async () => {
    fetchMock.mockResolvedValueOnce(json(500));
    expect(await startCheckout(idle, form())).not.toHaveProperty("nextKey");
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await startCheckout(idle, form())).not.toHaveProperty("nextKey");
    expect(jar.set).not.toHaveBeenCalled();
  });
});
