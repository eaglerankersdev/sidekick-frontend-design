"use client";

import { useId, useState } from "react";
import { AlertCircle, Building2, ChevronDown, LockKeyhole, Minus, Plus, Sparkles, Sprout, TrendingUp, UsersRound, type LucideIcon } from "lucide-react";
import { ADDON_LIMITS, type AddonPrices } from "@/lib/addons";
import { formatMoney, type PlanKey } from "@/lib/pricing";
import { cardBase, optionOff, optionOn, smallCaps } from "./checkout-styles";

export { cardBase, fieldLabel, inputCls, optionOff, optionOn, pageBg, smallCaps } from "./checkout-styles";

/*
 * The checkout card system (public checkout + existing-customer upgrade): white section cards with a ghost step number on a
 * cool neutral page, a sticky white summary card, small-caps field labels. Motion is limited to colour/border changes.
 */

/** One icon and one tint per plan, used wherever a plan is named in checkout and upgrade. */
export const PLAN_ICONS: Record<PlanKey, LucideIcon> = { basic: Sprout, growth: TrendingUp, enterprise: Building2 };
const PLAN_TINTS: Record<PlanKey, string> = {
  basic: "bg-[#e3f4ec] text-[#0b7451]",
  growth: "bg-ice text-cobalt",
  enterprise: "bg-[#fbefd9] text-[#93560a]",
};

export function PlanIcon({ planKey, size = "md", className = "" }: { planKey: string | null; size?: "sm" | "md"; className?: string }) {
  const key = planKey && planKey in PLAN_ICONS ? (planKey as PlanKey) : null;
  const Icon = key ? PLAN_ICONS[key] : Sprout;
  const dims = size === "sm" ? "size-10 rounded-[11px] [&>svg]:size-5" : "size-11 rounded-[12px] [&>svg]:size-[22px]";
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center [&>svg]:stroke-[1.9] ${dims} ${key ? PLAN_TINTS[key] : "bg-[#eef2f7] text-[#4a5d78]"} ${className}`}>
      <Icon />
    </span>
  );
}

/** A white section card with a faint step number in the corner. */
export function SectionCard({
  n,
  title,
  subtitle,
  badge,
  id,
  children,
  className = "",
  headingRef,
}: {
  n?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  id: string;
  children: React.ReactNode;
  className?: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <section aria-labelledby={id} className={`${cardBase} p-8 max-sm:px-5 max-sm:pt-6 max-sm:pb-6 ${className}`}>
      {n && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-5 right-7 text-[72px] leading-[0.8] font-bold tracking-[-0.05em] text-navy/[.06] tabular-nums select-none max-sm:top-5 max-sm:right-5 max-sm:text-[48px]"
        >
          {n}
        </span>
      )}
      <header className={n ? "pr-20 max-sm:pr-14" : ""}>
        <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined} id={id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[1.3rem] leading-tight font-bold text-navy outline-none!">
          {title}
          {badge}
        </h2>
        {subtitle && <p className="mt-1.5 text-[0.95rem] leading-normal text-muted">{subtitle}</p>}
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Pill({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "quiet" }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[0.68rem] leading-none font-bold tracking-[0.08em] whitespace-nowrap uppercase ${
        tone === "accent" ? "text-cobalt ring-1 ring-cobalt/30 ring-inset" : "bg-[#eef2f7] text-[#4a5d78]"
      }`}
    >
      {children}
    </span>
  );
}

/** A real radio stretched invisibly over its whole option card: any click or tap on the card hits it. */
export const coverInput = "absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-[16px] opacity-0 disabled:cursor-not-allowed";

/** The radio look used by option cards (the real input is visually hidden inside the card's label). */
export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-150 ${checked ? "border-cobalt bg-cobalt" : "border-[#c3cddb] bg-white"}`}
    >
      <span className={`size-2 rounded-full bg-white transition-opacity duration-150 ${checked ? "opacity-100" : "opacity-0"}`} />
    </span>
  );
}

export type PlanOptionData = { key: PlanKey; name: string; tagline: string; price: string; featured?: boolean };

/** A plan radio card: icon tile, name, tagline and price; stacked rows on phones, three across from md up. */
export function PlanOption({
  plan,
  name,
  checked,
  onChange,
  note,
}: {
  plan: PlanOptionData;
  name: string;
  checked: boolean;
  onChange: () => void;
  /** A small badge on the top edge, e.g. "Most popular" or "Current plan". */
  note?: { text: string; tone: "accent" | "quiet" } | null;
}) {
  return (
    <label
      className={`relative grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 rounded-[16px] border p-4 transition-[border-color,background-color,box-shadow] duration-150 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt has-disabled:cursor-not-allowed md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_1fr] md:items-start md:p-5 ${
        checked ? optionOn : optionOff
      }`}
    >
      <input type="radio" name={name} value={plan.key} checked={checked} onChange={onChange} className={coverInput} />
      {note && (
        <span
          className={`absolute -top-2.5 right-4 inline-flex h-5 items-center rounded-full px-2 text-[0.62rem] leading-none font-bold tracking-[0.09em] uppercase ${
            note.tone === "accent" ? "bg-cobalt text-white" : "bg-navy text-white"
          }`}
        >
          {note.text}
        </span>
      )}
      <PlanIcon planKey={plan.key} className="col-start-1 row-start-1" />
      <span className="col-start-3 row-start-1 md:col-start-2">
        <RadioDot checked={checked} />
      </span>
      <span className="col-start-2 row-start-1 flex min-w-0 flex-col self-stretch max-md:justify-center md:col-span-2 md:col-start-1 md:row-start-2">
        <span className="block text-[1.05rem] leading-tight font-bold text-navy">{plan.name}</span>
        <span className="mt-1 block text-[0.86rem] leading-snug text-muted">{plan.tagline}</span>
        <span className="mt-2.5 block text-[1.05rem] font-bold text-navy tabular-nums md:mt-auto md:pt-4">
          {plan.price}
          <span className="text-[0.85rem] font-semibold text-muted">/mo</span>
        </span>
      </span>
    </label>
  );
}

const count = (n: number) => n.toLocaleString("en-US");

/** A 0…max quantity with 44px buttons; the number can also be typed. */
export function Stepper({ name, value, max, onChange, label, unit }: { name?: string; value: number; max: number; onChange: (n: number) => void; label: string; unit: string }) {
  const id = useId();
  const btn =
    "grid size-11 place-items-center rounded-[10px] text-navy transition-colors duration-150 hover:bg-[#eef3fa] hover:text-cobalt disabled:cursor-not-allowed disabled:text-[#c3cddb] disabled:hover:bg-transparent [&>svg]:size-4";
  return (
    <div className="inline-flex w-fit items-center rounded-[12px] border border-[#d7dee8] bg-white transition-[border-color,box-shadow] focus-within:border-cobalt focus-within:shadow-[0_0_0_4px_rgb(0_98_253/0.14)]">
      <button type="button" className={btn} aria-label={`Remove one ${unit}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
        <Minus aria-hidden strokeWidth={2.4} />
      </button>
      <input
        id={id}
        name={name}
        aria-label={label}
        aria-describedby={`${id}-range`}
        inputMode="numeric"
        autoComplete="off"
        value={String(value)}
        onChange={(e) => onChange(Math.min(max, Number(e.target.value.replace(/\D/g, "").slice(0, 3) || 0)))}
        onFocus={(e) => e.target.select()}
        className="h-11 w-9 border-0! bg-transparent p-0 text-center text-[1.02rem] font-bold text-navy tabular-nums shadow-none! disabled:text-[#5b6b82]"
      />
      <span id={`${id}-range`} className="sr-only">
        From 0 to {max}
      </span>
      <button type="button" className={btn} aria-label={`Add one ${unit}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus aria-hidden strokeWidth={2.4} />
      </button>
    </div>
  );
}

/** On/off control with a 44px hit area. */
export function Switch({ name, checked, onChange, labelledBy, describedBy }: { name: string; checked: boolean; onChange: (v: boolean) => void; labelledBy: string; describedBy?: string }) {
  return (
    <label className="relative inline-flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center has-disabled:cursor-not-allowed">
      <input
        type="checkbox"
        role="switch"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className="h-7 w-12 rounded-full bg-[#cfd8e4] transition-colors duration-200 peer-checked:bg-cobalt peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt"
      />
      <span aria-hidden className="pointer-events-none absolute left-2 size-5 rounded-full bg-white shadow-[0_1px_2px_rgb(15_32_64/0.25)] transition-transform duration-200 ease-out peer-checked:translate-x-5 motion-reduce:transition-none" />
    </label>
  );
}

function AddOnRow({
  active,
  tile,
  titleId,
  title,
  description,
  descriptionId,
  price,
  control,
}: {
  active: boolean;
  tile: React.ReactNode;
  titleId?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  descriptionId?: string;
  price: React.ReactNode;
  control: React.ReactNode;
}) {
  return (
    <li
      className={`grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-[16px] border p-4 transition-[border-color,background-color,box-shadow] duration-150 sm:grid-cols-[44px_minmax(0,1fr)_auto_auto] sm:px-5 ${
        active ? optionOn : "border-[#dfe5ee] bg-white"
      }`}
    >
      {tile}
      <div className="min-w-0">
        <h3 id={titleId} className="text-[1rem] leading-snug font-bold text-navy">
          {title}
        </h3>
        <p id={descriptionId} className="mt-0.5 text-[0.86rem] leading-snug text-muted">
          {description}
        </p>
      </div>
      <div className="col-start-2 flex items-center justify-between gap-3 sm:contents">
        <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[0.8rem] font-bold whitespace-nowrap text-cobalt tabular-nums ring-1 ring-cobalt/25 ring-inset">
          {price}
        </span>
        {control}
      </div>
    </li>
  );
}

function Tile({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-[12px] [&>svg]:size-[22px] [&>svg]:stroke-[1.9] ${className}`}>
      {children}
    </span>
  );
}

export function SeatsAddOn({ prices, currency, value, base = 0, onChange, note }: { prices: AddonPrices; currency: string; value: number; base?: number; onChange: (n: number) => void; note: React.ReactNode }) {
  if (prices.seatMinor === null) return null;
  return (
    <AddOnRow
      active={value !== base}
      tile={
        <Tile className="bg-[#e3f4ec] text-[#0b7451]">
          <UsersRound />
        </Tile>
      }
      title="Extra team members"
      description={note}
      price={`+${formatMoney(prices.seatMinor, currency)}/mo each`}
      control={<Stepper name="extraSeats" value={value} max={ADDON_LIMITS.extraSeats} onChange={onChange} label="Extra team members" unit="team member" />}
    />
  );
}

export function PacksAddOn({ prices, currency, value, onChange }: { prices: AddonPrices; currency: string; value: number; onChange: (n: number) => void }) {
  if (!prices.pack) return null;
  return (
    <AddOnRow
      active={value > 0}
      tile={
        <Tile className="bg-ice text-cobalt">
          <Sparkles />
        </Tile>
      }
      title="AI credit packs"
      description="One-time. Added to the current billing cycle."
      price={`+${formatMoney(prices.pack.priceMinor, currency)} per ${count(prices.pack.credits)}`}
      control={<Stepper name="creditPacks" value={value} max={ADDON_LIMITS.creditPacks} onChange={onChange} label="AI credit packs" unit="credit pack" />}
    />
  );
}

export function CallRailAddOn({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <AddOnRow
      active={checked}
      tile={
        <Tile className="border border-[#e2e7ee] bg-white">
          {/* Official CallRail mark (callrail.com favicon). */}
          <img src="/brands/callrail-mark.png" alt="" width={24} height={24} className="size-6" />
        </Tile>
      }
      titleId={`${id}-title`}
      title="CallRail call tracking"
      descriptionId={`${id}-body`}
      description="After checkout we'll help you connect your CallRail account."
      price="Free · billed by CallRail"
      control={<Switch name="callRail" checked={checked} onChange={onChange} labelledBy={`${id}-title`} describedBy={`${id}-body`} />}
    />
  );
}

export function AddOnList({ children }: { children: React.ReactNode }) {
  return (
    <ul role="list" className="grid gap-3">
      {children}
    </ul>
  );
}

/** Official marks: Stripe wordmark and the card brands Stripe accepts here. Same height everywhere. */
export function StripeMark({ className = "h-[22px]" }: { className?: string }) {
  return <img src="/brands/stripe.svg" alt="Stripe" width={360} height={150} className={`w-auto ${className}`} />;
}

const CARDS = [
  ["visa", "Visa"],
  ["mastercard", "Mastercard"],
  ["amex", "American Express"],
  ["discover", "Discover"],
] as const;

export function CardLogos({ className = "", size = "h-6" }: { className?: string; size?: string }) {
  return (
    <ul role="list" aria-label="Cards accepted" className={`flex items-center gap-1.5 ${className}`}>
      {CARDS.map(([file, name]) => (
        <li key={file}>
          <img src={`/brands/${file}.svg`} alt={name} width={780} height={500} className={`w-auto rounded-[4px] ring-1 ring-[#e2e7ee] ${size}`} />
        </li>
      ))}
    </ul>
  );
}

export function TrustLine({ className = "" }: { className?: string }) {
  return (
    <div className={`grid justify-items-center gap-2.5 ${className}`}>
      <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted">
        <LockKeyhole aria-hidden className="size-3.5" /> Trusted payments · Secured by <StripeMark className="h-[17px] translate-y-px" />
      </p>
      <CardLogos size="h-5" />
    </div>
  );
}

export function Alert({ children, refEl }: { children: React.ReactNode; refEl?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={refEl}
      tabIndex={-1}
      role="alert"
      className="flex items-start gap-2.5 rounded-[14px] border border-danger-line bg-danger-bg px-4 py-3.5 font-bold text-danger-ink outline-none! [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0"
    >
      <AlertCircle aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <span id={id} className="mt-1 flex items-center gap-1.5 text-[0.85rem] font-bold text-danger [&>svg]:size-[15px] [&>svg]:shrink-0">
      <AlertCircle aria-hidden /> {children}
    </span>
  );
}

export type SummaryLine = { key: string; label: string; detail?: string; amount: string; note?: string };

/**
 * The order summary card: sticky beside the form on desktop; on phones a collapsible "Order · total" bar under the title
 * (unless it holds the page's main action). Totals are announced politely.
 */
export function SummaryCard({
  head,
  facts,
  lines,
  totalLabel,
  total,
  then,
  busy,
  children,
  collapsible = true,
  className = "",
}: {
  head?: React.ReactNode;
  facts?: [string, string][];
  lines: SummaryLine[];
  totalLabel: string;
  total: string;
  then?: React.ReactNode;
  busy?: boolean;
  children?: React.ReactNode;
  collapsible?: boolean;
  className?: string;
}) {
  const [toggled, setOpen] = useState(false);
  const open = toggled || !collapsible;
  const id = useId();
  const rule = "border-t border-[#e8ecf2]";
  return (
    <aside aria-label="Order summary" className={`${cardBase} lg:sticky lg:top-[calc(var(--header-h)+24px)] ${className}`}>
      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[20px] px-5 py-3 text-left lg:hidden"
        >
          <span className="font-bold text-navy">
            Order <span aria-hidden className="px-0.5 text-[#b6c4d6]">·</span> <span className="tabular-nums">{total}</span>{" "}
            <span className="font-semibold text-muted">{totalLabel.toLowerCase()}</span>
          </span>
          <span className="flex items-center gap-1 text-[0.88rem] font-bold text-cobalt">
            {" "}
            {open ? "Hide" : "Details"}
            <ChevronDown aria-hidden className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      )}

      <div id={`${id}-body`} className={`p-6 sm:p-7 ${collapsible ? "max-lg:pt-1" : ""} ${open ? "" : "max-lg:hidden"}`}>
        <h2 className="sr-only">Order summary</h2>
        {head}
        {facts && facts.length > 0 && (
          <dl className={`grid gap-2.5 text-[0.88rem] ${head ? `mt-5 pt-5 ${rule}` : ""}`}>
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-bold text-navy tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {lines.length > 0 && (
          <ul role="list" className={`grid gap-3 text-[0.9rem] ${head || facts?.length ? `mt-5 pt-5 ${rule}` : ""}`}>
            {lines.map((l) => (
              <li key={l.key} className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="block font-bold text-navy">{l.label}</span>
                  {l.detail && <span className="block text-[0.82rem] text-muted">{l.detail}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold text-navy tabular-nums">{l.amount}</span>
                  {l.note && <span className="block text-[0.78rem] text-muted">{l.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div aria-live="polite" aria-atomic="true" aria-busy={busy} className={`flex items-end justify-between gap-4 ${head || facts?.length || lines.length ? `mt-5 pt-5 ${rule}` : ""}`}>
          <span className={`${smallCaps} pb-1.5 text-[#4a5d78]`}>{totalLabel}</span>
          <span className="text-right">
            <span className={`block text-[2rem] leading-none font-bold tracking-[-0.02em] text-navy tabular-nums transition-opacity duration-200 ${busy ? "opacity-50" : ""}`}>{total}</span>
            {then && <span className="mt-1.5 block text-[0.85rem] text-muted">{then}</span>}
          </span>
        </div>
        {children}
      </div>
    </aside>
  );
}

/** The plan block at the top of a summary card. */
export function SummaryHead({ planKey, title, sub, badge = "Monthly" }: { planKey: string | null; title: React.ReactNode; sub?: React.ReactNode; badge?: string | null }) {
  return (
    <div className="flex items-center gap-3.5">
      <PlanIcon planKey={planKey} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.05rem] leading-tight font-bold text-navy">{title}</p>
        {sub && <p className="mt-1 text-[0.85rem] text-muted tabular-nums">{sub}</p>}
      </div>
      {badge && <Pill>{badge}</Pill>}
    </div>
  );
}
