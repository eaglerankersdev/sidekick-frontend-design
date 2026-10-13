import type { Metadata } from "next";
import Link from "next/link";
import { MCPConnections } from "@/components/marketing/MCPConnections";
import { ArrowRight, Inbox, Check, Info } from "lucide-react";
import { PageHero, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { statusOf, STATUS_LABEL, type FeatureKey } from "@/content/feature-availability";
import s from "./integrations.module.css";
import { BrandLogo, BrandBadge, type Brand } from "@/components/marketing/BrandLogo";

export const metadata: Metadata = {
  title: "SideKick CRM Integrations | Connect the Tools You Use",
  description: "Bring approved lead sources and your own business accounts into the CRM, so information lands where your team can act on it.",
  alternates: { canonical: "/integrations" },
};

type Card = { icon: React.ReactNode; title: string; body: string; feature: FeatureKey; points: string[]; brands?: Brand[]; docs?: string };

const cards: Card[] = [
  {
    icon: <Inbox />,
    title: "Lead intake",
    brands: ["meta", "googleAds", "callrail"],
    body: "Website quote forms, manual entry, configured webhooks and automation sources.",
    feature: "webhooks",
    points: ["Website quote forms", "Manual entry", "Configured webhooks and automation sources", "Meta lead integration where supported"],
  },
  {
    icon: <BrandLogo brand="stripe" />,
    title: "Stripe",
    body: "You connect your own Stripe account. The CRM creates invoices and receives payment status for the exact lead.",
    feature: "stripeInvoices",
    points: ["Your account, your payouts", "CRM-first invoices", "Paid status synced to the right lead"],
  },
  {
    icon: <BrandLogo brand="gmail" />,
    title: "Email",
    body: "You connect your own sending account. There is no shared SideKick marketing sender.",
    feature: "emailSender",
    points: ["Your sending account and limits", "Excel campaign preparation and sending are web-only"],
  },
  {
    icon: <BrandLogo brand="callrail" />,
    title: "CallRail",
    body: "A later optional integration. You sign up and pay CallRail directly and connect the account to your CRM.",
    feature: "callRail",
    points: ["Provider-paid, provider-owned", "No phone-number resale by SideKick"],
  },
  {
    icon: <BrandLogo brand="mcp" />,
    title: "MCP connections",
    body: "Secure backend AI tools, subject to your permissions, described only when actually supported.",
    feature: "mcp",
    points: ["Approved CRM actions only", "Backend-held credentials", "Usage limits"],
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Integrations"
        title="Keep the tools you use."
        accent="Connect the work that matters."
        intro="Bring approved lead sources and your own business accounts into the CRM, so information lands where your team can act on it."
        align="center"
        actions={
          <Link href="/contact" className="btn btn--primary">
            Ask About an Integration <ArrowRight aria-hidden />
          </Link>
        }
      />

      <section className="section section--white" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className={s.legend} data-reveal>
            {(["pending-review", "in-development", "planned"] as const).map((st) => (
              <span key={st} className={`status status--${st}`}>
                {STATUS_LABEL[st]}
              </span>
            ))}
            <span className="muted">Explore the roadmap. Confirm current availability with us during your demo.</span>
          </div>
          <div className={s.cards} data-reveal-stagger>
            {cards.map((c) => (
              <article key={c.title} className={`card card--hover ${s.card} ${c.brands ? s.leadCard : ""}`}>
                <div className={s.cardHead}>
                  {c.title === "Lead intake" ? <span className="icon-tile">{c.icon}</span> : c.icon}
                  <FeatureStatusBadge feature={c.feature} />
                </div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                {c.brands && <div className={s.sources}><span>Lead source examples</span><div>{c.brands.map(brand => <BrandBadge key={brand} brand={brand} />)}</div><small>Connection options depend on the source and your setup. Confirm availability during your demo.</small></div>}
                <ul role="list" className="check-list" style={{ marginTop: 16, gap: 8 }}>
                  {c.points.map((p) => (
                    <li key={p}>
                      <Check aria-hidden />
                      <span style={{ fontSize: "0.95rem" }}>{p}</span>
                    </li>
                  ))}
                </ul>
                {c.docs && statusOf(c.feature) === "available" && (
                  <a href={c.docs} className="text-link" style={{ marginTop: 14 }}>
                    Documentation <ArrowRight aria-hidden />
                  </a>
                )}
              </article>
            ))}
          </div>
          <p className={s.fine} data-reveal>
            <Info aria-hidden /> Not offered: one-click integration with every automation platform, unlimited email sending, phone-number resale,
            SMS, WhatsApp or automatic contact merging.
          </p>
        </div>
      </section>

      <MCPConnections />

      <CTASection title="Need a specific integration?" body="Tell us what you use and we will say plainly what is available, in development or planned." primary={{ label: "Ask About an Integration", href: "/contact" }} />
    </>
  );
}
