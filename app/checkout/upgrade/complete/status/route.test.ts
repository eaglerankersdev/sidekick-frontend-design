import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const jar = { get: (n: string) => (store.has(n) ? { value: store.get(n) } : undefined), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => jar }));
const { GET } = await import("./route");

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const call = (id = "chg_1") => GET(new Request(`https://www.sidekick.example/checkout/upgrade/complete/status?change=${id}`));

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test");
  vi.stubEnv("SIDEKICK_SITE_TOKEN", "site-token");
  store.clear();
  store.set("sk_account", "acct-secret");
  jar.delete.mockClear();
  fetchMock = vi.fn(async () => json(200, { changeId: "chg_1", status: "processing", nextAction: null }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /checkout/upgrade/complete/status", () => {
  it("asks the API with the cookie token and never returns it", async () => {
    const res = await call();
    expect(await res.json()).toEqual({ state: "wait" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/public/upgrades/chg_1");
    expect(init.headers).toMatchObject({ authorization: "Bearer site-token", "x-sidekick-account-token": "acct-secret" });
  });

  it("clears the cookie once paid and passes only a checked CRM link", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { changeId: "chg_1", status: "paid", nextAction: null, crmUrl: "https://app.sidekickgrp.com/billing" }));
    expect(await (await call()).json()).toEqual({ state: "paid", crmUrl: "https://app.sidekickgrp.com/billing" });
    expect(jar.delete).toHaveBeenCalledWith({ name: "sk_account", path: "/checkout" });
  });

  it("fails safely: bad ids, no cookie, another change's body, unknown change", async () => {
    expect((await call("../x")).status).toBe(404);
    fetchMock.mockResolvedValueOnce(json(200, { changeId: "chg_9", status: "paid", nextAction: null }));
    expect(await (await call()).json()).toEqual({ state: "error" });
    fetchMock.mockResolvedValueOnce(json(404, { code: "CHANGE_NOT_FOUND" }));
    expect(await (await call()).json()).toEqual({ state: "not_found" });
    store.clear();
    expect((await call()).status).toBe(404);
  });
});
