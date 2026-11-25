"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { Building2, Store, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitLead } from "@/app/contact/actions";
import type { LeadField, LeadState } from "@/lib/inquiry";
import type { PlanKey } from "@/lib/pricing";
import { industries } from "@/content/industries";
import { btnPrimary } from "./tw";

const initial: LeadState = { status: "idle" };

const PLAN_OPTIONS: { value: PlanKey | ""; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
  { value: "", label: "Not sure" },
];

const input =
  "block min-h-12 w-full rounded-btn! border-[1.5px] border-line bg-white px-3.5 py-3 font-semibold text-navy transition-[border-color] duration-200 aria-invalid:border-[#c2410c]";
const choice =
  "relative flex cursor-pointer rounded-md border-[1.5px] border-line bg-canvas transition-[border-color,background-color,box-shadow] duration-200 " +
  "hover:border-light-blue has-checked:border-cobalt has-checked:bg-ice has-checked:shadow-[0_0_0_3px_rgb(0_98_253/0.12)] " +
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cobalt";
const hiddenRadio = "absolute inset-0 m-0 size-full cursor-pointer opacity-0";

export function DemoLeadForm({
  defaultAudience = "provider",
  defaultIndustry,
  defaultPlan,
  idempotencyKey,
}: {
  defaultAudience?: "provider" | "reseller";
  defaultIndustry?: string;
  defaultPlan?: PlanKey | null;
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [audience, setAudience] = useState<"provider" | "reseller">(defaultAudience);
  const id = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const [startedAt] = useState(() => Date.now());
  // One key per form render; replaced only when the server says the last request was rejected.
  const [key, setKey] = useState(idempotencyKey);
  if (state.status === "error" && state.nextKey && state.nextKey !== key) setKey(state.nextKey);

  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div role="status" aria-live="polite" className="grid justify-items-center gap-3 rounded-xl bg-white p-[clamp(32px,5vw,56px)] text-center shadow-md ring-1 ring-line">
        <CheckCircle2 aria-hidden className="size-12 text-ok" />
        <h2 className="text-h3">Thanks, we have your request.</h2>
        <p className="max-w-[480px] text-muted">
          {state.audience === "reseller"
            ? "Your white-label inquiry is on its way to our partnerships team. We will follow up by email to arrange a conversation."
            : "Your demo request is on its way to our team. We will follow up by email to arrange a time that works for you."}
        </p>
      </div>
    );
  }

  const err = (f: LeadField) => (state.status === "error" ? state.errors?.[f] : undefined);
  const describe = (f: LeadField) => (err(f) ? `${id}-${f}-err` : undefined);

  return (
    <form
      action={action}
      // Dispatch manually so React does not reset the fields after a failed submit (the action prop keeps no-JS submits working).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid gap-6 rounded-xl bg-white p-[clamp(22px,3vw,36px)] shadow-md ring-1 ring-line"
    >
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-3 p-0 font-bold">I am contacting SideKick because</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["provider", <Building2 key="i" aria-hidden />, "I run a service business", "Leads, quotes, jobs and invoices for my own company"],
              ["reseller", <Store key="i" aria-hidden />, "I want to resell a white-label CRM", "A branded CRM for my own clients"],
            ] as const
          ).map(([value, icon, title, body]) => (
            <label key={value} className={`${choice} items-start gap-3.5 p-4 [&>svg]:mt-0.5 [&>svg]:size-6 [&>svg]:shrink-0 [&>svg]:text-cobalt`}>
              <input type="radio" name="audience" value={value} checked={audience === value} onChange={() => setAudience(value)} className={hiddenRadio} />
              {icon}
              <span>
                <strong className="block">{title}</strong>
                <span className="block text-[0.85rem] text-muted">{body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {audience === "provider" && (
        <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={describe("planKey")}>
          <legend className="mb-3 p-0 font-bold">Plan you are interested in</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PLAN_OPTIONS.map((p) => (
              <label key={p.label} className={`${choice} min-h-12 items-center justify-center px-3 py-2.5 text-center font-bold`}>
                <input type="radio" name="plan" value={p.value} defaultChecked={(defaultPlan ?? "") === p.value} className={hiddenRadio} />
                {p.label}
              </label>
            ))}
          </div>
          <FieldError id={describe("planKey")} error={err("planKey")} />
        </fieldset>
      )}

      {state.status === "error" && state.formError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="flex items-center gap-2.5 rounded-md border border-danger-line bg-danger-bg px-4 py-3.5 font-bold text-danger-ink [&>svg]:size-[18px] [&>svg]:shrink-0"
        >
          <AlertCircle aria-hidden /> {state.formError}
        </div>
      )}

      <div className="grid gap-[18px] sm:grid-cols-2">
        <Field id={`${id}-name`} label="Your name" error={err("name")}>
          <input id={`${id}-name`} name="name" type="text" autoComplete="name" required maxLength={120} aria-invalid={!!err("name")} aria-describedby={describe("name")} className={input} />
        </Field>
        <Field id={`${id}-email`} label="Work email" error={err("email")}>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} aria-invalid={!!err("email")} aria-describedby={describe("email")} className={input} />
        </Field>
        <Field id={`${id}-business`} label="Business name" error={err("business")}>
          <input id={`${id}-business`} name="business" type="text" autoComplete="organization" required maxLength={160} aria-invalid={!!err("business")} aria-describedby={describe("business")} className={input} />
        </Field>
        {audience === "provider" ? (
          <Field key="provider" id={`${id}-industry`} label="Your industry" error={err("industry")}>
            <select id={`${id}-industry`} name="industry" defaultValue={defaultIndustry ?? ""} required aria-invalid={!!err("industry")} aria-describedby={describe("industry")} className={input}>
              <option value="" disabled>
                Select an industry
              </option>
              {industries.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.name}
                </option>
              ))}
              <option value="other">Another service</option>
            </select>
          </Field>
        ) : (
          <Field key="reseller" id={`${id}-industry`} label="Reseller interest" error={err("industry")}>
            <select id={`${id}-industry`} name="industry" defaultValue="" required aria-invalid={!!err("industry")} aria-describedby={describe("industry")} className={input}>
              <option value="" disabled>
                Select one
              </option>
              <option value="reseller-new">Starting a CRM resale business</option>
              <option value="reseller-existing">Adding a CRM to an existing agency or service</option>
              <option value="reseller-other">Something else</option>
            </select>
          </Field>
        )}
        <Field id={`${id}-phone`} label="Phone (optional)" error={err("phone")}>
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} aria-invalid={!!err("phone")} aria-describedby={describe("phone")} className={input} />
        </Field>
        <Field id={`${id}-message`} label="What would you like to manage better?" error={err("message")} full>
          <textarea id={`${id}-message`} name="message" rows={4} maxLength={1200} aria-invalid={!!err("message")} aria-describedby={describe("message")} className={`${input} min-h-[120px] resize-y`} />
        </Field>
      </div>

      {/* Spam protection: honeypot + time-to-submit (server checks both). */}
      <div className="absolute -left-[10000px] size-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="idempotencyKey" value={key} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3.5">
        <button type="submit" className={`${btnPrimary} disabled:opacity-70 disabled:hover:translate-y-0`} disabled={pending} aria-busy={pending}>
          {pending ? (
            <>
              <Loader2 aria-hidden className="animate-spin" /> Sending
            </>
          ) : audience === "reseller" ? (
            "Discuss White-Label"
          ) : (
            "Book a Demo"
          )}
        </button>
        <span className="text-[0.85rem] text-muted">
          We use this only to respond to you. See our{" "}
          <a href="/privacy" className="font-bold text-cobalt underline-offset-4 hover:underline">
            privacy policy
          </a>
          .
        </span>
      </div>
    </form>
  );
}

function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <span id={id} className="mt-1.5 flex items-center gap-1.5 text-[0.85rem] font-bold text-danger [&>svg]:size-[15px] [&>svg]:shrink-0">
      <AlertCircle aria-hidden /> {error}
    </span>
  );
}

function Field({ id, label, error, full, children }: { id: string; label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid content-start gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-[0.92rem] font-bold">
        {label}
      </label>
      {children}
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}
