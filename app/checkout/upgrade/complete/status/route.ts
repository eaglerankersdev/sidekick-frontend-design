import { cookies } from "next/headers";
import { ACCOUNT_COOKIE, ACCOUNT_COOKIE_PATH, PUBLIC_ID, changeStatusSchema, toChangeView, type ChangeView } from "@/lib/upgrade";

export const dynamic = "force-dynamic";

const reply = (view: ChangeView, status = 200) => Response.json(view, { status, headers: { "cache-control": "no-store" } });

/** Browser poll for /checkout/upgrade/complete. Reads the httpOnly account token server-side and asks the SideKick API. */
export async function GET(request: Request) {
  const changeId = new URL(request.url).searchParams.get("change") ?? "";
  if (!PUBLIC_ID.test(changeId)) return reply({ state: "not_found" }, 404);

  const jar = await cookies();
  const token = jar.get(ACCOUNT_COOKIE)?.value;
  if (!token) return reply({ state: "not_found" }, 404);

  const base = process.env.SIDEKICK_API_URL;
  const siteToken = process.env.SIDEKICK_SITE_TOKEN;
  if (!base || !siteToken) return reply({ state: "error" }, 503);

  let res: Response;
  let body: unknown;
  try {
    res = await fetch(`${base.replace(/\/+$/, "")}/v1/public/upgrades/${encodeURIComponent(changeId)}`, {
      headers: { accept: "application/json", authorization: `Bearer ${siteToken}`, "x-sidekick-account-token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    body = await res.json().catch(() => null);
  } catch {
    return reply({ state: "error" }, 502);
  }

  if (res.status === 404 || res.status === 401 || res.status === 403) return reply({ state: "not_found" }, 404);
  const parsed = res.ok ? changeStatusSchema.safeParse(body) : null;
  if (!parsed?.success || parsed.data.changeId !== changeId) return reply({ state: "error" }, 502);

  const view = toChangeView(parsed.data);
  // Done: the token has no further use in this browser.
  if (view.state === "paid" || view.state === "scheduled") jar.delete({ name: ACCOUNT_COOKIE, path: ACCOUNT_COOKIE_PATH });
  return reply(view, view.state === "error" ? 502 : 200);
}
