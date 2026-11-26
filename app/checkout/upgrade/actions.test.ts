import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const jar = { set: vi.fn((n: string, v: string) => store.set(n, v)), get: (n: string) => (store.has(n) ? { value: store.get(n) } : undefined) };
let host = "www.sidekick.example";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", host }),
  cookies: async () => jar,
}));
const { requestCode, verifyCode, previewUpgrade, confirmUpgrade } = await import("./actions");

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const business = { businessId: "biz_1", name: "Brightside Washing", planKey: "basic", planName: "Basic", extraSeats: 1, status: "active" };
const preview = {
  lines: [{ label: "Growth plan, rest of this cycle", amountMinor: 2500 }],
  dueNowMinor: 2500,
  newMonthlyMinor: 10999,
  currency: "usd",
  effective: "now",
  renewalAt: "2026-12-15T00:00:00Z",
  warnings: [],
  paymentMethod: { brand: "visa", last4: "4242" },
};
const KEY = "0b6c3f4e-8a52-4c1e-9d2f-2f4f1b7a9c10";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test/");
  vi.stubEnv("SIDEKICK_SITE_TOKEN", "site-token");
  fetchMock = vi.fn(async () => json(202, { challengeId: "ch_1", expiresAt: "2026-11-27T10:10:00Z" }));
  vi.stubGlobal("fetch", fetchMock);
  store.clear();
  jar.set.mockClear();
  host = "www.sidekick.example";
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("requestCode", () => {
  it("posts the email with the site token, an Idempotency-Key and the client IP", async () => {
    expect(await requestCode(" sam@brightside.co ")).toEqual({ ok: true, challengeId: "ch_1", expiresAt: "2026-11-27T10:10:00Z" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/public/account-codes");
    expect(JSON.parse(init.body)).toEqual({ email: "sam@brightside.co" });
    expect(init.headers).toMatchObject({ authorization: "Bearer site-token", "x-sidekick-client-ip": "203.0.113.7", "Idempotency-Key": expect.stringMatching(/^[0-9a-f-]{36}$/) });
  });

  it("checks the email before calling the API and maps 429", async () => {
    expect(await requestCode("nope")).toMatchObject({ ok: false, field: "email" });
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(json(429, { code: "RATE_LIMITED" }));
    expect(await requestCode("sam@brightside.co")).toMatchObject({ ok: false, error: expect.stringMatching(/Too many tries/) });
  });
});

describe("verifyCode", () => {
  it("stores the account token only in an httpOnly cookie and returns the businesses without it", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { accountToken: "acct-secret", email: "sam@brightside.co", businesses: [business] }));
    const r = await verifyCode("ch_1", "123 456");
    expect(r).toEqual({ ok: true, email: "sam@brightside.co", businesses: [business] });
    expect(JSON.stringify(r)).not.toContain("acct-secret");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/v1/public/account-codes/ch_1/verify");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: "123456" });
    expect(jar.set).toHaveBeenCalledWith("sk_account", "acct-secret", { httpOnly: true, secure: true, sameSite: "lax", path: "/checkout", maxAge: 1800 });
  });

  it("maps a wrong code, too many tries and bad input without setting a cookie", async () => {
    fetchMock.mockResolvedValueOnce(json(400, { code: "CODE_INVALID" }));
    expect(await verifyCode("ch_1", "000000")).toMatchObject({ ok: false, field: "code", error: expect.stringMatching(/isn't right/) });
    fetchMock.mockResolvedValueOnce(json(429, { code: "RATE_LIMITED" }));
    expect(await verifyCode("ch_1", "999999")).toMatchObject({ ok: false, error: expect.stringMatching(/Too many tries/) });
    expect(await verifyCode("ch_1", "12")).toMatchObject({ ok: false, field: "code" });
    expect(await verifyCode("../x", "123456")).toMatchObject({ ok: false, expired: true });
    fetchMock.mockResolvedValueOnce(json(200, { accountToken: "t", email: "x", businesses: [{ ...business, businessId: "../evil" }] }));
    expect(await verifyCode("ch_1", "123456")).toMatchObject({ ok: false });
    expect(jar.set).not.toHaveBeenCalled();
  });
});

describe("previewUpgrade / confirmUpgrade", () => {
  beforeEach(() => store.set("sk_account", "acct-secret"));

  it("sends the account token header and only the fields that change", async () => {
    fetchMock.mockResolvedValueOnce(json(200, preview));
    expect(await previewUpgrade({ businessId: "biz_1", planKey: "growth", extraSeats: null, creditPacks: 2 })).toEqual({ ok: true, preview });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/public/upgrades/preview");
    expect(init.headers).toMatchObject({ "x-sidekick-account-token": "acct-secret", authorization: "Bearer site-token" });
    expect(JSON.parse(init.body)).toEqual({ businessId: "biz_1", planKey: "growth", creditPacks: 2 });
  });

  it("refuses unknown plans, empty changes and a missing session without calling the API", async () => {
    expect(await previewUpgrade({ businessId: "biz_1", planKey: "platinum" as never })).toMatchObject({ ok: false });
    expect(await previewUpgrade({ businessId: "biz_1" })).toMatchObject({ ok: false, error: expect.stringMatching(/Choose a new plan/) });
    store.clear();
    expect(await previewUpgrade({ businessId: "biz_1", planKey: "growth" })).toMatchObject({ ok: false, expired: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats 401 as an expired session and rejects malformed previews", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { code: "ACCOUNT_TOKEN_INVALID" }));
    expect(await previewUpgrade({ businessId: "biz_1", planKey: "growth" })).toMatchObject({ ok: false, expired: true });
    fetchMock.mockResolvedValueOnce(json(200, { ...preview, dueNowMinor: "25" }));
    expect(await previewUpgrade({ businessId: "biz_1", planKey: "growth" })).toMatchObject({ ok: false });
  });

  it("confirms with the Idempotency-Key and accepts only Stripe invoice pages as the next action", async () => {
    fetchMock.mockResolvedValueOnce(json(201, { changeId: "chg_1", status: "requires_action", nextAction: { kind: "pay", url: "https://invoice.stripe.com/i/acct_1/test" } }));
    expect(await confirmUpgrade({ businessId: "biz_1", planKey: "growth" }, KEY)).toEqual({ ok: true, changeId: "chg_1" });
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ "Idempotency-Key": KEY, "x-sidekick-account-token": "acct-secret" });
    fetchMock.mockResolvedValueOnce(json(201, { changeId: "chg_2", status: "requires_action", nextAction: { kind: "pay", url: "https://evil.example/pay" } }));
    expect(await confirmUpgrade({ businessId: "biz_1", planKey: "growth" }, KEY)).toMatchObject({ ok: false });
  });
});
