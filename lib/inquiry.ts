import { randomUUID } from "node:crypto";

export type LeadField = "name" | "email" | "business" | "industry" | "phone" | "message" | "planKey";

export type LeadState =
  | { status: "idle" }
  | { status: "success"; audience: "provider" | "reseller" }
  /** `nextKey`: a fresh Idempotency-Key, sent when the API rejected the request so a corrected retry is a new inquiry. */
  | { status: "error"; formError?: string; errors?: Partial<Record<LeadField, string>>; nextKey?: string };

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const FRIENDLY: Record<LeadField, string> = {
  name: "Please enter your name.",
  email: "Please enter a valid work email.",
  business: "Please enter your business name.",
  industry: "Please choose an option.",
  phone: "Please check your phone number.",
  message: "Please keep your message under 1200 characters.",
  planKey: "Please choose a plan, or Not sure.",
};

export const MESSAGES = {
  fix: "Please fix the highlighted fields.",
  unavailable: "Our contact service is not available yet. Please try again later.",
  rateLimited: "You have sent several requests in a short time. Please wait a few minutes and try again.",
  failed: "We could not send your request right now. Please try again in a moment.",
};

/** Pulls field names out of the API's validation error body, whatever shape it uses. */
function apiFieldErrors(body: unknown): Partial<Record<LeadField, string>> {
  const out: Partial<Record<LeadField, string>> = {};
  const add = (field: unknown) => {
    const f = Array.isArray(field) ? field[0] : field;
    if (typeof f === "string" && f in FRIENDLY) out[f as LeadField] = FRIENDLY[f as LeadField];
  };
  if (!body || typeof body !== "object") return out;
  const b = body as Record<string, unknown>;
  for (const list of [b.issues, b.errors, (b.details as Record<string, unknown> | undefined)?.issues]) {
    if (Array.isArray(list)) for (const i of list) add((i as { path?: unknown; field?: unknown })?.path ?? (i as { field?: unknown })?.field);
  }
  for (const map of [b.errors, b.fieldErrors, (b.details as Record<string, unknown> | undefined)?.fieldErrors]) {
    if (map && typeof map === "object" && !Array.isArray(map)) Object.keys(map).forEach(add);
  }
  return out;
}

/** Maps a SideKick API response to form state (400/422 field errors, 429, 503). */
export async function mapApiResponse(res: Response, audience: "provider" | "reseller"): Promise<LeadState> {
  if (res.ok) return { status: "success", audience };
  if (res.status === 400 || res.status === 422) {
    const errors = apiFieldErrors(await res.json().catch(() => null));
    return Object.keys(errors).length
      ? { status: "error", errors, formError: MESSAGES.fix, nextKey: randomUUID() }
      : { status: "error", formError: MESSAGES.failed, nextKey: randomUUID() };
  }
  if (res.status === 429) return { status: "error", formError: MESSAGES.rateLimited };
  if (res.status === 503) return { status: "error", formError: MESSAGES.unavailable };
  if (res.status >= 400 && res.status < 500) return { status: "error", formError: MESSAGES.failed, nextKey: randomUUID() };
  return { status: "error", formError: MESSAGES.failed };
}

