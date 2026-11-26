import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageBg } from "@/components/marketing/checkout-styles";
import { UpgradeFlow } from "@/components/marketing/UpgradeFlow";
import { btnGhost, btnPrimary, wrap } from "@/components/marketing/tw";
import { getPricing, isPurchasable, parsePlanKey } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Upgrade your plan | SideKick CRM",
  description: "Existing SideKick customers can change their plan and add team members or AI credits.",
  robots: { index: false, follow: false },
};

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ plan?: string | string[] }> }) {
  const wanted = parsePlanKey((await searchParams).plan);
  const pricing = await getPricing();
  const plans = pricing?.plans.filter(isPurchasable) ?? [];

  return (
    <section className={`${pageBg} pt-[clamp(32px,5vw,64px)] pb-[clamp(56px,7vw,96px)]`}>
      <div className={`${wrap} max-w-[calc(1200px+var(--gutter)*2)]`}>
        {pricing && plans.length ? (
          <UpgradeFlow
            pricing={{ ...pricing, plans }}
            initialPlan={wanted && plans.some((p) => p.key === wanted) ? wanted : null}
          />
        ) : (
          <div className="max-w-[720px]">
            <h1 className="text-h2 text-balance max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]">Upgrades aren&apos;t available online right now</h1>
            <p className="mt-5 text-lead leading-[1.55]">You can change your plan in the CRM under Billing, or our sales team can do it for you.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className={btnPrimary}>
                Talk to sales <ArrowRight aria-hidden />
              </Link>
              <Link href="/pricing" className={btnGhost}>
                Back to pricing
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
