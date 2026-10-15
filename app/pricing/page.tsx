import { ResponsiveCarousel } from "@/components/marketing/ResponsiveCarousel";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus, Layers3, Globe, Info } from "lucide-react";
import { PageHero, FAQ, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { plans, comparisonRows, pricingFaqs } from "@/content/pricing";
import s from "./pricing.module.css";
import { BrandLogo } from "@/components/marketing/BrandLogo";

export const metadata: Metadata = {
  title: "SideKick CRM Pricing | Plans for Your Service Business",
  description:
    "Choose the workspace capacity that matches the services you manage. Your team and records stay connected as your business grows.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
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
            <Link href="/contact" className="btn btn--primary">
              Book a Demo <ArrowRight aria-hidden />
            </Link>
            <Link href="/contact" className="btn btn--ghost">
              Contact Sales
            </Link>
          </>
        }
      />

      {/* 1. Three plan cards */}
      <section className="section section--white" style={{ paddingTop: 40 }}>
        <div className="container">
          <ResponsiveCarousel className={s.plans} label="Plans">
            {plans.map((p) => (
              <div key={p.key} className={`card ${s.plan} ${p.featured ? s.planFeatured : ""}`}>
                {p.featured && <span className={s.ribbon}>Most flexible</span>}
                <span className={s.planName}>
                  {p.name}
                  {!p.nameConfirmed && <em>name pending</em>}
                </span>
                <div className={s.planCount}>
                  <strong>{p.workspaces}</strong>
                  <span>
                    service
                    <br />
                    workspace{p.workspaces > 1 ? "s" : ""}
                  </span>
                </div>
                <p className={s.planTag}>{p.tagline}</p>
                <div className={s.price}>
                  <span>Pricing shared during your demo</span>
                </div>
                <ul role="list" className="check-list" style={{ marginTop: 20 }}>
                  {p.highlights.map((h) => (
                    <li key={h}>
                      <Check aria-hidden />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`btn ${p.featured ? "btn--primary" : "btn--ghost"} ${s.planBtn}`}>
                  Talk through this plan
                </Link>
              </div>
            ))}
          </ResponsiveCarousel>
          <p className={s.fine} data-reveal>
            <Info aria-hidden /> Plan names other than Basic, prices and feature limits come from the final commercial configuration. No
            prices, trials or guarantees are published here.
          </p>
        </div>
      </section>

      {/* 2. What a workspace means */}
      <section className="section">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">What a workspace means</span>
            <h2>One service, one configuration.</h2>
            <p className="lead">
              A service workspace is one service-specific setup: its onboarding answers, its request form, its workflow stages, and its own
              leads, quotes and jobs.
            </p>
            <p className="lead" style={{ marginTop: 12 }}>
              Your business staff, roles, trucks and equipment are shared across every workspace, so one crew can serve two services
              without being booked twice.
            </p>
          </div>
          <div className={s.wsDiagram} data-reveal="scale" aria-hidden>
            <div className={s.wsBiz}>
              <span>Your business</span>
              <small>Staff · roles · trucks · equipment · reporting</small>
            </div>
            <div className={s.wsRow}>
              {["Workspace 1", "Workspace 2", "Workspace 3"].map((w, i) => (
                <div key={w} className={`${s.ws} ${i === 0 ? s.wsBasic : ""}`}>
                  <Layers3 />
                  <strong>{w}</strong>
                  <small>Leads · quotes · jobs</small>
                  <em>{i === 0 ? "Basic and up" : i === 1 ? "Middle tier and up" : "Highest tier"}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Website page allowance */}
      <section className="section section--ice">
        <div className="container split split--flip">
          <div data-reveal>
            <span className="eyebrow">
              Website page allowance <FeatureStatusBadge feature="websiteBuilder" />
            </span>
            <h2>Separate from workspace capacity.</h2>
            <p className="lead">
              Basic includes one main page with manageable policy content. Higher tiers offer more pages. The exact higher-tier page count
              needs final commercial approval; up to 10 pages is a proposed ceiling, not a locked quota.
            </p>
          </div>
          <div className={s.pages} data-reveal="scale">
            {plans.map((p) => (
              <div key={p.key} className={s.pageRow}>
                <Globe aria-hidden />
                <strong>{p.name}</strong>
                <span>{p.websitePages}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Core features comparison */}
      <section className="section section--white">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Compare</span>
            <h2>Core features by plan.</h2>
            <p>Cells are left open until the final feature matrix is approved.</p>
          </div>
          <p className={s.tableHint}>Swipe or scroll sideways to compare all plans <span aria-hidden>↔</span></p>
          <div className={s.tableWrap} role="region" aria-label="Plan features comparison" tabIndex={0} data-reveal>
            <table className={s.table}>
              <caption className="sr-only">Core features comparison by plan</caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {plans.map((p) => (
                    <th key={p.key} scope="col">
                      {p.name}
                      <small>
                        {p.workspaces} workspace{p.workspaces > 1 ? "s" : ""}
                      </small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row}>
                    <th scope="row">{row}</th>
                    {plans.map((p) => (
                      <td key={p.key}>
                        <span className={s.pending} title="Pending final feature matrix">
                          <Minus aria-hidden />
                          <span className="sr-only">Pending</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Provider integrations */}
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
          <p className={s.fine} data-reveal>
            <Info aria-hidden /> Plan checkout is web-only. There is no native in-app subscription purchase.
          </p>
        </div>
      </section>

      {/* 6. FAQ */}
      <FAQ items={pricingFaqs} title="Pricing questions" />

      {/* 7. CTA */}
      <CTASection title="Talk through your plan." body="Tell us which services you run and we will map them to workspaces." primary={{ label: "Talk Through Your Plan", href: "/contact" }} />
    </>
  );
}
