import { cookies } from "next/headers";
import { SIGNUP_COOKIE_PATH, SIGNUP_ID, signupCookie, statusSchema, toView, type StatusView } from "@/lib/signup";

export const dynamic = "force-dynamic";

const reply = (view: StatusView, status = 200) => Response.json(view, { status, headers: { "cache-control": "no-store" } });

/** Browser poll for /checkout/complete. Reads the httpOnly signup token server-side and asks the SideKick API. */
export async function GET(request: Request) {
  const signupId = new URL(request.url).searchParams.get("signup") ?? "";
  if (!SIGNUP_ID.test(signupId)) return reply({ state: "not_found" }, 404);

  const jar = await cookies();
  const token = jar.get(signupCookie(signupId))?.value;
  if (!token) return reply({ state: "not_found" }, 404);

  const base = process.env.SIDEKICK_API_URL;
  const siteToken = process.env.SIDEKICK_SITE_TOKEN;
  if (!base || !siteToken) return reply({ state: "error" }, 503);

  let res: Response;
  let body: unknown;
  try {
    res = await fetch(`${base.replace(/\/+$/, "")}/v1/public/signups/${encodeURIComponent(signupId)}`, {
      headers: { accept: "application/json", authorization: `Bearer ${siteToken}`, "x-sidekick-signup-token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    body = await res.json().catch(() => null);
  } catch {
    return reply({ state: "error" }, 502);
  }

  if (res.status === 404) return reply({ state: "not_found" }, 404);
  const parsed = res.ok ? statusSchema.safeParse(body) : null;
  if (!parsed?.success || parsed.data.signupId !== signupId) return reply({ state: "error" }, 502);

  const view = toView(parsed.data);
  // The account exists now; the token has done its job.
  if (view.state === "set_password") jar.delete({ name: signupCookie(signupId), path: SIGNUP_COOKIE_PATH });
  return reply(view, view.state === "error" ? 502 : 200);
}
