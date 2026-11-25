import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { btnGhost, btnPrimary, section, wrap } from "@/components/marketing/tw";
import { planCopyByKey } from "@/content/pricing";
import { parsePlanKey } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Checkout | SideKick CRM",
  description: "Online checkout for SideKick CRM plans opens soon. Talk to sales to get started today.",
  robots: { index: false, follow: true },
};

// shortcut: placeholder until the public checkout (email + phone, then Stripe Checkout) ships in the next phase.
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[] }> }) {
  const plan = parsePlanKey((await searchParams).plan);
  const name = plan ? planCopyByKey[plan].name : null;

  return (
    <section className={`${section} grid min-h-[60vh] items-center bg-white`}>
      <div className={`${wrap} max-w-[calc(720px+var(--gutter)*2)]`}>
        <h1 className="text-h2 max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]">Checkout opens soon.</h1>
        <p className="mt-5 text-lead leading-[1.55]">
          {name ? `You picked the ${name} plan. ` : ""}
          Online checkout is almost ready. Until then, our sales team can set up your account and share current pricing.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href={plan ? `/contact?plan=${plan}` : "/contact"} className={btnPrimary}>
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
