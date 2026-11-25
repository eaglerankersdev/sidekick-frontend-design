import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, Layers3 } from "lucide-react";
import { PageHero, FAQ, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { ResponsiveCarousel } from "@/components/marketing/ResponsiveCarousel";
import { BrandLogo } from "@/components/marketing/BrandLogo";
import { AddOns, CompareTable, PlanCards } from "@/components/marketing/PricingPlans";
import { btnGhost, btnPrimary, section, wrap } from "@/components/marketing/tw";
import { pricingFaqs } from "@/content/pricing";
import { getPricing } from "@/lib/pricing";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "SideKick CRM Pricing | Plans for Your Service Business",
  description:
    "Basic, Growth and Enterprise plans for service businesses. Choose the workspaces, team size, AI credits and website pages that match the services you run.",
  alternates: { canonical: "/pricing" },
};

const fine = "mt-7 flex max-w-[820px] items-start gap-2.5 text-[0.9rem] text-muted [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-cobalt";

export default async function PricingPage() {
  const pricing = await getPricing();

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start with your service."
        accent="Grow on your terms."
        intro="Choose the workspace capacity that matches the services you manage. Your team and records stay connected as your business grows."
        align="center"
        actions={
          <>
            <Link href="#plans" className={btnPrimary}>
              Compare plans <ArrowRight aria-hidden />
            </Link>
            <Link href="/contact" className={btnGhost}>
              Talk to sales
            </Link>
          </>
        }
      />

      {/* 1. Plans (live prices from the SideKick API) */}
      <section id="plans" aria-label="Plans" className={`${section} bg-white pt-10!`}>
        <div className={wrap}>
          <PlanCards pricing={pricing} />
          {pricing ? (
            <p className={fine}>
              <Info aria-hidden /> Prices in {pricing.currency.toUpperCase()}, billed monthly. Plans are bought and managed on the web.
            </p>
          ) : (
            <p className={fine} role="status">
              <Info aria-hidden /> Live prices are unavailable right now. Talk to sales and we will share current pricing.
            </p>
          )}
          <AddOns pricing={pricing} />
        </div>
      </section>

      {/* 2. What a workspace means */}
      <section className={`${section} bg-canvas`}>
        <div className={`${wrap} grid items-center gap-7 sm:gap-[clamp(40px,6vw,88px)] lg:grid-cols-[1fr_1.08fr]`}>
          <div data-reveal>
            <h2 className="text-h2 max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]">One service, one configuration.</h2>
            <p className="mt-[18px] text-lead leading-[1.55]">
              A service workspace is one service-specific setup: its onboarding answers, its request form, its workflow stages, and its own
              leads, quotes and jobs.
            </p>
            <p className="mt-3 text-lead leading-[1.55]">
              Your business staff, roles, trucks and equipment are shared across every workspace, so one crew can serve two services without
              being booked twice.
            </p>
          </div>
          <div className="grid gap-3.5 rounded-xl bg-white p-5 shadow-md ring-1 ring-line" data-reveal="scale" aria-hidden>
            <div className="grid gap-0.5 rounded-md bg-navy px-[18px] py-4 font-bold text-white">
              <span>Your business</span>
              <small className="font-semibold text-navy-soft">Staff · roles · trucks · equipment · reporting</small>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(["Basic and up", "Growth and up", "Enterprise"] as const).map((tier, i) => (
                <div
                  key={tier}
                  className={`grid grid-cols-[28px_minmax(0,1fr)] gap-x-2.5 gap-y-0.5 rounded-md bg-canvas px-3 py-3.5 text-[0.85rem] ring-1 sm:grid-cols-1 sm:justify-items-center sm:text-center ${
                    i === 0 ? "ring-light-blue" : "ring-line"
                  }`}
                >
                  <Layers3 className="row-span-3 size-[22px] self-center text-cobalt sm:row-span-1" />
                  <strong>Workspace {i + 1}</strong>
                  <small className="text-muted">Leads · quotes · jobs</small>
                  <em className="mt-1 w-fit rounded-full bg-ice px-2 py-0.5 text-[0.7rem] font-bold text-cobalt not-italic">{tier}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Compare (live data only; never placeholder numbers) */}
      {pricing && (
        <section className={`${section} bg-white`} aria-labelledby="compare-title">
          <div className={wrap}>
            <div className="mb-[clamp(28px,5vw,64px)] max-w-[760px]">
              <h2 id="compare-title" className="text-h2 max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]">
                Compare every plan.
              </h2>
              <p className="mt-[18px] text-lead leading-[1.55]">Every plan includes web and mobile access to the same CRM.</p>
            </div>
            <div data-reveal>
              <CompareTable pricing={pricing} />
            </div>
          </div>
        </section>
      )}

      {/* 4. Provider integrations */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Provider integrations</span>
            <h2>Your accounts, their charges.</h2>
            <p>Connected services may involve separate third-party fees billed by those providers.</p>
          </div>
          <ResponsiveCarousel className="grid grid--3" label="Provider integrations">
            {[
              { icon: <BrandLogo brand="stripe" />, title: "Stripe", body: "You connect your own Stripe account. Stripe's processing fees apply.", f: "stripeInvoices" as const },
              { icon: <BrandLogo brand="gmail" />, title: "Email", body: "You connect your own sending account. Its plan and limits apply.", f: "emailSender" as const },
              { icon: <BrandLogo brand="callrail" />, title: "CallRail", body: "Later optional integration. You sign up and pay CallRail directly.", f: "callRail" as const },
            ].map((c) => (
              <div key={c.title} className="card card--hover">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
                  {c.icon}
                  <FeatureStatusBadge feature={c.f} />
                </div>
                <h3 style={{ marginTop: 20 }}>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </ResponsiveCarousel>
          <p className={fine} data-reveal>
            <Info aria-hidden /> Plan checkout is web-only. There is no native in-app subscription purchase.
          </p>
        </div>
      </section>

      <FAQ items={pricingFaqs} title="Pricing questions" />

      <CTASection
        title="Not sure which plan fits?"
        body="Tell us which services you run and we will map them to workspaces."
        primary={{ label: "Talk to sales", href: "/contact" }}
      />
    </>
  );
}
