import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { CheckoutForm } from "@/components/marketing/CheckoutForm";
import { PlanIcon } from "@/components/marketing/CheckoutParts";
import { WorkspaceBlocks } from "@/components/marketing/PricingPlans";
import { btnGhost, btnPrimary, section, textLink, wrap } from "@/components/marketing/tw";
import { planCopyByKey } from "@/content/pricing";
import { addonPrices } from "@/lib/addons";
import { formatMoney, getPricing, isPurchasable, parsePlanKey, planFacts, type LivePlan } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Checkout | SideKick CRM",
  description: "Start your SideKick CRM plan. Enter your details, then pay securely with Stripe.",
  robots: { index: false, follow: false },
};

const h1 = "text-h2 text-balance max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[]; cancelled?: string | string[] }> }) {
  const sp = await searchParams;
  const key = parsePlanKey(sp.plan);
  if (!key) redirect("/pricing#plans");

  const pricing = await getPricing();
  const plan = pricing?.plans.find((p) => p.key === key);
  const name = plan?.name ?? planCopyByKey[key].name;

  if (!pricing || !plan || !isPurchasable(plan)) {
    return (
      <section className={`${section} grid min-h-[60vh] items-center bg-white`}>
        <div className={`${wrap} max-w-[calc(720px+var(--gutter)*2)]`}>
          <h1 className={h1}>The {name} plan isn&apos;t available online right now.</h1>
          <p className="mt-5 text-lead leading-[1.55]">Our sales team can set up your account and share current pricing.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={`/contact?plan=${key}`} className={btnPrimary}>
              Talk to sales <ArrowRight aria-hidden />
            </Link>
            <Link href="/pricing" className={btnGhost}>
              <ArrowLeft aria-hidden /> Back to pricing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const cancelled = (Array.isArray(sp.cancelled) ? sp.cancelled[0] : sp.cancelled) === "1";

  return (
    <section className={`${section} bg-white pt-[clamp(28px,5vw,56px)]!`}>
      <div className={`${wrap} max-w-[calc(1120px+var(--gutter)*2)]`}>
        <Link href="/pricing#plans" className={`${textLink} min-h-11 [&_svg]:transition-transform hover:[&_svg]:-translate-x-0.5`}>
          <ArrowLeft aria-hidden /> All plans
        </Link>
        <h1 className={`${h1} mt-3`}>Start your {plan.name} plan</h1>
        <p className="mt-3 max-w-[60ch] text-lead leading-[1.55]">
          Enter your details, then pay on Stripe&apos;s secure checkout. You set your password as soon as the payment is confirmed.
        </p>
        <p className="mt-3 text-[0.95rem] text-muted">
          Already a SideKick customer?{" "}
          <Link href={`/checkout/upgrade?plan=${key}`} className="inline-flex min-h-11 items-center font-bold text-cobalt underline-offset-4 hover:underline">
            Upgrade your plan
          </Link>
        </p>

        {cancelled && (
          <p role="status" className="mt-4 flex max-w-[60ch] items-start gap-2.5 rounded-md bg-ice px-4 py-3.5 font-bold text-navy [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-cobalt">
            <Info aria-hidden /> Checkout cancelled. Nothing was charged.
          </p>
        )}

        <div className="mt-8 lg:mt-10">
          <CheckoutForm
            plan={{ key, name: plan.name, priceMinor: plan.priceMinor!, teamMembers: plan.teamMembers }}
            currency={pricing.currency}
            prices={addonPrices(pricing, plan)}
            header={<PlanCard plan={plan} currency={pricing.currency} />}
            idempotencyKey={randomUUID()}
          />
        </div>
      </div>
    </section>
  );
}

/** The plan being bought, with its live allowances: the one dark, weighty block of the page. */
function PlanCard({ plan, currency }: { plan: LivePlan; currency: string }) {
  return (
    <section aria-labelledby="plan-title" className="rounded-xl bg-navy p-[clamp(20px,3vw,32px)] text-white">
      <div className="flex items-start gap-4">
        <PlanIcon planKey={plan.key} className="bg-white/10 text-light-blue" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="plan-title" className="text-2xl text-white">
              {plan.name} plan
            </h2>
            <Link href="/pricing#plans" className="-my-2 inline-flex min-h-11 items-center text-[0.92rem] font-bold text-light-blue underline-offset-4 hover:text-white hover:underline">
              Change plan
            </Link>
          </div>
          <p className="mt-0.5 text-navy-soft">{planCopyByKey[plan.key].tagline}</p>
        </div>
      </div>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[2.75rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{formatMoney(plan.priceMinor!, currency)}</span>
        <span className="font-semibold text-navy-soft">per month</span>
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {planFacts(plan).map(([label, value], i) => (
          <div key={label} className="rounded-lg bg-white/[.07] px-4 py-3.5">
            <dt className="text-[0.85rem] leading-snug text-navy-soft">{label}</dt>
            <dd className="mt-1 flex items-center gap-2 text-lg font-bold tabular-nums">
              {value}
              {i === 0 && <WorkspaceBlocks n={plan.workspaces} onDark />}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
