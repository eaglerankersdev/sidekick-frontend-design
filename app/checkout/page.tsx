import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { CheckoutForm } from "@/components/marketing/CheckoutForm";
import { OrderSummary, TrustNotes } from "@/components/marketing/OrderSummary";
import { btnGhost, btnPrimary, section, textLink, wrap } from "@/components/marketing/tw";
import { planCopyByKey } from "@/content/pricing";
import { formatMoney, getPricing, isPurchasable, parsePlanKey } from "@/lib/pricing";

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
  const price = formatMoney(plan.priceMinor!, pricing.currency);

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

        {cancelled && (
          <p role="status" className="mt-6 flex max-w-[60ch] items-start gap-2.5 rounded-md bg-ice px-4 py-3.5 font-bold text-navy [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-cobalt">
            <Info aria-hidden /> Checkout cancelled. Nothing was charged.
          </p>
        )}

        {/* Phone: summary, form, trust notes. Desktop: form left, summary and notes right. */}
        <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-10">
          <OrderSummary plan={plan} currency={pricing.currency} className="lg:col-start-2 lg:row-start-1" />
          <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <CheckoutForm planKey={key} price={price} idempotencyKey={randomUUID()} />
          </div>
          <TrustNotes className="lg:col-start-2 lg:row-start-2" />
        </div>
      </div>
    </section>
  );
}
