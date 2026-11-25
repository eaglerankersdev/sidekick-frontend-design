import Link from "next/link";
import { ArrowRight, Check, Minus, Plus, Sparkles, UserPlus } from "lucide-react";
import { formatMoney, isPurchasable, type LivePlan, type Pricing } from "@/lib/pricing";
import { moduleLabels, planCopy, type PlanCopy } from "@/content/pricing";
import { btnGhost, btnLight, btnOutlineLight, btnPrimary } from "./tw";

const count = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, one: string, many = `${one}s`) => `${count(n)} ${n === 1 ? one : many}`;

function websiteLine(w: LivePlan["website"]) {
  if (w.maxPages === null) return null;
  const pages = w.maxPages === 1 ? "Website home page" : `Website up to ${w.maxPages} pages`;
  const services = w.servicePages === "single" ? ", including a Services page" : w.servicePages === "dedicated" ? ", with a page for each service" : "";
  return pages + services;
}

/** Filled squares = workspaces in this plan, out of the three a business can have. */
function WorkspaceBlocks({ n, onDark }: { n: number; onDark?: boolean }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <i key={i} className={`size-3 rounded-[4px] ${i < n ? (onDark ? "bg-light-blue" : "bg-cobalt") : onDark ? "bg-white/15" : "bg-line"}`} />
      ))}
    </span>
  );
}

function PlanCard({ copy, plan, currency }: { copy: PlanCopy; plan?: LivePlan; currency?: string }) {
  const dark = !!copy.featured;
  const priced = plan && currency && isPurchasable(plan) ? formatMoney(plan.priceMinor!, currency) : null;
  const name = plan?.name ?? copy.name;
  const workspaces = plan?.workspaces ?? copy.workspaces;
  const sub = dark ? "text-navy-soft" : "text-muted";
  const items = plan
    ? [
        plural(plan.workspaces, "service workspace"),
        `${count(plan.aiCredits)} AI credits each month`,
        `${plural(plan.teamMembers, "team member")} included`,
        websiteLine(plan.website),
        plan.website.policyPagesCount ? null : "Plus privacy and terms pages",
      ].filter((x): x is string => !!x)
    : [plural(copy.workspaces, "service workspace"), "Leads, quotes, jobs and invoices", "Web and mobile access"];

  return (
    <article
      aria-labelledby={`plan-${copy.key}`}
      className={`relative flex min-w-0 flex-col rounded-xl p-7 sm:p-8 ${
        dark ? "bg-navy text-white shadow-lg lg:-my-5 lg:py-12" : "bg-white shadow-sm ring-1 ring-line"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`plan-${copy.key}`} className="text-2xl">
          {name}
        </h3>
        {dark ? (
          <span className="rounded-full bg-cobalt px-3 py-1 text-xs font-bold text-white">Recommended</span>
        ) : (
          <WorkspaceBlocks n={workspaces} />
        )}
      </div>
      <p className={`mt-2 ${sub}`}>{copy.tagline}</p>

      <div className="mt-7 flex min-h-16 items-end">
        {priced ? (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-5xl leading-none font-bold tracking-[-0.03em] tabular-nums">{priced}</span>
            <span className={`font-semibold ${sub}`}>per month</span>
          </p>
        ) : (
          <p className="text-lg leading-snug font-bold">Pricing from our sales team</p>
        )}
      </div>

      <div className="mt-6 grid gap-2.5">
        {priced ? (
          <>
            <Link href={`/checkout?plan=${copy.key}`} className={dark ? btnLight : btnPrimary}>
              Get started <ArrowRight aria-hidden />
            </Link>
            <Link href={`/contact?plan=${copy.key}`} className={dark ? btnOutlineLight : btnGhost}>
              Talk to sales
            </Link>
          </>
        ) : (
          <Link href={`/contact?plan=${copy.key}`} className={dark ? btnLight : btnPrimary}>
            Talk to sales <ArrowRight aria-hidden />
          </Link>
        )}
      </div>

      <ul role="list" className="mt-8 grid gap-3.5">
        {items.map((it) => (
          <li key={it} className="grid grid-cols-[22px_1fr] items-start gap-3">
            <Check aria-hidden className={`mt-0.5 size-[22px] rounded-full p-[3px] ${dark ? "bg-white/10 text-light-blue" : "bg-ice text-cobalt"}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function PlanCards({ pricing }: { pricing: Pricing | null }) {
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
      {planCopy.map((copy) => (
        <PlanCard key={copy.key} copy={copy} plan={pricing?.plans.find((p) => p.key === copy.key)} currency={pricing?.currency} />
      ))}
    </div>
  );
}

export function AddOns({ pricing }: { pricing: Pricing | null }) {
  if (!pricing) return null;
  const { currency, plans, topUp } = pricing;
  const memberPrices = [...new Set(plans.map((p) => p.extraMemberMinor).filter((m): m is number => m !== null))];
  const memberPrice =
    memberPrices.length === 1
      ? `${formatMoney(memberPrices[0], currency)} per month each`
      : plans
          .filter((p) => p.extraMemberMinor !== null)
          .map((p) => `${p.name} ${formatMoney(p.extraMemberMinor!, currency)}`)
          .join(" · ") + " per month each";
  const addOns = [
    memberPrices.length > 0 && {
      icon: <UserPlus aria-hidden />,
      title: "Extra team member",
      price: memberPrice,
      body: "Add people above your plan's team limit. Billed with your monthly subscription.",
    },
    topUp && {
      icon: <Sparkles aria-hidden />,
      title: "AI credit top-up",
      price: `${formatMoney(topUp.priceMinor, currency)} for ${count(topUp.credits)} credits`,
      body: "A one-time purchase when you need more AI credits before your plan refreshes.",
    },
  ].filter((x) => !!x);
  if (!addOns.length) return null;

  return (
    <div className="mt-14 grid gap-6 rounded-xl bg-canvas p-6 sm:p-8 lg:mt-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] lg:items-center lg:gap-10">
      <div>
        <h3 className="text-h3">Add-ons</h3>
        <p className="mt-2 text-muted">Available on every plan, when you need them.</p>
      </div>
      <ul role="list" className="grid gap-4 sm:grid-cols-2">
        {addOns.map((a) => (
          <li key={a.title} className="flex gap-4 rounded-lg bg-white p-5 shadow-sm">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-ice text-cobalt [&_svg]:size-[22px]">{a.icon}</span>
            <div className="min-w-0">
              <p className="font-bold">{a.title}</p>
              <p className="mt-0.5 flex items-center gap-1 font-bold text-cobalt tabular-nums">
                <Plus aria-hidden className="size-4 shrink-0" />
                {a.price}
              </p>
              <p className="mt-2 text-[0.92rem] text-muted">{a.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const yes = (
  <>
    <Check aria-hidden className="mx-auto size-6 rounded-full bg-ice p-1 text-cobalt" />
    <span className="sr-only">Included</span>
  </>
);
const no = (
  <>
    <Minus aria-hidden className="mx-auto size-5 text-muted" />
    <span className="sr-only">Not included</span>
  </>
);

export function CompareTable({ pricing }: { pricing: Pricing }) {
  const { plans, currency } = pricing;
  const order = Object.keys(moduleLabels);
  const modules = [...new Set(plans.flatMap((p) => p.modules))].sort(
    (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
  );
  const label = (m: string) => moduleLabels[m] ?? m.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  const sales = "Talk to sales";
  const rows: [string, (p: LivePlan) => React.ReactNode][] = [
    ["Monthly price", (p) => (isPurchasable(p) ? formatMoney(p.priceMinor!, currency) : sales)],
    ["Service workspaces", (p) => count(p.workspaces)],
    ["AI credits each month", (p) => count(p.aiCredits)],
    ["Team members included", (p) => count(p.teamMembers)],
    ["Extra team member", (p) => (p.extraMemberMinor === null ? sales : `${formatMoney(p.extraMemberMinor, currency)} per month`)],
    ["Website pages", (p) => (p.website.maxPages === null ? sales : p.website.maxPages === 1 ? "Home page" : `Up to ${p.website.maxPages}`)],
    ["Service pages", (p) => (p.website.servicePages === "none" ? no : p.website.servicePages === "single" ? "One Services page" : "One per service")],
    ["Privacy and terms pages", (p) => (p.website.policyPagesCount ? "Included, counted" : "Included, not counted")],
    ...modules.map((m): [string, (p: LivePlan) => React.ReactNode] => [label(m), (p) => (p.modules.includes(m) ? yes : no)]),
  ];
  const featured = (p: LivePlan) => planCopy.find((c) => c.key === p.key)?.featured;

  return (
    <>
      <p className="mb-3 flex items-center gap-2 text-[0.85rem] text-muted md:hidden">
        Scroll sideways to compare plans <ArrowRight aria-hidden className="size-4 text-cobalt" />
      </p>
      <div role="region" aria-label="Plan comparison" tabIndex={0} className="relative overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-line">
        <table className="w-full min-w-[500px] border-collapse text-left text-[0.9rem] sm:min-w-[640px] sm:text-base">
          <caption className="sr-only">What each plan includes</caption>
          <thead>
            <tr className="bg-canvas">
              <th scope="col" className="sticky left-0 z-10 bg-canvas px-3 py-3.5 sm:px-5 sm:py-4 font-bold">
                Plan
              </th>
              {plans.map((p) => (
                <th key={p.key} scope="col" className={`px-3 py-3.5 sm:px-5 sm:py-4 text-center font-bold ${featured(p) ? "bg-ice" : ""}`}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, cell]) => (
              <tr key={name} className="border-t border-line">
                <th scope="row" className="sticky left-0 z-10 w-[34%] bg-white px-3 py-3.5 font-bold sm:w-auto sm:px-5 sm:py-4">
                  {name}
                </th>
                {plans.map((p) => (
                  <td key={p.key} className={`px-3 py-3.5 sm:px-5 sm:py-4 text-center tabular-nums ${featured(p) ? "bg-ice/50" : ""}`}>
                    {cell(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
