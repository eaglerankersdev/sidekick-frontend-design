import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Palette, Users, Database, Handshake, Server, Lock } from "lucide-react";
import { PageHero, FAQ, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { BrandPreview } from "@/components/marketing/BrandPreview";
import s from "./white-label.module.css";

export const metadata: Metadata = {
  title: "White-Label CRM Platform for Resellers | SideKick CRM",
  description:
    "Offer a professional CRM under your own identity while SideKick provides the underlying software platform and hosting.",
  alternates: { canonical: "/white-label" },
};

const faqs = [
  { q: "Can I use my own domain?", a: "Yes. A reseller's CRM runs under the reseller's name, logo, colors and domain." },
  { q: "Can my clients choose their service?", a: "Yes. Each client business configures its own service workspaces within the plan it has." },
  { q: "What does the reseller manage?", a: "Reseller-level client management: onboarding client businesses, subscription status and authorized access to its own clients." },
  { q: "Is there a minimum resale price?", a: "Commercial terms, including pricing and revenue sharing, are governed by the reseller agreement. Our sales and legal teams can walk you through them." },
];

export default function WhiteLabelPage() {
  return (
    <>
      <PageHero
        eyebrow="White-Label CRM"
        title="Your brand."
        accent="Your CRM business."
        intro="Offer a professional CRM under your own identity while SideKick provides the underlying software platform and hosting."
        actions={
          <>
            <Link href="/contact?audience=reseller" className="btn btn--primary">
              Discuss White-Label Partnership <ArrowRight aria-hidden />
            </Link>
            <Link href="/features" className="btn btn--ghost">
              See the Platform
            </Link>
          </>
        }
      >
        <BrandPreview />
      </PageHero>

      {/* 1. What white-label means */}
      <section className="section section--white">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">What white-label means</span>
            <h2>Your clients see you, not us.</h2>
            <p className="lead">
              The reseller's name, logo, colors, domain and client-facing identity. No SideKick branding is shown to your service-provider
              clients during normal operation.
            </p>
            <ul role="list" className="check-list">
              {["Your name and logo", "Your colors", "Your domain", "Your client-facing CRM identity"].map((x) => (
                <li key={x}>
                  <Check aria-hidden />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={s.identity} data-reveal="scale" aria-hidden>
            <div className={s.idRow}>
              <span className={s.idLogo} style={{ background: "#002052" }} />
              <span>
                <strong>Your Brand CRM</strong>
                <em>crm.yourbrand.com</em>
              </span>
            </div>
            <div className={s.idRow}>
              <span className={s.idLogo} style={{ background: "#0a7a4f" }} />
              <span>
                <strong>Another Partner CRM</strong>
                <em>app.anotherpartner.com</em>
              </span>
            </div>
            <div className={s.idFoot}>
              <Lock aria-hidden /> Same platform underneath. Different identity on top.
            </div>
          </div>
        </div>
      </section>

      {/* 3-6 */}
      <section className="section">
        <div className="container">
          <div className="grid grid--2" data-reveal-stagger>
            {[
              {
                icon: <Users />,
                title: "Manage service-provider clients",
                body: "Reseller-level client management: client businesses, subscription status and authorized access to your own clients only.",
              },
              {
                icon: <Database />,
                title: "Businesses keep their work",
                body: "Each CRM business owns its own leads, jobs, invoices and workspace records. They are not reseller-owned copies.",
              },
              {
                icon: <Handshake />,
                title: "Subscription and revenue model",
                body: "Reseller commercial terms and revenue sharing are governed by agreement. No public percentages or margin claims.",
              },
              {
                icon: <Server />,
                title: "Hosted by SideKick",
                body: "A shared multi-tenant platform with managed infrastructure. Not a dedicated deployment per client.",
              },
            ].map((c) => (
              <div key={c.title} className="card card--hover">
                <span className="icon-tile">{c.icon}</span>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Branding preview */}
      <section className="section section--navy">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">
              Branding preview <FeatureStatusBadge status="concept" />
            </span>
            <h2>The same CRM. Any authorized brand.</h2>
            <p>Pick a sample identity to see the interface restyled. Concept preview with sample brands.</p>
          </div>
          <BrandPreview dark />
        </div>
      </section>

      <FAQ items={faqs} title="White-label questions" />
      <CTASection title="Talk to our team." body="Commercial, legal and technical details for a white-label partnership." primary={{ label: "Talk to Our Team", href: "/contact?audience=reseller" }} />
      <span hidden>
        <Palette />
      </span>
    </>
  );
}
