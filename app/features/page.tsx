import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  FileText,
  Briefcase,
  CalendarDays,
  Receipt,
  ShieldCheck,
  BarChart3,
  Globe,
  PenLine,
  Link2,
  Layers3,
  Sparkles,
  PanelsTopLeft,
  Smartphone,
  Plug,
  Check,
} from "lucide-react";
import { PageHero, FeatureGrid, FAQ, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { Browser, DashboardMock, QuoteMock, InvoiceMock, LeadRecordMock, PreviewLabel } from "@/components/mocks/Mocks";
import s from "./features.module.css";

export const metadata: Metadata = {
  title: "SideKick CRM Features | Leads, Quotes, Jobs & More",
  description:
    "Running a service business takes more than a contact list. Keep your requests, team, work and payments in one connected workflow.",
  alternates: { canonical: "/features" },
};

const modules = [
  { icon: <Users />, title: "Leads", body: "Every inquiry becomes a record your team can assign, track and act on.", feature: "leads" as const },
  { icon: <FileText />, title: "Quotes", body: "Build the quote with your price rules and send it when you decide.", feature: "quotes" as const },
  { icon: <Briefcase />, title: "Jobs", body: "Turn an accepted quote into a job with service-specific stages.", feature: "jobs" as const },
  { icon: <CalendarDays />, title: "Scheduling", body: "Put the right crew, truck and equipment on the right day.", feature: "scheduling" as const },
  { icon: <Receipt />, title: "Invoices", body: "Create invoices in the CRM and collect through your Stripe account.", feature: "invoices" as const },
  { icon: <ShieldCheck />, title: "Employees & roles", body: "Custom roles with assigned, team or all access.", feature: "rbac" as const },
  { icon: <BarChart3 />, title: "Reporting", body: "Authorized reporting across leads, jobs and payments.", feature: "reporting" as const },
];

const more = [
  { icon: <Sparkles />, title: "AI & MCP", body: "Suggestions you review, accept or ignore.", feature: "aiSuggestions" as const, href: "/features/ai-mcp" },
  { icon: <PenLine />, title: "Proposal editor", body: "Branded, editable proposals with signing links.", feature: "proposalEditor" as const, href: "/features/quotes-proposals" },
  { icon: <PanelsTopLeft />, title: "Website builder", body: "A guided site with a connected quote form.", feature: "websiteBuilder" as const, href: "/features/website-builder" },
  { icon: <Smartphone />, title: "Mobile app", body: "Same records, in the field.", feature: "mobileApp" as const, href: "/features/mobile-app" },
  { icon: <Plug />, title: "Integrations", body: "Your Stripe, your email sender and approved lead sources.", feature: "emailSender" as const, href: "/integrations" },
];

const faqs = [
  {
    q: "Do my customers need an account?",
    a: "No. People who request service become lead records. They receive private, document-specific links for quotes, signatures and invoices, with nothing to sign up for.",
  },
  {
    q: "Is the mobile app a separate system?",
    a: "No. The web app and the mobile app share one backend, so a status change in the field shows up in the office immediately.",
  },
  {
    q: "What limits a service workspace?",
    a: "Your plan. Basic includes one service workspace, the middle plan up to two and the highest plan up to three. Staff and resources are shared across workspaces.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="All features"
        title="Everything connected."
        accent="Nothing scattered."
        intro="Running a service business takes more than a contact list. Keep your requests, team, work and payments in one connected workflow."
        actions={
          <>
            <Link href="/contact" className="btn btn--primary">
              See SideKick in Action <ArrowRight aria-hidden />
            </Link>
            <Link href="/industries" className="btn btn--ghost">
              Explore Industries
            </Link>
          </>
        }
      >
        <Browser>
          <DashboardMock />
        </Browser>
      </PageHero>

      {/* 1. Core modules */}
      <section className="section section--white">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Core modules</span>
            <h2>Seven modules. One record of the work.</h2>
            <p>Each module does one job well and hands the next one what it needs.</p>
          </div>
          <FeatureGrid items={modules} columns={4} />
        </div>
      </section>

      {/* 2. Lead intake */}
      <section className="section">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">Lead intake</span>
            <h2>Every request lands in one place.</h2>
            <p className="lead">Website forms, manual entry and connected sources all create the same kind of lead record.</p>
            <ul role="list" className="check-list">
              <li>
                <Check aria-hidden />
                <span>
                  Website quote form <span className="muted">Branded, per service workspace.</span>
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  Manual entry <span className="muted">Phone calls and walk-ins, typed in by your team.</span>
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  Connected sources <span className="muted">Approved integrations, labelled by availability.</span>
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  Separate inquiries stay separate <span className="muted">Even when they come from the same person.</span>
                </span>
              </li>
            </ul>
          </div>
          <div data-reveal="scale">
            <LeadRecordMock service="Any workspace" fields={["Contact", "Requested service", "Address", "Photos", "Source", "Assigned to"]} />
          </div>
        </div>
      </section>

      {/* 3. Service workspaces */}
      <section className="section section--ice">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">Service workspaces</span>
            <h2>One business. Up to three services.</h2>
            <p>
              A workspace is one service-specific configuration with its own leads, quotes and jobs. Your staff, trucks and equipment are
              shared business resources.
            </p>
          </div>
          <div className={s.workspaces} data-reveal-stagger>
            {[
              ["Basic", 1],
              ["Middle plan", 2],
              ["Highest plan", 3],
            ].map(([name, n]) => (
              <div key={name as string} className={`card ${s.wsCard}`}>
                <span className={s.wsNum}>{n}</span>
                <h3>
                  {n} workspace{(n as number) > 1 ? "s" : ""}
                </h3>
                <p>{name}</p>
                <div className={s.wsRow} aria-hidden>
                  {Array.from({ length: n as number }).map((_, i) => (
                    <span key={i}>
                      <Layers3 />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className={s.shared} data-reveal>
            <ShieldCheck aria-hidden /> Shared across every workspace: employees, roles, trucks, equipment and reporting.
          </p>
        </div>
      </section>

      {/* 4. Quoting and invoicing */}
      <section className="section">
        <div className="container split split--flip">
          <div data-reveal>
            <span className="eyebrow">Quoting and invoicing</span>
            <h2>You control the quote. The CRM creates the invoice.</h2>
            <p className="lead">
              A submitted form never sends a price on its own. You build the quote, decide when to send it and, when the work is done,
              create the invoice in the CRM. Payment runs through your own Stripe account.
            </p>
            <div className="btn-row" style={{ marginTop: 24 }}>
              <FeatureStatusBadge feature="quotes" />
              <FeatureStatusBadge feature="stripeInvoices" />
            </div>
          </div>
          <div className={s.quoteStack} data-reveal="scale">
            <QuoteMock
              lines={[
                ["Service line 1", "Qty 1"],
                ["Service line 2", "Qty 2"],
                ["Manual override", "Allowed"],
              ]}
            />
            <div className={s.quoteStackBack}>
              <InvoiceMock />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Team control */}
      <section className="section section--navy">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">Team control</span>
            <h2>Custom roles, clear access.</h2>
            <p className="lead">Decide who sees assigned records, their team's records or everything, and who can run reports.</p>
            <ul role="list" className="check-list">
              <li>
                <Check aria-hidden />
                <span>Custom roles per business</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Assigned / team / all access levels</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Authorized reporting</span>
              </li>
            </ul>
          </div>
          <div className={s.roles} data-reveal="scale">
            <PreviewLabel>Role setup · sample</PreviewLabel>
            {[
              ["Owner", "All access", 3],
              ["Manager", "Team access", 2],
              ["Crew member", "Assigned only", 1],
            ].map(([r, a, n]) => (
              <div key={r as string} className={s.roleRow}>
                <strong>{r}</strong>
                <span>{a}</span>
                <i className={s.roleDots} data-n={n}>
                  <b />
                  <b />
                  <b />
                </i>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. More capabilities */}
      <section className="section section--white">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">More capabilities</span>
            <h2>Growing with the platform.</h2>
            <p>Status labels come from one central availability file and reflect the current release state.</p>
          </div>
          <FeatureGrid items={more} columns={3} />
        </div>
      </section>

      {/* 7. FAQ */}
      <FAQ items={faqs} />

      {/* 8. CTA */}
      <CTASection
        title="See how the pieces connect."
        body="A guided walkthrough of the workflow, from request to payment."
        primary={{ label: "Book a Demo", href: "/contact" }}
        secondary={{ label: "Explore Industries", href: "/industries" }}
      />
      <span hidden>
        <Globe />
        <Link2 />
      </span>
    </>
  );
}
