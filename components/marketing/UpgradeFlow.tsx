"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, CalendarClock, Check, CreditCard, Loader2, Mail } from "lucide-react";
import { confirmUpgrade, previewUpgrade, requestCode, verifyCode, type ChangeRequest } from "@/app/checkout/upgrade/actions";
import { addonPrices } from "@/lib/addons";
import { PLAN_KEYS, formatMoney, planFacts, type LivePlan, type PlanKey, type Pricing } from "@/lib/pricing";
import { RESEND_AFTER_S, type AccountBusiness, type UpgradePreview } from "@/lib/upgrade";
import { AddOnList, PacksAddOn, PlanIcon, SeatsAddOn, SummaryPanel } from "./CheckoutParts";
import { btnGhost, btnPrimary } from "./tw";

type Fail = { ok: false; error: string; expired?: boolean; field?: "email" | "code" };
type Step = { kind: "email" } | { kind: "code"; challengeId: string; expiresAt: string; sentAt: number } | { kind: "change"; businesses: AccountBusiness[] };

const h1 = "text-h2 text-balance max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]";
const input =
  "block min-h-12 w-full rounded-btn! border-[1.5px] border-line bg-white px-3.5 py-3 font-semibold text-navy transition-[border-color] duration-200 " +
  "hover:border-line-strong focus-visible:border-cobalt aria-invalid:border-danger";
const card = "rounded-xl bg-white p-[clamp(20px,3vw,32px)] ring-1 ring-line";
const busyBtn = `${btnPrimary} w-full disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0`;

export function UpgradeFlow({ pricing, initialPlan }: { pricing: Pricing; initialPlan: PlanKey | null }) {
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

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
    <div className="mt-3 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-10">
      <div className="min-w-0">
        {step.kind === "email" ? (
          <EmailStep
            email={email}
            setEmail={setEmail}
            notice={notice}
            headingRef={headingRef}
            onSent={(c) => {
              setNotice(null);
              setStep({ kind: "code", ...c, sentAt: Date.now() });
            }}
          />
        ) : (
          <CodeStep
            key={step.challengeId}
            email={email}
            challenge={step}
            headingRef={headingRef}
            onResent={(c) => setStep({ kind: "code", ...c, sentAt: Date.now() })}
            onBack={() => setStep({ kind: "email" })}
            onVerified={(businesses) => setStep({ kind: "change", businesses })}
            onExpired={restart}
          />
        )}
      </div>
      {target ? <TargetPlan plan={target} currency={pricing.currency} /> : <PlanList plans={pricing.plans} currency={pricing.currency} />}
    </div>
  );
}

function Alert({ children, refEl }: { children: React.ReactNode; refEl?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={refEl}
      tabIndex={-1}
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-danger-line bg-danger-bg px-4 py-3.5 font-bold text-danger-ink [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0"
    >
      <AlertCircle aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function EmailStep({
  email,
  setEmail,
  notice,
  headingRef,
  onSent,
}: {
  email: string;
  setEmail: (v: string) => void;
  notice: string | null;
  headingRef: React.Ref<HTMLHeadingElement>;
  onSent: (c: { challengeId: string; expiresAt: string }) => void;
}) {
  const id = useId();
  const [pending, start] = useTransition();
  const [fail, setFail] = useState<Fail | null>(null);
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className={`${h1} outline-none!`}>
        Upgrade your SideKick plan
      </h1>
      <p className="mt-3 max-w-[56ch] text-lead leading-[1.55]">Enter the email you sign in with. We&apos;ll send a 6-digit code to confirm it&apos;s you.</p>
      <form
        noValidate
        aria-label="Get a sign-in code"
        className={`${card} mt-8 grid gap-5`}
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
        {notice && !fail && <Alert>{notice}</Alert>}
        {fail && !fail.field && <Alert>{fail.error}</Alert>}
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[0.92rem] font-bold">
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
            className={input}
          />
          {fail?.field === "email" && <FieldError id={`${id}-err`}>{fail.error}</FieldError>}
        </div>
        <button type="submit" className={busyBtn} disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Mail aria-hidden />}
          {pending ? "Sending code" : "Send code"}
        </button>
        <p className="text-center text-[0.92rem] text-muted">
          New to SideKick?{" "}
          <Link href="/pricing#plans" className="font-bold text-cobalt underline-offset-4 hover:underline">
            See plans
          </Link>
        </p>
      </form>
    </>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="mt-1.5 flex items-center gap-1.5 text-[0.85rem] font-bold text-danger [&>svg]:size-[15px] [&>svg]:shrink-0">
      <AlertCircle aria-hidden /> {children}
    </span>
  );
}

function minutesLeft(expiresAt: string) {
  const ms = Date.parse(expiresAt) - Date.now();
  return Number.isFinite(ms) && ms > 60_000 ? Math.round(ms / 60_000) : null;
}

function CodeStep({
  email,
  challenge,
  headingRef,
  onResent,
  onBack,
  onVerified,
  onExpired,
}: {
  email: string;
  challenge: { challengeId: string; expiresAt: string; sentAt: number };
  headingRef: React.Ref<HTMLHeadingElement>;
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
  const [minutes] = useState(() => minutesLeft(challenge.expiresAt));

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

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className={`${h1} outline-none!`}>
        Check your email
      </h1>
      <p role="status" className="mt-3 max-w-[56ch] text-lead leading-[1.55]">
        If <strong className="break-all text-navy">{email.trim()}</strong> has a SideKick account, we sent a 6-digit code.
        {minutes ? ` It works for about ${minutes} minutes.` : ""}
      </p>
      <form
        noValidate
        aria-label="Enter your code"
        className={`${card} mt-8 grid gap-5`}
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
      >
        {fail && fail.field !== "code" && <Alert>{fail.error}</Alert>}
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-code`} className="text-[0.92rem] font-bold">
            6-digit code
          </label>
          <input
            ref={inputRef}
            id={`${id}-code`}
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => {
              // Accepts pasted codes with spaces or dashes; submits on the sixth digit.
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(digits);
              if (fail?.field === "code") setFail(null);
              if (digits.length === 6 && digits !== code) verify(digits);
            }}
            aria-invalid={fail?.field === "code"}
            aria-describedby={fail?.field === "code" ? `${id}-err` : undefined}
            className={`${input} max-w-[16rem] text-center text-2xl tracking-[0.4em] tabular-nums`}
          />
          {fail?.field === "code" && <FieldError id={`${id}-err`}>{fail.error}</FieldError>}
        </div>
        <button type="submit" className={busyBtn} disabled={pending || code.length !== 6} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden />}
          {pending ? "Checking code" : "Verify code"}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.92rem]">
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
            className="inline-flex min-h-11 items-center font-bold text-cobalt underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
          >
            {resending ? "Sending a new code" : wait > 0 ? `Send a new code in 0:${String(wait).padStart(2, "0")}` : "Send a new code"}
          </button>
          <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center font-bold text-cobalt underline-offset-4 hover:underline">
            Use a different email
          </button>
        </div>
      </form>
    </>
  );
}

function TargetPlan({ plan, currency }: { plan: LivePlan; currency: string }) {
  return (
    <aside aria-label={`${plan.name} plan`} className="rounded-xl bg-navy p-[clamp(20px,3vw,32px)] text-white lg:mt-[5.5rem]">
      <div className="flex items-center gap-4">
        <PlanIcon planKey={plan.key} className="bg-white/10 text-light-blue" />
        <div>
          <p className="text-2xl font-bold">{plan.name}</p>
          <p className="font-semibold text-navy-soft tabular-nums">{formatMoney(plan.priceMinor!, currency)} per month</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-3">
        {planFacts(plan).map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-navy-soft">{label}</dt>
            <dd className="font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function PlanList({ plans, currency }: { plans: LivePlan[]; currency: string }) {
  return (
    <aside aria-label="Plans" className="rounded-xl bg-canvas p-[clamp(20px,3vw,32px)] lg:mt-[5.5rem]">
      <p className="font-bold">You can change to any plan</p>
      <ul role="list" className="mt-4 grid gap-3">
        {plans.map((p) => (
          <li key={p.key} className="flex items-center gap-4 rounded-lg bg-white p-3">
            <PlanIcon planKey={p.key} className="bg-ice text-cobalt" />
            <span className="min-w-0 flex-1 font-bold">{p.name}</span>
            <span className="font-semibold text-muted tabular-nums">{formatMoney(p.priceMinor!, currency)}/mo</span>
          </li>
        ))}
      </ul>
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

  return (
    <div className="mt-3">
      <h1 ref={headingRef} tabIndex={-1} className={`${h1} outline-none!`}>
        {heading}
      </h1>
      <p className="mt-3 max-w-[60ch] text-lead leading-[1.55]">
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

      <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-10">

        <div className="grid min-w-0 gap-8 lg:col-start-1 lg:row-start-1">
          {businesses.length > 1 && (
            <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
              <legend className="mb-3 text-xl font-bold">Which business?</legend>
              {businesses.map((b) => (
                <label
                  key={b.businessId}
                  className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-xl p-4 transition-[background-color,box-shadow] duration-200 has-focus-visible:outline-2 has-focus-visible:outline-cobalt ${
                    b.businessId === businessId ? "bg-ice/60 ring-2 ring-cobalt" : "bg-white ring-1 ring-line hover:ring-line-strong"
                  }`}
                >
                  <input type="radio" name="business" value={b.businessId} checked={b.businessId === businessId} onChange={() => pickBusiness(b)} className="size-5 shrink-0 accent-cobalt" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold break-words">{b.name}</span>
                    <span className="block text-[0.92rem] text-muted">
                      {b.planName ?? "No plan"}
                      {b.status !== "active" ? ` · ${b.status.replace(/_/g, " ")}` : ""}
                    </span>
                  </span>
                  <PlanIcon planKey={b.planKey} className="bg-ice text-cobalt max-sm:hidden" />
                </label>
              ))}
            </fieldset>
          )}

          {businesses.length === 0 && (
            <div className={card}>
              <p className="font-bold">There&apos;s no business on this account that can be changed here.</p>
              <p className="mt-2 text-muted">Only the owner of a business can change its plan. Ask your business owner, or talk to our sales team.</p>
              <Link href="/contact" className={`${btnGhost} mt-5`}>
                Talk to sales
              </Link>
            </div>
          )}

          {business && (
            <>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="mb-3 text-xl font-bold">Plan</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {pricing.plans.map((p) => {
                    const selected = target?.key === p.key;
                    const isCurrent = p.key === business.planKey;
                    return (
                      <label
                        key={p.key}
                        className={`relative grid cursor-pointer grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-xl p-4 transition-[background-color,box-shadow] duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt sm:grid-cols-[48px_minmax(0,1fr)] sm:items-start ${
                          selected ? "bg-ice/60 ring-2 ring-cobalt" : "bg-white ring-1 ring-line hover:ring-line-strong"
                        }`}
                      >
                        <input type="radio" name="plan" value={p.key} checked={selected} onChange={() => setTargetKey(p.key)} className="sr-only" />
                        <PlanIcon planKey={p.key} className={`row-start-1 ${selected ? "bg-cobalt text-white" : "bg-ice text-cobalt"}`} />
                        <span className="col-start-2 row-start-1 sm:col-span-2 sm:col-start-1 sm:row-start-2">
                          <span className="block text-lg font-bold">{p.name}</span>
                          <span className="block font-semibold text-muted tabular-nums">{formatMoney(p.priceMinor!, pricing.currency)} per month</span>
                        </span>
                        {isCurrent && (
                          <span className="col-start-3 row-start-1 justify-self-end rounded-full bg-canvas px-2.5 py-1 text-[0.8rem] font-bold whitespace-nowrap text-muted sm:col-start-2">
                            Current plan
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {current && target && isPlanChange && <Compare current={current} target={target} id={id} />}

              <section aria-labelledby={`${id}-addons`} className="grid gap-4">
                <h2 id={`${id}-addons`} className="text-xl">
                  Add-ons
                </h2>
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
              </section>
            </>
          )}
        </div>
        <SummaryPanel
          className="lg:col-start-2 lg:row-start-1"
          collapsible={false}
          totalLabel="Charged now"
          total={money(shown?.dueNowMinor ?? 0)}
          busy={preview.kind === "loading"}
          then={
            shown && (
              <>
                Then {money(shown.newMonthlyMinor)} per month{date(shown.renewalAt) ? ` from ${date(shown.renewalAt)}` : ""}
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
            {preview.kind === "idle" && <p className="text-muted">{business ? "Choose a new plan or an add-on to see the price." : "Choose a business first."}</p>}
            {preview.kind === "loading" && !shown && (
              <p className="flex items-center gap-2 text-muted">
                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> Working out the price
              </p>
            )}
            {preview.kind === "error" && <Alert>{preview.error}</Alert>}
            {shown && (
              <>
                {later ? (
                  <p className="flex items-start gap-2.5 text-[0.95rem] [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-cobalt">
                    <CalendarClock aria-hidden />
                    <span>
                      Nothing is charged now. The change takes effect at your next renewal{date(shown.renewalAt) ? ` on ${date(shown.renewalAt)}` : ""}.
                    </span>
                  </p>
                ) : (
                  shown.dueNowMinor > 0 && (
                    <p className="flex items-start gap-2.5 text-[0.95rem] [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-cobalt">
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
                  <ul role="list" className="grid gap-2 rounded-lg bg-(--dev-bg) p-4 text-[0.92rem] text-(--dev)">
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
                  {ctaLabel} <ArrowRight aria-hidden />
                </>
              )}
            </button>
          </div>
        </SummaryPanel>
      </div>
    </div>
  );
}

function Compare({ current, target, id }: { current: LivePlan; target: LivePlan; id: string }) {
  const now = planFacts(current);
  const next = planFacts(target);
  return (
    <section aria-labelledby={`${id}-compare`} className="overflow-hidden rounded-xl bg-white ring-1 ring-line">
      <h2 id={`${id}-compare`} className="sr-only">
        What changes
      </h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-canvas">
            <th scope="col" className="px-4 py-3.5 sm:px-5">
              <span className="sr-only">Allowance</span>
            </th>
            <th scope="col" className="px-3 py-3.5 text-right font-bold text-muted sm:px-5">
              {current.name}
            </th>
            <th scope="col" className="px-4 py-3.5 text-right font-bold text-cobalt sm:px-5">
              {target.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {now.map(([label, value], i) => (
            <tr key={label} className="border-t border-line" /* taste-skill-ignore: a real table */>
              <th scope="row" className="px-4 py-3.5 font-semibold sm:px-5">
                {label}
              </th>
              <td className="px-3 py-3.5 text-right text-muted tabular-nums sm:px-5">{value}</td>
              <td className={`px-4 py-3.5 text-right tabular-nums sm:px-5 ${next[i][1] !== value ? "font-bold text-navy" : "text-muted"}`}>{next[i][1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
