"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Building2, Store, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitLead, type LeadState } from "@/app/contact/actions";
import { industries } from "@/content/industries";
import s from "./DemoLeadForm.module.css";

const initial: LeadState = { status: "idle" };

export function DemoLeadForm({ defaultAudience = "provider", defaultIndustry }: { defaultAudience?: "provider" | "reseller"; defaultIndustry?: string }) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [audience, setAudience] = useState<"provider" | "reseller">(defaultAudience);
  const id = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div className={s.success} role="status" aria-live="polite">
        <CheckCircle2 aria-hidden />
        <h2>Thanks, we have your request.</h2>
        <p>
          {state.audience === "reseller"
            ? "Your white-label inquiry is on its way to our partnerships team. We will follow up by email to arrange a conversation."
            : "Your demo request is on its way to our team. We will follow up by email to arrange a time that works for you."}
        </p>
      </div>
    );
  }

  const err = (field: string) => state.status === "error" && state.errors?.[field];

  return (
    <form action={action} className={s.form} noValidate>
      <fieldset className={s.audience}>
        <legend className={s.legend}>I am contacting SideKick because</legend>
        <div className={s.audienceGrid}>
          <label className={`${s.audienceOpt} ${audience === "provider" ? s.audienceOn : ""}`}>
            <input type="radio" name="audience" value="provider" checked={audience === "provider"} onChange={() => setAudience("provider")} />
            <Building2 aria-hidden />
            <span>
              <strong>I run a service business</strong>
              <em>Leads, quotes, jobs and invoices for my own company</em>
            </span>
          </label>
          <label className={`${s.audienceOpt} ${audience === "reseller" ? s.audienceOn : ""}`}>
            <input type="radio" name="audience" value="reseller" checked={audience === "reseller"} onChange={() => setAudience("reseller")} />
            <Store aria-hidden />
            <span>
              <strong>I want to resell a white-label CRM</strong>
              <em>A branded CRM for my own clients</em>
            </span>
          </label>
        </div>
      </fieldset>

      {state.status === "error" && state.formError && (
        <div ref={errorRef} tabIndex={-1} className={s.formError} role="alert">
          <AlertCircle aria-hidden /> {state.formError}
        </div>
      )}

      <div className={s.grid}>
        <Field id={`${id}-name`} label="Your name" error={err("name")}>
          <input id={`${id}-name`} name="name" type="text" autoComplete="name" required aria-invalid={!!err("name")} aria-describedby={err("name") ? `${id}-name-err` : undefined} />
        </Field>
        <Field id={`${id}-email`} label="Work email" error={err("email")}>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={!!err("email")} aria-describedby={err("email") ? `${id}-email-err` : undefined} />
        </Field>
        <Field id={`${id}-business`} label="Business name" error={err("business")}>
          <input id={`${id}-business`} name="business" type="text" autoComplete="organization" required aria-invalid={!!err("business")} aria-describedby={err("business") ? `${id}-business-err` : undefined} />
        </Field>
        {audience === "provider" ? (
          <Field id={`${id}-industry`} label="Your industry" error={err("industry")}>
            <select id={`${id}-industry`} name="industry" defaultValue={defaultIndustry ?? ""} required aria-invalid={!!err("industry")} aria-describedby={err("industry") ? `${id}-industry-err` : undefined}>
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
          <Field id={`${id}-interest`} label="Reseller interest" error={err("industry")}>
            <select id={`${id}-interest`} name="industry" defaultValue="" required aria-invalid={!!err("industry")} aria-describedby={err("industry") ? `${id}-interest-err` : undefined}>
              <option value="" disabled>
                Select one
              </option>
              <option value="reseller-new">Starting a CRM resale business</option>
              <option value="reseller-existing">Adding a CRM to an existing agency or service</option>
              <option value="reseller-other">Something else</option>
            </select>
          </Field>
        )}
        <Field id={`${id}-phone`} label="Phone (optional)">
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        </Field>
        <Field id={`${id}-message`} label="What would you like to manage better?" error={err("message")} full>
          <textarea id={`${id}-message`} name="message" rows={4} maxLength={1200} aria-invalid={!!err("message")} aria-describedby={err("message") ? `${id}-message-err` : undefined} />
        </Field>
      </div>

      {/* Spam protection: honeypot + time-to-submit (server checks both). */}
      <div className={s.hp} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />

      <div className={s.foot}>
        <button type="submit" className="btn btn--primary" disabled={pending} aria-busy={pending}>
          {pending ? (
            <>
              <Loader2 aria-hidden className={s.spin} /> Sending
            </>
          ) : audience === "reseller" ? (
            "Discuss White-Label"
          ) : (
            "Book a Demo"
          )}
        </button>
        <span className={s.privacy}>
          We use this only to respond to you. See our <a href="/privacy">privacy policy</a>.
        </span>
      </div>
    </form>
  );
}

function Field({ id, label, error, full, children }: { id: string; label: string; error?: string | false | undefined; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`${s.field} ${full ? s.fieldFull : ""} ${error ? s.fieldError : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span id={`${id}-err`} className={s.error} role="alert">
          <AlertCircle aria-hidden /> {error}
        </span>
      )}
    </div>
  );
}
