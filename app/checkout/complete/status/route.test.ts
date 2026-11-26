import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const jar = { get: (n: string) => (store.has(n) ? { value: store.get(n) } : undefined), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => jar }));
const { GET } = await import("./route");

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const call = (id = "su_1") => GET(new Request(`https://www.sidekick.example/checkout/complete/status?signup=${id}`));
const api = (status: string, next: unknown, extra = {}) => ({ signupId: "su_1", planKey: "growth", status, next, ...extra });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test");
  vi.stubEnv("SIDEKICK_SITE_TOKEN", "site-token");
  store.clear();
  store.set("sk_signup_su_1", "secret-token");
  jar.delete.mockClear();
  fetchMock = vi.fn(async () => json(200, api("processing", { kind: "wait" })));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /checkout/complete/status", () => {
  it("asks the API with the site token and the cookie token, never returning the token", async () => {
    const res = await call();
    expect(await res.json()).toEqual({ state: "wait", status: "processing" });
    expect(res.headers.get("cache-control")).toBe("no-store");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/public/signups/su_1");
    expect(init.headers).toMatchObject({ authorization: "Bearer site-token", "x-sidekick-signup-token": "secret-token" });
  });

  it("is not found without a cookie or with a malformed id, without calling the API", async () => {
    expect((await call("su_2")).status).toBe(404);
    expect((await call("..%2Fadmin")).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps API 404 to not_found", async () => {
    fetchMock.mockResolvedValueOnce(json(404, { code: "SIGNUP_NOT_FOUND" }));
    expect(await (await call()).json()).toEqual({ state: "not_found" });
  });

  it("returns the set-password URL when ready and clears the cookie", async () => {
    fetchMock.mockResolvedValueOnce(json(200, api("ready", { kind: "set_password", url: "https://crm.sidekick.example/set-password?t=abc" })));
    expect(await (await call()).json()).toEqual({ state: "set_password", url: "https://crm.sidekick.example/set-password?t=abc" });
    expect(jar.delete).toHaveBeenCalledWith({ name: "sk_signup_su_1", path: "/checkout" });
  });

  it("maps existing accounts and failures", async () => {
    fetchMock.mockResolvedValueOnce(json(200, api("existing_account", { kind: "sign_in", url: "https://crm.sidekick.example/sign-in" })));
    expect(await (await call()).json()).toEqual({ state: "sign_in", url: "https://crm.sidekick.example/sign-in" });
    fetchMock.mockResolvedValueOnce(json(200, api("expired", { kind: "retry", url: "https://evil.example" })));
    expect(await (await call()).json()).toEqual({ state: "retry", status: "expired", planKey: "growth" });
    expect(jar.delete).not.toHaveBeenCalled();
  });

  it("refuses unsafe URLs, mismatched states, other signups and unknown bodies", async () => {
    for (const body of [
      api("ready", { kind: "set_password", url: "javascript:alert(1)" }),
      api("ready", { kind: "set_password", url: "http://crm.sidekick.example/x" }),
      api("ready", { kind: "sign_in", url: "https://crm.sidekick.example/x" }),
      api("ready", { kind: "wait" }, { signupId: "su_9" }),
      { hello: "world" },
    ]) {
      fetchMock.mockResolvedValueOnce(json(200, body));
      const res = await call();
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ state: "error" });
    }
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await call()).status).toBe(502);
  });
});
