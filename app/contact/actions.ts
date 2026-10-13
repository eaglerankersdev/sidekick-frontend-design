"use server";

import { headers } from "next/headers";

export type LeadState =
  | { status: "idle" }
  | { status: "success"; audience: "provider" | "reseller" }
  | { status: "error"; formError?: string; errors?: Record<string, string> };

/**
 * Server-side validation, abuse controls and routing of reseller vs provider
 * inquiries. Delivery goes to LEAD_WEBHOOK_URL (an approved endpoint or sales
 * integration). Without it configured, submissions are rejected with a clear
 * message rather than silently discarded (brief §5 Contact form).
 */

// Simple in-memory rate limiter (per instance). Replace with a shared store in production.
const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(key: string) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > LIMIT;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const audience = formData.get("audience") === "reseller" ? "reseller" : "provider";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const business = String(formData.get("business") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");
  const startedAt = Number(formData.get("startedAt") ?? 0);

  // Spam protection: honeypot filled or submitted faster than a human could.
  if (honeypot || (startedAt && Date.now() - startedAt < 2500)) {
    // Pretend success so bots learn nothing; nothing is stored.
    return { status: "success", audience };
  }

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid work email.";
  if (business.length < 2) errors.business = "Please enter your business name.";
  if (!industry) errors.industry = audience === "reseller" ? "Please choose your reseller interest." : "Please choose your industry.";
  if (message.length > 1200) errors.message = "Please keep your message under 1200 characters.";
  if (Object.keys(errors).length) return { status: "error", errors, formError: "Please fix the highlighted fields." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return { status: "error", formError: "Too many requests from this connection. Please try again in a few minutes." };
  }

  const endpoint = process.env.LEAD_WEBHOOK_URL;
  if (!endpoint) {
    return {
      status: "error",
      formError: "The demo request service is not configured yet. Please try again later.",
    };
  }

  const payload = {
    type: audience === "reseller" ? "reseller_inquiry" : "demo_request",
    audience,
    name,
    email,
    business,
    industry,
    phone: phone || null,
    message: message || null,
    source: "public-website",
    submittedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.LEAD_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.LEAD_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Lead endpoint responded ${res.status}`);
  } catch {
    return { status: "error", formError: "We could not send your request right now. Please try again in a moment." };
  }

  return { status: "success", audience };
}
