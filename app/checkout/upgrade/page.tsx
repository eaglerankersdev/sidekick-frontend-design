import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { UpgradeFlow } from "@/components/marketing/UpgradeFlow";
import { btnGhost, btnPrimary, section, textLink, wrap } from "@/components/marketing/tw";
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
    <section className={`${section} bg-white pt-[clamp(28px,5vw,56px)]!`}>
      <div className={`${wrap} max-w-[calc(1120px+var(--gutter)*2)]`}>
        <Link href="/pricing#plans" className={`${textLink} min-h-11 [&_svg]:transition-transform hover:[&_svg]:-translate-x-0.5`}>
          <ArrowLeft aria-hidden /> All plans
        </Link>
        {pricing && plans.length ? (
          <UpgradeFlow
            pricing={{ ...pricing, plans }}
            initialPlan={wanted && plans.some((p) => p.key === wanted) ? wanted : null}
          />
        ) : (
          <div className="mt-3 max-w-[720px]">
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
