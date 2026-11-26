"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Check, CreditCard, Loader2, LockKeyhole, Mail } from "lucide-react";
import { planCopyByKey } from "@/content/pricing";
import { confirmUpgrade, previewUpgrade, requestCode, verifyCode, type ChangeRequest } from "@/app/checkout/upgrade/actions";
import { addonPrices } from "@/lib/addons";
import { PLAN_KEYS, formatMoney, planFacts, type LivePlan, type PlanKey, type Pricing } from "@/lib/pricing";
import { RESEND_AFTER_S, type AccountBusiness, type UpgradePreview } from "@/lib/upgrade";
import {
  AddOnList,
  Alert,
  FieldError,
  PacksAddOn,
  Pill,
  PlanIcon,
  PlanOption,
  RadioDot,
  SeatsAddOn,
  SectionCard,
  SummaryCard,
  SummaryHead,
  TrustLine,
  cardBase,
  coverInput,
  fieldLabel,
  inputCls,
  optionOff,
  optionOn,
  smallCaps,
} from "./CheckoutParts";
import { btnGhost, btnPrimary } from "./tw";

type Fail = { ok: false; error: string; expired?: boolean; field?: "email" | "code" };
type Step = { kind: "email" } | { kind: "code"; challengeId: string; expiresAt: string; sentAt: number } | { kind: "change"; businesses: AccountBusiness[] };

const busyBtn = `${btnPrimary} w-full disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0`;

export function UpgradeFlow({ pricing, initialPlan }: { pricing: Pricing; initialPlan: PlanKey | null }) {
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  // Each step starts with its heading focused, so keyboard and screen reader users land on the new content.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step.kind]);

  const restart = (message: string) => {
    setNotice(message);
    setStep({ kind: "email" });
  };

  if (step.kind === "change")
    return <ChangeStep pricing={pricing} initialPlan={initialPlan} businesses={step.businesses} headingRef={headingRef} onExpired={restart} />;

  const target = pricing.plans.find((p) => p.key === initialPlan);
  return (
    <>
      {step.kind === "email" ? (
        <PageHeader eyebrow="Existing customers" title="Upgrade your SideKick plan" headingRef={headingRef}>
          <p className="mt-3 text-[1.05rem] leading-normal text-muted">Enter the email you sign in with. We&apos;ll send a 6-digit code to confirm it&apos;s you.</p>
        </PageHeader>
      ) : (
        <PageHeader eyebrow="Existing customers" title="Check your email" headingRef={headingRef}>
          <p role="status" className="mt-3 text-[1.05rem] leading-normal text-muted">
            If <strong className="break-all text-navy">{email.trim()}</strong> has a SideKick account, we sent a 6-digit code.
            {minutes ? ` It works for about ${minutes} minutes.` : ""}
          </p>
        </PageHeader>
      )}
      <div className={gridCls}>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          {step.kind === "email" ? (
            <EmailStep
              email={email}
              setEmail={setEmail}
              notice={notice}
              onSent={(c) => {
                setNotice(null);
                setMinutes(minutesLeft(c.expiresAt));
                setStep({ kind: "code", ...c, sentAt: Date.now() });
              }}
            />
          ) : (
            <CodeStep
              key={step.challengeId}
              email={email}
              challenge={step}
              onResent={(c) => {
                setMinutes(minutesLeft(c.expiresAt));
                setStep({ kind: "code", ...c, sentAt: Date.now() });
              }}
              onBack={() => setStep({ kind: "email" })}
              onVerified={(businesses) => setStep({ kind: "change", businesses })}
              onExpired={restart}
            />
          )}
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          {target ? <TargetPlan plan={target} currency={pricing.currency} /> : <PlanList plans={pricing.plans} currency={pricing.currency} />}
        </div>
      </div>
    </>
  );
}

const gridCls = "mt-8 grid items-start gap-5 lg:mt-10 lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-8";

function PageHeader({ eyebrow, title, headingRef, children }: { eyebrow: string; title: string; headingRef: React.Ref<HTMLHeadingElement>; children?: React.ReactNode }) {
  return (
    <header className="max-w-[46rem]">
      <p className={`${smallCaps} flex items-center gap-1.5 text-cobalt`}>
        <LockKeyhole aria-hidden className="size-3.5" strokeWidth={2.4} /> {eyebrow}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-[clamp(2rem,1.45rem+2.2vw,3.1rem)] leading-[1.08] font-bold tracking-[-0.025em] text-balance text-navy outline-none!">
        {title}
        <span aria-hidden className="ml-1.5 inline-block size-2.5 rounded-full bg-cobalt align-baseline sm:size-3" />
      </h1>
      {children}
    </header>
  );
}

function EmailStep({
  email,
  setEmail,
  notice,
  onSent,
}: {
  email: string;
  setEmail: (v: string) => void;
  notice: string | null;
  onSent: (c: { challengeId: string; expiresAt: string }) => void;
}) {
  const id = useId();
  const [pending, start] = useTransition();
  const [fail, setFail] = useState<Fail | null>(null);
  return (
    <form
      noValidate
      aria-label="Get a sign-in code"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        start(async () => {
          const r = await requestCode(email);
          if (r.ok) onSent(r);
          else setFail(r);
        });
      }}
    >
      <SectionCard n="01" id={`${id}-title`} title="Confirm it's you" subtitle="One code, no password needed. It only works for the owner of the account.">
        <div className="grid gap-5">
          {notice && !fail && <Alert>{notice}</Alert>}
          {fail && !fail.field && <Alert>{fail.error}</Alert>}
          <div className="grid gap-2">
            <label htmlFor={`${id}-email`} className={fieldLabel}>
              Email
            </label>
            <input
              id={`${id}-email`}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              maxLength={254}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fail?.field === "email"}
              aria-describedby={fail?.field === "email" ? `${id}-err` : undefined}
              className={inputCls}
            />
            {fail?.field === "email" && <FieldError id={`${id}-err`}>{fail.error}</FieldError>}
          </div>
          <button type="submit" className={busyBtn} disabled={pending} aria-busy={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Mail aria-hidden />}
            {pending ? "Sending code" : "Send code"}
          </button>
          <p className="text-center text-[0.9rem] text-muted">
            New to SideKick?{" "}
            <Link href="/pricing#plans" className="font-bold text-cobalt underline-offset-4 hover:underline">
              See plans
            </Link>
          </p>
        </div>
      </SectionCard>
    </form>
  );
}

function minutesLeft(expiresAt: string) {
  const ms = Date.parse(expiresAt) - Date.now();
  return Number.isFinite(ms) && ms > 60_000 ? Math.round(ms / 60_000) : null;
}

/** Six boxes over one real input (one-time-code autofill, paste and screen readers all see a single field). */
function CodeBoxes({ inputRef, id, code, invalid, ...input }: { inputRef: React.Ref<HTMLInputElement>; id: string; code: string; invalid: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative w-fit">
      <div aria-hidden className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && (i === Math.min(code.length, 5));
          return (
            <span
              key={i}
              className={`grid h-14 w-11 place-items-center rounded-[12px] border bg-white text-[1.5rem] font-bold text-navy tabular-nums transition-[border-color,box-shadow] duration-150 sm:h-16 sm:w-13 ${
                invalid ? "border-danger" : active ? "border-cobalt shadow-[0_0_0_4px_rgb(0_98_253/0.14)]" : code[i] ? "border-[#b6c4d6]" : "border-[#d7dee8]"
              }`}
            >
              {code[i] ?? ""}
            </span>
          );
        })}
      </div>
      <input
        ref={inputRef}
        id={id}
        {...input}
        value={code}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={invalid}
        className="absolute inset-0 size-full rounded-[12px]! border-0! bg-transparent text-transparent caret-transparent shadow-none! outline-none! selection:bg-transparent"
      />
    </div>
  );
}

function CodeStep({
  email,
  challenge,
  onResent,
  onBack,
  onVerified,
  onExpired,
}: {
  email: string;
  challenge: { challengeId: string; expiresAt: string; sentAt: number };
  onResent: (c: { challengeId: string; expiresAt: string }) => void;
  onBack: () => void;
  onVerified: (b: AccountBusiness[]) => void;
  onExpired: (message: string) => void;
}) {
  const id = useId();
  const [code, setCode] = useState("");
  const [fail, setFail] = useState<Fail | null>(null);
  const [pending, start] = useTransition();
  const [resending, startResend] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const wait = Math.max(0, RESEND_AFTER_S - Math.floor((now - challenge.sentAt) / 1000));

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [wait, now]);

  const verify = (value: string) => {
    if (pending) return;
    start(async () => {
      const r = await verifyCode(challenge.challengeId, value);
      if (r.ok) return onVerified(r.businesses);
      if (r.expired) return onExpired(r.error);
      setFail(r);
      inputRef.current?.select();
    });
  };

  const link = "inline-flex min-h-11 items-center font-bold text-cobalt underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline";
  return (
    <form
      noValidate
      aria-label="Enter your code"
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
    >
      <SectionCard n="02" id={`${id}-title`} title="Enter your code" subtitle="It arrives within a minute. Check spam if you don't see it.">
        <div className="grid gap-5">
          {fail && fail.field !== "code" && <Alert>{fail.error}</Alert>}
          <div className="grid gap-2.5">
            <label htmlFor={`${id}-code`} className={fieldLabel}>
              6-digit code
            </label>
            <CodeBoxes
              inputRef={inputRef}
              id={`${id}-code`}
              code={code}
              invalid={fail?.field === "code"}
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              autoFocus
              onChange={(e) => {
                // Accepts pasted codes with spaces or dashes; submits on the sixth digit.
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                if (fail?.field === "code") setFail(null);
                if (digits.length === 6 && digits !== code) verify(digits);
              }}
              aria-describedby={fail?.field === "code" ? `${id}-err` : undefined}
            />
            {fail?.field === "code" && <FieldError id={`${id}-err`}>{fail.error}</FieldError>}
          </div>
          <button type="submit" className={busyBtn} disabled={pending || code.length !== 6} aria-busy={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden />}
            {pending ? "Checking code" : "Verify code"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.9rem]">
            <button
              type="button"
              disabled={wait > 0 || resending}
              onClick={() =>
                startResend(async () => {
                  const r = await requestCode(email);
                  if (r.ok) {
                    setCode("");
                    setFail(null);
                    onResent(r);
                  } else setFail({ ok: false, error: r.error });
                })
              }
              className={link}
            >
              {resending ? "Sending a new code" : wait > 0 ? `Send a new code in 0:${String(wait).padStart(2, "0")}` : "Send a new code"}
            </button>
            <button type="button" onClick={onBack} className={link}>
              Use a different email
            </button>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

function TargetPlan({ plan, currency }: { plan: LivePlan; currency: string }) {
  return (
    <aside aria-label={`${plan.name} plan`} className={`${cardBase} p-6 sm:p-7 lg:sticky lg:top-[calc(var(--header-h)+24px)]`}>
      <p className={`${smallCaps} mb-4 text-[#4a5d78]`}>Selected plan</p>
      <SummaryHead planKey={plan.key} title={`${plan.name} plan`} sub={`${formatMoney(plan.priceMinor!, currency)} per month`} />
      <dl className="mt-5 grid gap-2.5 border-t border-[#e8ecf2] pt-5 text-[0.88rem]">
        {planFacts(plan).map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-bold text-navy tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <TrustLine className="mt-6 border-t border-[#e8ecf2] pt-5" />
    </aside>
  );
}

function PlanList({ plans, currency }: { plans: LivePlan[]; currency: string }) {
  return (
    <aside aria-label="Plans" className={`${cardBase} p-6 sm:p-7 lg:sticky lg:top-[calc(var(--header-h)+24px)]`}>
      <p className={`${smallCaps} text-[#4a5d78]`}>You can change to any plan</p>
      <ul role="list" className="mt-4 grid gap-3">
        {plans.map((p) => (
          <li key={p.key} className="flex items-center gap-3.5">
            <PlanIcon planKey={p.key} size="sm" />
            <span className="min-w-0 flex-1 font-bold text-navy">{p.name}</span>
            <span className="font-bold text-navy tabular-nums">
              {formatMoney(p.priceMinor!, currency)}
              <span className="text-[0.85rem] font-semibold text-muted">/mo</span>
            </span>
          </li>
        ))}
      </ul>
      <TrustLine className="mt-6 border-t border-[#e8ecf2] pt-5" />
    </aside>
  );
}

type PreviewState = { kind: "idle" } | { kind: "loading"; last?: UpgradePreview } | { kind: "ready"; preview: UpgradePreview } | { kind: "error"; error: string };

const rank = (k: string | null) => PLAN_KEYS.indexOf(k as PlanKey);

function ChangeStep({
  pricing,
  initialPlan,
  businesses,
  headingRef,
  onExpired,
}: {
  pricing: Pricing;
  initialPlan: PlanKey | null;
  businesses: AccountBusiness[];
  headingRef: React.Ref<HTMLHeadingElement>;
  onExpired: (message: string) => void;
}) {
  const id = useId();
  const [businessId, setBusinessId] = useState(businesses.length === 1 ? businesses[0].businessId : "");
  const business = businesses.find((b) => b.businessId === businessId) ?? null;
  const current = pricing.plans.find((p) => p.key === business?.planKey) ?? null;
  const [targetKey, setTargetKey] = useState<PlanKey | null>(initialPlan);
  const target = pricing.plans.find((p) => p.key === (targetKey ?? business?.planKey)) ?? null;
  const [seats, setSeats] = useState(business?.extraSeats ?? 0);
  const [packs, setPacks] = useState(0);
  const [preview, setPreview] = useState<PreviewState>({ kind: "idle" });
  const [confirming, startConfirm] = useTransition();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const seq = useRef(0);

  const req: ChangeRequest | null = business
    ? {
        businessId: business.businessId,
        planKey: target && target.key !== business.planKey ? target.key : null,
        extraSeats: seats !== business.extraSeats ? seats : null,
        creditPacks: packs || null,
      }
    : null;
  const changed = !!req && (!!req.planKey || req.extraSeats !== null || !!req.creditPacks);
  const reqKey = JSON.stringify(req);
  // One Idempotency-Key per exact change, so a double click or retry never applies it twice.
  const [confirmKey, setConfirmKey] = useState(() => crypto.randomUUID());
  const [keyFor, setKeyFor] = useState(reqKey);
  if (keyFor !== reqKey) {
    setKeyFor(reqKey);
    setConfirmKey(crypto.randomUUID());
  }

  useEffect(() => {
    const n = ++seq.current;
    if (!changed || !req) {
      setPreview({ kind: "idle" });
      return;
    }
    setPreview((p) => ({ kind: "loading", last: p.kind === "ready" ? p.preview : p.kind === "loading" ? p.last : undefined }));
    const t = setTimeout(async () => {
      const r = await previewUpgrade(req).catch((): Fail => ({ ok: false, error: "Something went wrong on our side. Please try again in a moment." }));
      if (n !== seq.current) return;
      if (r.ok) setPreview({ kind: "ready", preview: r.preview });
      else if (r.expired) onExpired(r.error);
      else setPreview({ kind: "error", error: r.error });
    }, 350);
    return () => clearTimeout(t);
    // reqKey captures every field of req.
  }, [reqKey]);

  const pickBusiness = (b: AccountBusiness) => {
    setBusinessId(b.businessId);
    setSeats(b.extraSeats);
  };

  const shown = preview.kind === "ready" ? preview.preview : preview.kind === "loading" ? preview.last : undefined;
  const money = (m: number) => formatMoney(m, shown?.currency ?? pricing.currency);
  const isUpgrade = !!current && !!target && rank(target.key) > rank(current.key);
  const isPlanChange = !!current && !!target && target.key !== current.key;
  const heading = !businesses.length
    ? "No business to change"
    : !business
    ? "Choose a business"
    : !current
      ? `Change the plan for ${business.name}`
      : isPlanChange
        ? `You're on ${current.name} — ${isUpgrade ? "upgrade" : "switch"} to ${target!.name}`
        : `You're on ${current.name}`;

  const date = (iso: string | null | undefined) => {
    const t = iso ? Date.parse(iso) : NaN;
    return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
  };
  const brand = (b: string) => b.charAt(0).toUpperCase() + b.slice(1);

  const confirm = () =>
    req &&
    shown &&
    startConfirm(async () => {
      setConfirmError(null);
      const r = await confirmUpgrade(req, confirmKey);
      if (r.ok) return window.location.assign(`/checkout/upgrade/complete?change=${encodeURIComponent(r.changeId)}`);
      if (r.expired) return onExpired(r.error);
      setConfirmError(r.error);
    });

  const later = shown?.effective === "next_renewal";
  const ctaLabel = !shown ? "Confirm change" : later ? "Schedule change" : shown.dueNowMinor > 0 ? `Pay ${money(shown.dueNowMinor)} now` : "Confirm change";

  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <>
      <PageHeader eyebrow="Existing customers" title={heading} headingRef={headingRef}>
        <p className="mt-3 text-[1.05rem] leading-normal text-muted">
          {business ? (
            <>
              Changes for <strong className="text-navy">{business.name}</strong>. Upgrades are charged now and take effect as soon as the payment succeeds.
            </>
          ) : businesses.length ? (
            "Your email is linked to more than one business. Choose the one to change."
          ) : (
            "You're signed in, but there's nothing on this account to change here."
          )}
        </p>
      </PageHeader>

      <div className={gridCls}>
        <div className="grid min-w-0 gap-5 lg:col-start-1 lg:row-start-1">
          {businesses.length > 1 && (
            <SectionCard n={num()} id={`${id}-biz`} title="Which business?" subtitle="Your email owns more than one. Plans are per business.">
              <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
                <legend className="sr-only">Business</legend>
                {businesses.map((b) => {
                  const on = b.businessId === businessId;
                  return (
                    <label
                      key={b.businessId}
                      className={`relative flex min-h-16 cursor-pointer items-center gap-4 rounded-[16px] border p-4 transition-[border-color,background-color,box-shadow] duration-150 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt ${on ? optionOn : optionOff}`}
                    >
                      <input type="radio" name="business" value={b.businessId} checked={on} onChange={() => pickBusiness(b)} className={coverInput} />
                      <PlanIcon planKey={b.planKey} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold break-words text-navy">{b.name}</span>
                        <span className="block text-[0.86rem] text-muted">
                          {b.planName ?? "No plan"}
                          {b.status !== "active" ? ` · ${b.status.replace(/_/g, " ")}` : ""}
                        </span>
                      </span>
                      <RadioDot checked={on} />
                    </label>
                  );
                })}
              </fieldset>
            </SectionCard>
          )}

          {businesses.length === 0 && (
            <SectionCard id={`${id}-none`} title="Nothing to change here" subtitle="Only the owner of a business can change its plan.">
              <p className="text-muted">Ask your business owner, or talk to our sales team.</p>
              <Link href="/contact" className={`${btnGhost} mt-5`}>
                Talk to sales
              </Link>
            </SectionCard>
          )}

          {business && (
            <>
              <SectionCard n={num()} id={`${id}-plan`} title="Choose your plan" subtitle="Upgrades unlock as soon as the payment succeeds. Lower plans start at your renewal.">
                <fieldset className="m-0 min-w-0 border-0 p-0">
                  <legend className="sr-only">Plan</legend>
                  <div className="grid gap-3 md:grid-cols-3">
                    {pricing.plans.map((p) => (
                      <PlanOption
                        key={p.key}
                        name="plan"
                        plan={{ key: p.key, name: p.name, tagline: planCopyByKey[p.key].tagline, price: formatMoney(p.priceMinor!, pricing.currency) }}
                        checked={target?.key === p.key}
                        onChange={() => setTargetKey(p.key)}
                        note={p.key === business.planKey ? { text: "Current plan", tone: "quiet" } : null}
                      />
                    ))}
                  </div>
                </fieldset>
                {current && target && isPlanChange && <Compare current={current} target={target} id={id} />}
              </SectionCard>

              <SectionCard n={num()} id={`${id}-addons`} title="Add-ons" badge={<Pill tone="quiet">Optional</Pill>} subtitle="Extra seats renew monthly. Credit packs are one-time.">
                <AddOnList>
                  {target && (
                    <SeatsAddOn
                      prices={addonPrices(pricing, target)}
                      currency={pricing.currency}
                      value={seats}
                      base={business.extraSeats}
                      onChange={setSeats}
                      note={`You have ${business.extraSeats.toLocaleString("en-US")} extra now. ${target.name} includes ${target.teamMembers.toLocaleString("en-US")} team members.`}
                    />
                  )}
                  {target && <PacksAddOn prices={addonPrices(pricing, target)} currency={pricing.currency} value={packs} onChange={setPacks} />}
                </AddOnList>
              </SectionCard>
            </>
          )}
        </div>
        <SummaryCard
          className="lg:col-start-2 lg:row-start-1"
          collapsible={false}
          head={
            target && business ? (
              <SummaryHead planKey={target.key} title={`${target.name} plan`} sub={`For ${business.name}`} badge={isPlanChange ? (isUpgrade ? "Upgrade" : "Change") : "Monthly"} />
            ) : undefined
          }
          totalLabel="Charged now"
          total={money(shown?.dueNowMinor ?? 0)}
          busy={preview.kind === "loading"}
          then={
            shown && (
              <>
                then {money(shown.newMonthlyMinor)}/month{date(shown.renewalAt) ? ` from ${date(shown.renewalAt)}` : ""}
              </>
            )
          }
          lines={(shown?.lines ?? []).map((l, i) => ({
            key: `${i}-${l.label}`,
            label: l.label,
            amount: l.amountMinor < 0 ? `−${money(-l.amountMinor)}` : money(l.amountMinor),
          }))}
        >
          <div className="mt-5 grid gap-4">
            {preview.kind === "idle" && <p className="text-[0.9rem] text-muted">{business ? "Choose a new plan or an add-on to see the price." : "Choose a business first."}</p>}
            {preview.kind === "loading" && !shown && (
              <p className="flex items-center gap-2 text-[0.9rem] text-muted">
                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> Working out the price
              </p>
            )}
            {preview.kind === "error" && <Alert>{preview.error}</Alert>}
            {shown && (
              <>
                {later ? (
                  <p className={noteCls}>
                    <CalendarClock aria-hidden />
                    <span>
                      Nothing is charged now. The change takes effect at your next renewal{date(shown.renewalAt) ? ` on ${date(shown.renewalAt)}` : ""}.
                    </span>
                  </p>
                ) : (
                  shown.dueNowMinor > 0 && (
                    <p className={noteCls}>
                      <CreditCard aria-hidden />
                      <span>
                        Charged now: <strong className="tabular-nums">{money(shown.dueNowMinor)}</strong>
                        {shown.paymentMethod ? (
                          <>
                            {" "}
                            to {brand(shown.paymentMethod.brand)} •••• {shown.paymentMethod.last4}
                          </>
                        ) : null}{" "}
                        — unlocks as soon as payment succeeds.
                      </span>
                    </p>
                  )
                )}
                {shown.warnings.length > 0 && (
                  <ul role="list" className="grid gap-2 rounded-[14px] bg-(--dev-bg) p-4 text-[0.88rem] text-(--dev)">
                    {shown.warnings.map((w) => (
                      <li key={w.code + w.message} className="flex items-start gap-2.5 font-semibold [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0">
                        <AlertTriangle aria-hidden /> {w.message}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {confirmError && <Alert>{confirmError}</Alert>}
            <button type="button" onClick={confirm} className={busyBtn} disabled={!shown || preview.kind !== "ready" || confirming} aria-busy={confirming}>
              {confirming ? (
                <>
                  <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> Confirming
                </>
              ) : (
                <>
                  {later ? <CalendarClock aria-hidden /> : <LockKeyhole aria-hidden />} {ctaLabel}
                </>
              )}
            </button>
          </div>
          <TrustLine className="mt-5" />
        </SummaryCard>
      </div>
    </>
  );
}

const noteCls = "flex items-start gap-2.5 text-[0.9rem] leading-normal text-navy [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-cobalt";

function Compare({ current, target, id }: { current: LivePlan; target: LivePlan; id: string }) {
  const now = planFacts(current);
  const next = planFacts(target);
  return (
    <section aria-labelledby={`${id}-compare`} className="mt-5">
      <h3 id={`${id}-compare`} className={`${smallCaps} mb-2.5 text-[#4a5d78]`}>
        What changes
      </h3>
      <div className="overflow-x-auto rounded-[14px] border border-[#e2e7ee]">
        <table className="w-full border-collapse text-left text-[0.88rem]">
          <thead>
            <tr className="bg-[#f7f9fc]">
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Allowance</span>
              </th>
              <th scope="col" className="px-3 py-3 text-right font-bold text-muted sm:px-4">
                {current.name}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold text-cobalt">
                {target.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {now.map(([label, value], i) => (
              <tr key={label} className="border-t border-[#eef1f5]">
                <th scope="row" className="px-4 py-3 font-semibold text-muted">
                  {label}
                </th>
                <td className="px-3 py-3 text-right text-muted tabular-nums sm:px-4">{value}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${next[i][1] !== value ? "bg-[#f5f9ff] font-bold text-navy" : "text-muted"}`}>{next[i][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
