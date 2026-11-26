"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, LockKeyhole } from "lucide-react";
import { startCheckout } from "@/app/checkout/actions";
import { NO_ADDONS, orderTotals, type AddonPrices, type AddonSelection } from "@/lib/addons";
import type { CheckoutField, CheckoutState } from "@/lib/signup";
import { formatMoney, type PlanKey } from "@/lib/pricing";
import { AddOnList, CallRailAddOn, PacksAddOn, SeatsAddOn, SummaryPanel } from "./CheckoutParts";
import { TrustNotes } from "./OrderSummary";
import { btnPrimary } from "./tw";

const initial: CheckoutState = { status: "idle" };

const input =
  "block min-h-12 w-full rounded-btn! border-[1.5px] border-line bg-white px-3.5 py-3 font-semibold text-navy transition-[border-color] duration-200 " +
  "hover:border-line-strong focus-visible:border-cobalt aria-invalid:border-danger";

type Props = {
  plan: { key: PlanKey; name: string; priceMinor: number; teamMembers: number };
  currency: string;
  prices: AddonPrices;
  /** The plan card at the top of the form column (server-rendered). */
  header: React.ReactNode;
  idempotencyKey: string;
};

export function CheckoutForm({ plan, currency, prices, header, idempotencyKey }: Props) {
  const planKey = plan.key;
  const [state, action, pending] = useActionState(startCheckout, initial);
  const [sel, setSel] = useState<AddonSelection>(NO_ADDONS);
  const set = (patch: Partial<AddonSelection>) => setSel((s) => ({ ...s, ...patch }));
  const money = (m: number) => formatMoney(m, currency);
  const totals = orderTotals(plan, prices, sel);
  const id = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  // One key per form render; replaced only when the API rejected the last request.
  const [key, setKey] = useState(idempotencyKey);
  if (state.status === "error" && state.nextKey && state.nextKey !== key) setKey(state.nextKey);

  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  // Coming back from Stripe with the browser's Back button restores this page mid-submit; reload for a fresh form.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && window.location.reload();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const err = (f: CheckoutField) => (state.status === "error" ? state.errors?.[f] : undefined);
  const describe = (f: CheckoutField) => (err(f) ? `${id}-${f}-err` : undefined);
  const attrs = (f: CheckoutField) => ({ id: `${id}-${f}`, name: f, required: true, "aria-invalid": !!err(f), "aria-describedby": describe(f), className: input });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-10">
    <SummaryPanel
      className="lg:col-start-2 lg:row-start-1"
      totalLabel="Due today"
      total={money(totals.dueTodayMinor)}
      then={`Then ${money(totals.monthlyMinor)} per month`}
      lines={totals.lines.map((l) => ({
        key: l.key,
        label: l.label,
        detail: l.detail,
        amount: l.amountMinor === null ? "Free here" : money(l.amountMinor),
        note: l.cadence === "month" ? "per month" : l.cadence === "once" ? "one-time" : undefined,
      }))}
    >
      <TrustNotes className="mt-6" />
    </SummaryPanel>
    <form
      action={action}
      // Dispatch manually so React keeps the typed values after a failed submit (the action prop keeps no-JS submits working).
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      aria-label={`${plan.name} plan checkout`}
      className="grid min-w-0 gap-8 lg:col-start-1 lg:row-start-1"
    >
      {header}

      {state.status === "error" && state.formError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger-line bg-danger-bg px-4 py-3.5 font-bold text-danger-ink [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0"
        >
          <AlertCircle aria-hidden />
          <span>
            {state.formError}
            {state.salesLink && (
              <>
                {" "}
                <a href={`/contact?plan=${planKey}`} className="underline underline-offset-4">
                  Talk to sales
                </a>
              </>
            )}
          </span>
        </div>
      )}

      <section aria-labelledby={`${id}-details`} className="grid gap-5 rounded-xl bg-white p-[clamp(20px,3vw,32px)] ring-1 ring-line">
      <h2 id={`${id}-details`} className="text-xl">
        Your details
      </h2>
      <div className="grid gap-[18px] sm:grid-cols-2">
        <Field id={`${id}-name`} label="Full name" error={err("name")}>
          <input {...attrs("name")} type="text" autoComplete="name" maxLength={120} />
        </Field>
        <Field id={`${id}-email`} label="Work email" error={err("email")}>
          <input {...attrs("email")} type="email" autoComplete="email" inputMode="email" spellCheck={false} maxLength={254} />
        </Field>
        <Field id={`${id}-phone`} label="Phone" error={err("phone")}>
          <input {...attrs("phone")} type="tel" autoComplete="tel" inputMode="tel" maxLength={40} />
        </Field>
        <Field id={`${id}-businessName`} label="Business name" error={err("businessName")}>
          <input {...attrs("businessName")} type="text" autoComplete="organization" maxLength={160} />
        </Field>
      </div>
      </section>

      <section aria-labelledby={`${id}-addons`} className="grid gap-4">
        <div>
          <h2 id={`${id}-addons`} className="text-xl">
            Add-ons
          </h2>
          <p className="mt-1 text-muted">Optional. You can also add these later in the CRM.</p>
        </div>
        <AddOnList>
          <SeatsAddOn
            prices={prices}
            currency={currency}
            value={sel.extraSeats}
            onChange={(extraSeats) => set({ extraSeats })}
            note={`Your plan includes ${plan.teamMembers.toLocaleString("en-US")} team members. Add more people now.`}
          />
          <PacksAddOn prices={prices} currency={currency} value={sel.creditPacks} onChange={(creditPacks) => set({ creditPacks })} />
          <CallRailAddOn checked={sel.callRail} onChange={(callRail) => set({ callRail })} />
        </AddOnList>
      </section>

      <div className="grid gap-5 rounded-xl bg-white p-[clamp(20px,3vw,32px)] ring-1 ring-line">
      <div>
        <label className="group flex min-h-11 cursor-pointer items-start gap-3 py-1">
          <span className="relative mt-px grid size-6 shrink-0 place-items-center">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              aria-invalid={!!err("acceptTerms")}
              aria-describedby={describe("acceptTerms")}
              className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-line-strong bg-white transition-colors duration-150 checked:border-cobalt checked:bg-cobalt aria-invalid:border-danger"
            />
            <Check aria-hidden strokeWidth={3} className="pointer-events-none relative size-4 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
          </span>
          <span className="leading-normal">
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener" className="font-bold text-cobalt underline-offset-4 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener" className="font-bold text-cobalt underline-offset-4 hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>
        <FieldError id={describe("acceptTerms")} error={err("acceptTerms")} />
      </div>

      <input type="hidden" name="plan" value={planKey} />
      <input type="hidden" name="idempotencyKey" value={key} />

      <div className="grid gap-3">
        <button type="submit" className={`${btnPrimary} w-full disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0`} disabled={pending} aria-busy={pending}>
          {pending ? (
            <>
              <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> Opening secure checkout
            </>
          ) : (
            <>
              <LockKeyhole aria-hidden /> Continue to payment
            </>
          )}
        </button>
        <p className="text-center text-[0.88rem] text-muted">
          Next, you pay {money(totals.dueTodayMinor)} on Stripe&apos;s secure page, then {money(totals.monthlyMinor)} per month.
        </p>
      </div>
      </div>
    </form>
    </div>
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

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-[0.92rem] font-bold">
        {label}
      </label>
      {children}
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}
