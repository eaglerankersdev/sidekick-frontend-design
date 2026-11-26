"use client";

import { startTransition, useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ChevronDown, CreditCard, Info, Loader2, LockKeyhole, PencilLine } from "lucide-react";
import { startCheckout } from "@/app/checkout/actions";
import { NO_ADDONS, orderTotals, type AddonPrices, type AddonSelection } from "@/lib/addons";
import type { CheckoutField, CheckoutState } from "@/lib/signup";
import { formatMoney, type PlanKey } from "@/lib/pricing";
import {
  AddOnList,
  Alert,
  CallRailAddOn,
  CardLogos,
  FieldError,
  PacksAddOn,
  Pill,
  PlanOption,
  RadioDot,
  SeatsAddOn,
  SectionCard,
  StripeMark,
  SummaryCard,
  SummaryHead,
  TrustLine,
  cardBase,
  fieldLabel,
  inputCls,
  optionOn,
  smallCaps,
} from "./CheckoutParts";
import EmbeddedPayment, { loadStripeOnce } from "./EmbeddedPayment";
import { btnPrimary } from "./tw";

const initial: CheckoutState = { status: "idle" };

export type CheckoutPlan = {
  key: PlanKey;
  name: string;
  tagline: string;
  priceMinor: number;
  teamMembers: number;
  featured: boolean;
  facts: [string, string][];
  prices: AddonPrices;
};

type Props = {
  plans: CheckoutPlan[];
  initialPlan: PlanKey;
  currency: string;
  idempotencyKey: string;
  /** From GET /v1/public/stripe-config; null = Stripe's hosted page instead of the embedded form. */
  publishableKey: string | null;
  cancelled: boolean;
};

const cta = `${btnPrimary} w-full disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0`;

export function CheckoutForm({ plans, initialPlan, currency, idempotencyKey, publishableKey, cancelled }: Props) {
  const [planKey, setPlanKey] = useState<PlanKey>(initialPlan);
  const plan = plans.find((p) => p.key === planKey) ?? plans[0];
  const [state, action, pending] = useActionState(startCheckout, initial);
  const [sel, setSel] = useState<AddonSelection>(NO_ADDONS);
  const set = (patch: Partial<AddonSelection>) => setSel((s) => ({ ...s, ...patch }));
  const money = (m: number) => formatMoney(m, currency);
  const totals = orderTotals(plan, plan.prices, sel);
  const id = useId();
  const formId = `${id}-form`;
  const errorRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLHeadingElement>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  // One key per form render; replaced only when the API rejected the last request or the buyer edits after opening payment.
  const [key, setKey] = useState(idempotencyKey);
  if (state.status === "error" && state.nextKey && state.nextKey !== key) setKey(state.nextKey);

  // The embedded Stripe form for the latest signup; the details above are locked while it is open.
  const [session, setSession] = useState<{ clientSecret: string } | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  const [stripeFailed, setStripeFailed] = useState(false);
  if (state.status === "embedded" && state.clientSecret !== seen) {
    setSeen(state.clientSecret);
    setSession({ clientSecret: state.clientSecret });
    setStripeFailed(false);
  }
  const locked = !!session;

  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (!session) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    paymentRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    paymentRef.current?.focus({ preventScroll: true });
  }, [session]);

  // Coming back from Stripe with the browser's Back button restores this page mid-submit; reload for a fresh form.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && window.location.reload();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const choosePlan = (k: PlanKey) => {
    setPlanKey(k);
    window.history.replaceState(window.history.state, "", `/checkout?plan=${k}`);
  };

  const editDetails = () => {
    setSession(null);
    setKey(crypto.randomUUID()); // changed details are a new signup
  };
  const onStripeError = useCallback(() => setStripeFailed(true), []);

  const err = (f: CheckoutField) => (state.status === "error" ? state.errors?.[f] : undefined);
  const describe = (f: CheckoutField) => (err(f) ? `${id}-${f}-err` : undefined);
  const attrs = (f: CheckoutField) => ({ id: `${id}-${f}`, name: f, required: true, "aria-invalid": !!err(f), "aria-describedby": describe(f), className: inputCls });

  const submitLabel = pending ? (
    <>
      <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> {publishableKey ? "Opening secure payment" : "Opening secure checkout"}
    </>
  ) : (
    <>
      <LockKeyhole aria-hidden /> Continue to payment
    </>
  );
  const goToPayment = () => paymentRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <>
      <header className="max-w-[46rem]">
        <p className={`${smallCaps} flex items-center gap-1.5 text-cobalt`}>
          <LockKeyhole aria-hidden className="size-3.5" strokeWidth={2.4} /> Secure checkout
        </p>
        <h1 className="mt-3 text-[clamp(2.1rem,1.5rem+2.4vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.025em] text-balance text-navy">
          Your {plan.name} plan
          <span aria-hidden className="ml-1.5 inline-block size-2.5 rounded-full bg-cobalt align-baseline sm:size-3" />
        </h1>
        <p className="mt-3 text-[1.05rem] leading-normal text-muted">Create your account and start in minutes, all in one step.</p>
        {cancelled && (
          <p role="status" className="mt-5 flex w-fit items-center gap-2.5 rounded-[12px] border border-[#d6e4fb] bg-white px-4 py-3 font-bold text-navy [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-cobalt">
            <Info aria-hidden /> Checkout cancelled. Nothing was charged.
          </p>
        )}
      </header>

      <div className="mt-8 grid items-start gap-5 lg:mt-10 lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-8">
        <SummaryCard
          className="lg:col-start-2 lg:row-start-1"
          head={<SummaryHead planKey={plan.key} title={`${plan.name} plan`} sub={`${money(plan.priceMinor)} per month`} />}
          facts={plan.facts}
          totalLabel="Due today"
          total={money(totals.dueTodayMinor)}
          then={`then ${money(totals.monthlyMinor)}/month`}
          lines={totals.lines.map((l) => ({
            key: l.key,
            label: l.label,
            detail: l.detail,
            amount: l.amountMinor === null ? "Free" : money(l.amountMinor),
            note: l.cadence === "month" ? "per month" : l.cadence === "once" ? "one-time" : undefined,
          }))}
        >
          <div className="mt-6 max-lg:hidden">
            {locked ? (
              <button type="button" onClick={goToPayment} className={cta}>
                <ArrowDown aria-hidden /> Finish in the secure form
              </button>
            ) : (
              <button type="submit" form={formId} className={cta} disabled={pending} aria-busy={pending}>
                {submitLabel}
              </button>
            )}
          </div>
          <TrustLine className="mt-5" />
        </SummaryCard>

        <form
          id={formId}
          action={action}
          // Dispatch manually so React keeps the typed values after a failed submit (the action prop keeps no-JS submits working).
          onSubmit={(e) => {
            e.preventDefault();
            if (pending || locked) return;
            if (publishableKey) void loadStripeOnce(publishableKey).catch(() => undefined); // warm Stripe.js while the signup is created
            const data = new FormData(e.currentTarget);
            startTransition(() => action(data));
          }}
          noValidate
          aria-label={`${plan.name} plan checkout`}
          className="grid min-w-0 gap-5 lg:col-start-1 lg:row-start-1"
        >
          {state.status === "error" && state.formError && (
            <Alert refEl={errorRef}>
              {state.formError}
              {state.salesLink && (
                <>
                  {" "}
                  <a href={`/contact?plan=${planKey}`} className="underline underline-offset-4">
                    Talk to sales
                  </a>
                </>
              )}
            </Alert>
          )}

          <fieldset disabled={locked} className="m-0 grid min-w-0 gap-5 border-0 p-0">
            <SectionCard n="01" id={`${id}-plan`} title="Choose your plan" subtitle="Every plan includes all modules. Change or cancel in the CRM.">
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="sr-only">Plan</legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {plans.map((p) => (
                    <PlanOption
                      key={p.key}
                      name="plan"
                      plan={{ key: p.key, name: p.name, tagline: p.tagline, price: money(p.priceMinor) }}
                      checked={p.key === planKey}
                      onChange={() => choosePlan(p.key)}
                      note={p.featured ? { text: "Most popular", tone: "accent" } : null}
                    />
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                aria-expanded={compareOpen}
                aria-controls={`${id}-compare`}
                onClick={() => setCompareOpen((o) => !o)}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[0.9rem] font-bold text-cobalt underline-offset-4 hover:underline"
              >
                Compare everything each plan includes
                <ChevronDown aria-hidden className={`size-4 transition-transform duration-200 ${compareOpen ? "rotate-180" : ""}`} />
              </button>
              <div id={`${id}-compare`} hidden={!compareOpen}>
                <PlanCompare plans={plans} selected={planKey} money={money} />
              </div>
            </SectionCard>

            <SectionCard n="02" id={`${id}-details`} title="Your details" subtitle="We use these to set up your account and business.">
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
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
              <p className="mt-5 text-[0.88rem] text-muted">
                Already with SideKick?{" "}
                <a href={`/checkout/upgrade?plan=${planKey}`} className="inline-flex min-h-11 items-center font-bold text-cobalt underline-offset-4 hover:underline sm:min-h-0">
                  Upgrade your plan
                </a>
              </p>
            </SectionCard>

            <SectionCard n="03" id={`${id}-addons`} title="Add-ons" badge={<Pill tone="quiet">Optional</Pill>} subtitle="Nothing here is required. You can also add these later in the CRM.">
              <AddOnList>
                <SeatsAddOn
                  prices={plan.prices}
                  currency={currency}
                  value={sel.extraSeats}
                  onChange={(extraSeats) => set({ extraSeats })}
                  note={`${plan.name} includes ${plan.teamMembers.toLocaleString("en-US")} team members. Add more people now.`}
                />
                <PacksAddOn prices={plan.prices} currency={currency} value={sel.creditPacks} onChange={(creditPacks) => set({ creditPacks })} />
                <CallRailAddOn checked={sel.callRail} onChange={(callRail) => set({ callRail })} />
              </AddOnList>
            </SectionCard>
          </fieldset>

          <SectionCard n="04" id={`${id}-payment`} headingRef={paymentRef} title="Payment" subtitle="Charged only when you confirm on the secure form.">
            <div className={`flex items-center gap-4 rounded-[16px] border p-4 sm:px-5 ${optionOn}`}>
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-[12px] border border-[#dfe5ee] bg-white text-navy [&>svg]:size-[22px] [&>svg]:stroke-[1.9]">
                <CreditCard />
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-tight font-bold text-navy">Card</p>
                <p className="mt-0.5 text-[0.86rem] leading-snug text-muted">Recurring payment, every month</p>
                <CardLogos className="mt-2.5" size="h-[22px]" />
              </div>
              <StripeMark className="h-[26px] max-sm:hidden" />
              <RadioDot checked />
            </div>

            <div className="mt-4">
              {session && publishableKey && !stripeFailed ? (
                <div className="rounded-[16px] border border-[#e2e7ee] bg-[#f7f9fc] p-2 transition-[opacity,translate] duration-300 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none sm:p-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 pt-2 pb-3">
                    <p className={`${smallCaps} text-navy`}>Card details</p>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold whitespace-nowrap text-muted max-sm:hidden">
                        <LockKeyhole aria-hidden className="size-3.5" /> Secure encrypted payment
                      </span>
                      <button type="button" onClick={editDetails} className="inline-flex min-h-11 items-center gap-1 text-[0.85rem] font-bold whitespace-nowrap text-cobalt underline-offset-4 hover:underline">
                        <PencilLine aria-hidden className="size-3.5" /> Edit order
                      </button>
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-[12px] bg-white" data-testid="embedded-checkout">
                    <EmbeddedPayment publishableKey={publishableKey} clientSecret={session.clientSecret} onLoadError={onStripeError} />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3.5 rounded-[16px] border border-dashed border-[#cfd8e4] bg-[#f9fafc] p-5" aria-live="polite">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-cobalt ring-1 ring-[#e2e7ee] [&>svg]:size-4">
                    {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <LockKeyhole />}
                  </span>
                  <p className="text-[0.9rem] leading-normal text-muted">
                    {stripeFailed ? (
                      <strong className="text-danger-ink">Stripe&apos;s secure form didn&apos;t load. Check your connection, then reload this page to try again.</strong>
                    ) : pending ? (
                      <strong className="text-navy">Opening Stripe&apos;s secure form…</strong>
                    ) : publishableKey ? (
                      <>
                        <strong className="text-navy">Your secure card form opens here.</strong> Press Continue to payment; nothing is charged until you confirm in Stripe&apos;s form.
                      </>
                    ) : (
                      <>
                        <strong className="text-navy">You pay on Stripe&apos;s secure page next.</strong> Nothing is charged until you confirm there.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
            <section aria-labelledby={`${id}-terms`} className={`${cardBase} p-8 max-sm:p-5`}>
              <h2 id={`${id}-terms`} className="text-[1.3rem] leading-tight font-bold text-navy">
                Before you continue
              </h2>
              <p className="mt-1.5 text-[0.95rem] text-muted">Please read and accept these before you pay.</p>
              <div className="mt-5">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 has-disabled:cursor-not-allowed">
                  <span className="relative mt-px grid size-[22px] shrink-0 place-items-center">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      required
                      aria-invalid={!!err("acceptTerms")}
                      aria-describedby={describe("acceptTerms")}
                      className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[6px] border-[1.5px] border-[#c3cddb] bg-white transition-colors duration-150 checked:border-cobalt checked:bg-cobalt aria-invalid:border-danger disabled:cursor-not-allowed"
                    />
                    <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none relative size-3.5 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100">
                      <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[0.95rem] leading-normal text-navy">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" rel="noopener" className="font-bold underline decoration-[#b6c4d6] underline-offset-4 hover:text-cobalt hover:decoration-cobalt">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" rel="noopener" className="font-bold underline decoration-[#b6c4d6] underline-offset-4 hover:text-cobalt hover:decoration-cobalt">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <FieldError id={describe("acceptTerms")}>{err("acceptTerms")}</FieldError>
              </div>
            </section>
          </fieldset>

          <input type="hidden" name="idempotencyKey" value={key} />
          {publishableKey && <input type="hidden" name="checkoutMode" value="embedded" />}
        </form>
      </div>

      {/* Phones: total and the main action stay in reach. */}
      {!locked && (
        <div data-sticky-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e2e7ee] bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(15_32_64/0.18)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center gap-4">
            <p className="shrink-0">
              <span className={`${smallCaps} block text-[#4a5d78]`}>Due today</span>
              <span className="block text-[1.25rem] leading-tight font-bold text-navy tabular-nums">{money(totals.dueTodayMinor)}</span>
            </p>
            <button type="submit" form={formId} className={`${cta} min-h-12! flex-1`} disabled={pending} aria-busy={pending}>
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PlanCompare({ plans, selected, money }: { plans: CheckoutPlan[]; selected: PlanKey; money: (m: number) => string }) {
  const rows: [string, string[]][] = [
    ["Price per month", plans.map((p) => money(p.priceMinor))],
    ...plans[0].facts.map(([label], i): [string, string[]] => [label, plans.map((p) => p.facts[i][1])]),
  ];
  return (
    <div className="mt-2 overflow-x-auto rounded-[14px] border border-[#e2e7ee]">
      <table className="w-full border-collapse text-left text-[0.86rem]">
        <caption className="sr-only">What each plan includes</caption>
        <thead>
          <tr className="bg-[#f7f9fc]">
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Allowance</span>
            </th>
            {plans.map((p) => (
              <th key={p.key} scope="col" className={`px-3 py-3 text-right font-bold sm:px-4 ${p.key === selected ? "text-cobalt" : "text-navy"}`}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values]) => (
            <tr key={label} className="border-t border-[#eef1f5]">
              <th scope="row" className="px-4 py-3 font-semibold text-muted">
                {label}
              </th>
              {values.map((v, i) => (
                <td key={plans[i].key} className={`px-3 py-3 text-right font-bold tabular-nums sm:px-4 ${plans[i].key === selected ? "bg-[#f5f9ff] text-navy" : "text-navy/80"}`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      {children}
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </div>
  );
}
