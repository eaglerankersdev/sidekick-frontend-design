import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }) }));
const { submitLead } = await import("./actions");

const KEY = "0b6c3f4e-8a52-4c1e-9d2f-2f4f1b7a9c10";
const form = (over: Record<string, string> = {}) => {
  const fd = new FormData();
  const base = { audience: "provider", name: "Sam Rivera", email: "sam@brightside.co", business: "Brightside Washing", industry: "pressure-washing", plan: "growth", idempotencyKey: KEY, startedAt: String(Date.now() - 10_000), website: "" };
  for (const [k, v] of Object.entries({ ...base, ...over })) fd.set(k, v);
  return fd;
};
const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("SIDEKICK_API_URL", "https://api.example.test/");
  vi.stubEnv("PUBLIC_SITE_TOKEN", "site-token");
  fetchMock = vi.fn(async () => json(201, { id: "inq_1" }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("submitLead", () => {
  it("posts the inquiry to the SideKick API with auth, idempotency and client IP", async () => {
    expect(await submitLead({ status: "idle" }, form())).toEqual({ status: "success", audience: "provider" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/public/inquiries");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ authorization: "Bearer site-token", "Idempotency-Key": KEY, "x-sidekick-client-ip": "203.0.113.7" });
    expect(JSON.parse(init.body)).toEqual({
      audience: "provider", name: "Sam Rivera", email: "sam@brightside.co", business: "Brightside Washing",
      industry: "pressure-washing", planKey: "growth", source: "public-website",
    });
  });

  it("only sends known plan keys, and never for resellers", async () => {
    await submitLead({ status: "idle" }, form({ plan: "platinum", phone: "555 0100", message: "Hi" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ phone: "555 0100", message: "Hi" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty("planKey");
    await submitLead({ status: "idle" }, form({ audience: "reseller", industry: "reseller-new" }));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).not.toHaveProperty("planKey");
  });

  it("replaces a malformed idempotency key with a UUID", async () => {
    await submitLead({ status: "idle" }, form({ idempotencyKey: "not-a-uuid" }));
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("validates on the server before calling the API", async () => {
    const r = await submitLead({ status: "idle" }, form({ name: "S", email: "nope", business: "", industry: "" }));
    expect(r).toMatchObject({ status: "error", errors: { name: expect.any(String), email: expect.any(String), business: expect.any(String), industry: expect.any(String) } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops bots silently (honeypot and too-fast submits)", async () => {
    expect((await submitLead({ status: "idle" }, form({ website: "spam.example" }))).status).toBe("success");
    expect((await submitLead({ status: "idle" }, form({ startedAt: String(Date.now()) }))).status).toBe("success");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says the service is not available when env is missing", async () => {
    vi.stubEnv("PUBLIC_SITE_TOKEN", "");
    expect(await submitLead({ status: "idle" }, form())).toMatchObject({ status: "error", formError: expect.stringMatching(/not available yet/) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps API 422 field errors to friendly messages with a fresh key", async () => {
    fetchMock.mockResolvedValueOnce(json(422, { issues: [{ path: ["email"], message: "Invalid email" }] }));
    const r = await submitLead({ status: "idle" }, form());
    expect(r).toMatchObject({ status: "error", errors: { email: "Please enter a valid work email." } });
    expect(r.status === "error" && r.nextKey).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("maps 400 with a fieldErrors map", async () => {
    fetchMock.mockResolvedValueOnce(json(400, { details: { fieldErrors: { business: ["Too short"], unknown: ["x"] } } }));
    expect(await submitLead({ status: "idle" }, form())).toMatchObject({ errors: { business: "Please enter your business name." } });
  });

  it("maps 429, 503, 5xx and network failures without rotating the key", async () => {
    fetchMock.mockResolvedValueOnce(json(429));
    const limited = await submitLead({ status: "idle" }, form());
    expect(limited).toMatchObject({ formError: expect.stringMatching(/wait a few minutes/) });
    expect(limited).not.toHaveProperty("nextKey");
    fetchMock.mockResolvedValueOnce(json(503));
    expect(await submitLead({ status: "idle" }, form())).toMatchObject({ formError: expect.stringMatching(/not available yet/) });
    fetchMock.mockResolvedValueOnce(json(500));
    expect(await submitLead({ status: "idle" }, form())).not.toHaveProperty("nextKey");
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await submitLead({ status: "idle" }, form())).toMatchObject({ status: "error", formError: expect.stringMatching(/could not send/) });
  });
});
