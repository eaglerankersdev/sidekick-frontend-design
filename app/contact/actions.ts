"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { parsePlanKey } from "@/lib/pricing";
import { EMAIL, FRIENDLY, MESSAGES, UUID, mapApiResponse, type LeadField, type LeadState } from "@/lib/inquiry";

export type { LeadState } from "@/lib/inquiry";

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const field = (k: string) => String(formData.get(k) ?? "").trim();
  const audience = formData.get("audience") === "reseller" ? "reseller" : "provider";
  const name = field("name");
  const email = field("email");
  const business = field("business");
  const industry = field("industry");
  const phone = field("phone");
  const message = field("message");
  // Only the three plan keys are accepted; "Not sure" or anything else sends no plan.
  const planKey = audience === "provider" ? parsePlanKey(field("plan")) : null;
  const honeypot = field("website");
  const startedAt = Number(formData.get("startedAt") ?? 0);
  const sentKey = field("idempotencyKey");
  const idempotencyKey = UUID.test(sentKey) ? sentKey : randomUUID();

  // Spam protection: honeypot filled or submitted faster than a human could.
  if (honeypot || (startedAt && Date.now() - startedAt < 2500)) {
    // Pretend success so bots learn nothing; nothing is sent.
    return { status: "success", audience };
  }

  const errors: Partial<Record<LeadField, string>> = {};
  if (name.length < 2 || name.length > 120) errors.name = FRIENDLY.name;
  if (!EMAIL.test(email) || email.length > 254) errors.email = FRIENDLY.email;
  if (business.length < 2 || business.length > 160) errors.business = FRIENDLY.business;
  if (!industry || industry.length > 80) errors.industry = audience === "reseller" ? "Please choose your reseller interest." : "Please choose your industry.";
  if (phone.length > 40) errors.phone = FRIENDLY.phone;
  if (message.length > 1200) errors.message = FRIENDLY.message;
  if (Object.keys(errors).length) return { status: "error", errors, formError: MESSAGES.fix };

  const base = process.env.SIDEKICK_API_URL;
  const token = process.env.PUBLIC_SITE_TOKEN;
  if (!base || !token) return { status: "error", formError: MESSAGES.unavailable };

  const clientIp = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim();

  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/public/inquiries`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "Idempotency-Key": idempotencyKey,
        ...(clientIp ? { "x-sidekick-client-ip": clientIp } : {}),
      },
      body: JSON.stringify({
        audience,
        name,
        email,
        business,
        industry,
        ...(phone ? { phone } : {}),
        ...(message ? { message } : {}),
        ...(planKey ? { planKey } : {}),
        source: "public-website",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return await mapApiResponse(res, audience);
  } catch {
    return { status: "error", formError: MESSAGES.failed };
  }
}
