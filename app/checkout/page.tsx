import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CheckoutForm, type CheckoutPlan } from "@/components/marketing/CheckoutForm";
import { pageBg } from "@/components/marketing/checkout-styles";
import { btnGhost, btnPrimary, section, wrap } from "@/components/marketing/tw";
import { planCopyByKey } from "@/content/pricing";
import { addonPrices } from "@/lib/addons";
import { getPricing, isPurchasable, parsePlanKey, planFacts } from "@/lib/pricing";
import { getStripePublishableKey } from "@/lib/stripe-config";

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

  const [pricing, publishableKey] = await Promise.all([getPricing(), getStripePublishableKey()]);
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
  // Only plans that can be bought online are offered; every number comes from the pricing API.
  const plans: CheckoutPlan[] = pricing.plans.filter(isPurchasable).map((p) => ({
    key: p.key,
    name: p.name,
    tagline: planCopyByKey[p.key].tagline,
    featured: !!planCopyByKey[p.key].featured,
    priceMinor: p.priceMinor!,
    teamMembers: p.teamMembers,
    facts: planFacts(p),
    prices: addonPrices(pricing, p),
  }));

  return (
    <section className={`${pageBg} pt-[clamp(32px,5vw,64px)] pb-[clamp(56px,7vw,96px)] max-lg:pb-36`}>
      <div className={`${wrap} max-w-[calc(1200px+var(--gutter)*2)]`}>
        <CheckoutForm
          plans={plans}
          initialPlan={key}
          currency={pricing.currency}
          idempotencyKey={randomUUID()}
          publishableKey={publishableKey}
          cancelled={cancelled}
        />
      </div>
    </section>
  );
}
