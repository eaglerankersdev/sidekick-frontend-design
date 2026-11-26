"use client";

import { useId, useState } from "react";
import { Building2, ChevronDown, Minus, PhoneCall, Plus, Sparkles, Sprout, TrendingUp, UsersRound, type LucideIcon } from "lucide-react";
import { ADDON_LIMITS, type AddonPrices } from "@/lib/addons";
import { formatMoney, type PlanKey } from "@/lib/pricing";

/** One icon per plan, used wherever a plan is named in checkout and upgrade. */
export const PLAN_ICONS: Record<PlanKey, LucideIcon> = { basic: Sprout, growth: TrendingUp, enterprise: Building2 };

export function PlanIcon({ planKey, className = "" }: { planKey: string | null; className?: string }) {
  const Icon = (planKey && PLAN_ICONS[planKey as PlanKey]) || Sprout;
  return (
    <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-[14px] [&>svg]:size-6 [&>svg]:stroke-[1.75] ${className}`}>
      <Icon />
    </span>
  );
}

const count = (n: number) => n.toLocaleString("en-US");

/** A 0…max quantity with 44px buttons; the number can also be typed. */
export function Stepper({ name, value, max, onChange, label, unit }: { name?: string; value: number; max: number; onChange: (n: number) => void; label: string; unit: string }) {
  const id = useId();
  const btn =
    "grid size-11 place-items-center rounded-[10px] text-cobalt transition-colors duration-150 hover:bg-ice disabled:cursor-not-allowed disabled:text-line-strong disabled:hover:bg-transparent [&>svg]:size-[18px]";
  return (
    <div className="inline-flex w-fit items-center gap-1 rounded-btn! bg-white p-0.5 ring-[1.5px] ring-line transition-shadow ring-inset focus-within:ring-cobalt">
      <button type="button" className={btn} aria-label={`Remove one ${unit}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
        <Minus aria-hidden />
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
        className="h-11 w-11 rounded-md border-0 bg-transparent text-center text-lg font-bold text-navy tabular-nums"
      />
      <span id={`${id}-range`} className="sr-only">
        From 0 to {max}
      </span>
      <button type="button" className={btn} aria-label={`Add one ${unit}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus aria-hidden />
      </button>
    </div>
  );
}

function AddOnCard({ active, icon, title, price, children, control }: { active: boolean; icon: React.ReactNode; title: React.ReactNode; price?: React.ReactNode; children: React.ReactNode; control: React.ReactNode }) {
  return (
    <li
      className={`grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-xl p-5 transition-[background-color,box-shadow] duration-200 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center sm:p-6 ${
        active ? "bg-ice/60 ring-2 ring-cobalt" : "bg-white ring-1 ring-line"
      }`}
    >
      {icon}
      <div className="min-w-0">
        <h3 className="text-lg leading-snug">{title}</h3>
        {price && <p className="mt-0.5 font-bold text-cobalt tabular-nums">{price}</p>}
        <div className="mt-1.5 text-[0.92rem] leading-normal text-muted">{children}</div>
      </div>
      <div className="col-start-2 sm:col-start-3">{control}</div>
    </li>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span aria-hidden className="grid size-12 place-items-center rounded-[14px] bg-ice text-cobalt [&>svg]:size-6 [&>svg]:stroke-[1.75]">
      <Icon />
    </span>
  );
}

export function SeatsAddOn({ prices, currency, value, base = 0, onChange, note }: { prices: AddonPrices; currency: string; value: number; base?: number; onChange: (n: number) => void; note: React.ReactNode }) {
  if (prices.seatMinor === null) return null;
  return (
    <AddOnCard
      active={value !== base}
      icon={<IconTile icon={UsersRound} />}
      title="Extra team members"
      price={`${formatMoney(prices.seatMinor, currency)}/month each`}
      control={<Stepper name="extraSeats" value={value} max={ADDON_LIMITS.extraSeats} onChange={onChange} label="Extra team members" unit="team member" />}
    >
      {note}
    </AddOnCard>
  );
}

export function PacksAddOn({ prices, currency, value, onChange }: { prices: AddonPrices; currency: string; value: number; onChange: (n: number) => void }) {
  if (!prices.pack) return null;
  return (
    <AddOnCard
      active={value > 0}
      icon={<IconTile icon={Sparkles} />}
      title="AI credit packs"
      price={`${count(prices.pack.credits)} credits for ${formatMoney(prices.pack.priceMinor, currency)}, one-time`}
      control={<Stepper name="creditPacks" value={value} max={ADDON_LIMITS.creditPacks} onChange={onChange} label="AI credit packs" unit="credit pack" />}
    >
      Credits are added for the current billing cycle.
    </AddOnCard>
  );
}

export function CallRailAddOn({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <AddOnCard
      active={checked}
      icon={<IconTile icon={PhoneCall} />}
      title={
        <span id={`${id}-title`} className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {/* Official CallRail logotype (callrail.com). */}
          <img src="/brands/callrail.svg" alt="CallRail" width={79} height={18} className="h-[18px] w-auto" />
          <span>call tracking</span>
        </span>
      }
      control={
        <label className="relative inline-flex h-11 cursor-pointer items-center">
          <input
            type="checkbox"
            role="switch"
            name="callRail"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-body`}
            className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-full"
          />
          <span aria-hidden className="h-7 w-12 rounded-full bg-line-strong transition-colors duration-200 peer-checked:bg-cobalt peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt" />
          <span aria-hidden className="pointer-events-none absolute left-1 size-5 rounded-full bg-white transition-transform duration-200 ease-out peer-checked:translate-x-5 motion-reduce:transition-none" />
        </label>
      }
    >
      <span id={`${id}-body`}>Free to add here — billed by CallRail. After checkout we&apos;ll help you connect your CallRail account.</span>
    </AddOnCard>
  );
}

export function AddOnList({ children }: { children: React.ReactNode }) {
  return (
    <ul role="list" className="grid gap-3">
      {children}
    </ul>
  );
}

export type SummaryLine = { key: string; label: string; detail?: string; amount: string; note?: string };

/**
 * The order panel: sticky beside the form on desktop, a collapsible bar above it on phones. Totals are announced politely.
 */
export function SummaryPanel({
  lines,
  totalLabel,
  total,
  then,
  busy,
  children,
  collapsible = true,
  className = "",
}: {
  lines: SummaryLine[];
  totalLabel: string;
  total: string;
  then?: React.ReactNode;
  busy?: boolean;
  children?: React.ReactNode;
  /** Phones: collapsed behind a bar. Off when the panel holds the page's main action. */
  collapsible?: boolean;
  className?: string;
}) {
  const [toggled, setOpen] = useState(false);
  const open = toggled || !collapsible;
  const id = useId();
  return (
    <aside aria-label="Order summary" className={`rounded-xl bg-canvas lg:sticky lg:top-[calc(var(--header-h)+24px)] ${className}`}>
      {collapsible && (
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-5 py-3 text-left lg:hidden"
      >
        <span className="font-bold">{open ? "Hide order summary" : "Show order summary"}</span>
        <span className="flex items-center gap-2 font-bold tabular-nums">
          {total}
          <ChevronDown aria-hidden className={`size-[18px] text-cobalt transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      )}

      <div id={`${id}-body`} className={`px-5 pb-5 sm:px-7 sm:pb-7 lg:pt-7 ${collapsible ? "" : "pt-5 sm:pt-7"} ${open ? "" : "max-lg:hidden"}`}>
        <h2 className={`text-xl ${collapsible ? "max-lg:sr-only" : ""}`}>Order summary</h2>
        <ul role="list" className={`mt-4 grid gap-3.5 empty:hidden ${collapsible ? "max-lg:mt-0" : ""}`}>
          {lines.map((l) => (
            <li key={l.key} className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block font-bold">{l.label}</span>
                {l.detail && <span className="block text-[0.88rem] text-muted">{l.detail}</span>}
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-bold tabular-nums">{l.amount}</span>
                {l.note && <span className="block text-[0.85rem] text-muted">{l.note}</span>}
              </span>
            </li>
          ))}
        </ul>

        <div aria-live="polite" aria-atomic="true" aria-busy={busy} className="mt-5 rounded-lg bg-white p-4 sm:p-5">
          <p className="flex items-baseline justify-between gap-3">
            <span className="font-bold">{totalLabel}</span>
            <span className={`text-[2rem] leading-none font-bold tracking-[-0.02em] tabular-nums transition-opacity duration-200 ${busy ? "opacity-50" : ""}`}>{total}</span>
          </p>
          {then && <p className="mt-2 text-right text-[0.92rem] text-muted">{then}</p>}
        </div>
        {children}
      </div>
    </aside>
  );
}
