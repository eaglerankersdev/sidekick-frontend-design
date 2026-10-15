import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, ShieldCheck, Sparkles, Globe, FileSignature, Check, BriefcaseBusiness, Palette, Play, CalendarCheck, Inbox } from "lucide-react";
import { MCPConnections } from "@/components/marketing/MCPConnections";
import { HeroParallax } from "@/components/marketing/HeroParallax";
import { HeroField } from "@/components/marketing/HeroField";
import { HeroMascot } from "@/components/marketing/HeroMascot";
import { WorkflowJourney } from "@/components/marketing/WorkflowJourney";
import { IndustrySwitcher } from "@/components/marketing/IndustrySwitcher";
import { CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { Browser, Phone, DashboardMock, JobPhoneMock, AISuggestionMock, BuilderMock, ProposalMock, PreviewLabel } from "@/components/mocks/Mocks";
import { industries } from "@/content/industries";
import { IndustryMarquee } from "@/components/marketing/IndustryMarquee";
import { plans } from "@/content/pricing";
import s from "./home.module.css";

export const metadata: Metadata = {
  title: "SideKick CRM | One Platform for Service Businesses",
  description:
    "From the first quote request to the final paid invoice, keep your service business moving on your desktop and wherever the work takes you.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroParallax className={s.hero}>
        <div className={s.heroBg} aria-hidden><HeroField /></div>
        <div className={`container ${s.heroInner}`}>
          <div className={s.heroCopy} data-hero-layer="copy">
            <div className={s.heroIntro}>
            <span className={s.kicker}>Less admin. More jobs done.</span>
            <h1>Your business.<br /><span>Your SideKick.</span></h1>
            <p className="lead">From the first service request to the paid invoice. Bring your leads, quotes, jobs and team together in one connected CRM.</p>
            </div>
            <div className={s.heroControls}>
            <div className="btn-row">
              <Link href="/contact" className="btn btn--primary">Book a Demo <ArrowRight aria-hidden /></Link>
              <Link href="#workflow" className={`btn btn--ghost ${s.watch}`}><Play aria-hidden /> See how it works</Link>
            </div>
            <ul role="list" className={s.heroFacts}>
              <li><Check aria-hidden /> Your workflow</li>
              <li><Check aria-hidden /> Your team</li>
              <li><Check aria-hidden /> Your control</li>
            </ul>
            </div>
          </div>
          <div className={s.heroVisual}>
            <div className={s.heroOrbit} data-hero-layer="backdrop" aria-hidden />
            <div className={s.heroBrowser} data-hero-layer="workspace">
              <HeroMascot className={s.mascot} />
              <Browser url="Your SideKick workspace"><DashboardMock mobilePreview /></Browser>
            </div>
            <div className={s.heroPhone} data-hero-layer="phone"><Phone><JobPhoneMock /></Phone></div>
            <div className={s.heroState} data-hero-layer="status"><span><CalendarCheck aria-hidden /></span><div><strong>Next stop: a job well done.</strong><small>From request to scheduled work</small></div></div>
            <span className={s.heroLabel}><PreviewLabel /></span>
          </div>
        </div>
      </HeroParallax>
      <IndustryMarquee items={industries.map(ind => ({ name: ind.navName, icon: ind.icon }))} />
      <div className={`container ${s.audiences}`}>
        <Link href="/features"><BriefcaseBusiness aria-hidden /><span><strong>I run a service business</strong><small>Less admin. More time for the work.</small></span><ArrowRight aria-hidden /></Link>
        <Link href="/white-label"><Palette aria-hidden /><span><strong>I want to offer my own CRM</strong><small>Your brand, powered by SideKick.</small></span><ArrowRight aria-hidden /></Link>
      </div>

      {/* 2. One connected workflow */}
      <section className="section" id="workflow">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">One connected workflow</span>
            <h2>
              Request to payment, <span className="grad-text">without the handoffs.</span>
            </h2>
            <p>
              Every step hands the next one exactly what it needs. And at each step, you decide what happens: SideKick never sends a
              quote, books a job or charges a card on its own.
            </p>
          </div>
          <WorkflowJourney />
        </div>
      </section>

      {/* 3. Five industries */}
      <section className="section section--white" id="industries">
        <div className="container">
          <div className={s.industryHeading}>
            <div className="section-head"><span className="eyebrow">Built around the work you do</span><h2>Your industry.<br />Your way of working.</h2><p>Five tailored setups. One connected foundation for everything that happens before, during and after the job.</p></div>
            <Image src="/illustrations/service-neighborhood.webp" alt="" width={1200} height={800} sizes="(max-width: 960px) 100vw, 550px" className={s.neighborhood} data-scroll-visual />
          </div>
          <IndustrySwitcher />
          <p className={s.industryMore}>Do something different? <Link href="/industries" className="text-link">Explore all industry setups <ArrowRight aria-hidden /></Link></p>
        </div>
      </section>

      {/* 4. Keep every lead organized */}
      <section className="section">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">Leads</span>
            <h2>Keep every lead organized.</h2>
            <p className="lead">
              Unified lead records, clear assignment, status tracking and team permissions, so nothing sits in someone's inbox.
            </p>
            <ul role="list" className="check-list">
              <li>
                <Check aria-hidden />
                <span>
                  One record per inquiry <span className="muted">Separate requests stay separate, even from the same person.</span>
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  Assignment and status <span className="muted">Know who owns each lead and where it stands.</span>
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  Team permissions <span className="muted">Assigned, team or all access, per role.</span>
                </span>
              </li>
            </ul>
          </div>
          <div data-reveal="scale">
            <div className={s.leadVisual} data-scroll-visual>
              <Browser url="app.sidekickcrm.com/leads">
                <DashboardMock compact />
              </Browser>
              <div className={s.floatCard}>
                <Users aria-hidden />
                <span>
                  <strong>Assigned to Crew A</strong>
                  <em>Status: Quote prepared</em>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI that recommends, you decide */}
      <section className="section section--ice">
        <div className="container split split--flip">
          <div data-reveal>
            <span className="eyebrow">
              AI assistance <FeatureStatusBadge feature="aiSuggestions" />
            </span>
            <h2>AI that recommends. You decide.</h2>
            <p className="lead">
              During onboarding and in everyday fields, SideKick can suggest a setup, a field or a value. Every suggestion waits for your
              review: accept, edit or ignore.
            </p>
            <Link href="/features/ai-mcp" className="text-link" style={{ marginTop: 24 }}>
              How AI and MCP work in SideKick <ArrowRight aria-hidden />
            </Link>
          </div>
          <div data-reveal="scale">
            <AISuggestionMock />
          </div>
        </div>
      </section>

      <MCPConnections />

      {/* 6. Office to field */}
      <section className="section section--navy">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">Office to field</span>
            <h2>The same job, on every screen.</h2>
            <p className="lead">
              Keep the office and the crew working from the same job record. The mobile app is in development; this preview shows how the same work carries across screens.
            </p>
            <ul role="list" className="check-list">
              <li>
                <Check aria-hidden />
                <span>Leads, quotes, jobs, schedules and invoices on mobile</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Photos and status updates from the field</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Role-aware: people see what they are permitted to see</span>
              </li>
            </ul>
            <div className="btn-row" style={{ marginTop: 28 }}>
              <Link href="/features/mobile-app" className="btn btn--light">
                Mobile app <ArrowRight aria-hidden />
              </Link>
              <FeatureStatusBadge feature="mobileApp" />
            </div>
          </div>
          <div className={s.parity} data-reveal="scale">
            <div className={s.parityBrowser}>
              <Browser url="app.sidekickcrm.com/jobs/driveway-clean">
                <div className={s.parityJob}>
                  <span className={s.parityKicker}>Job SK-1042 · Pressure Washing</span>
                  <strong>Driveway + walkway clean</strong>
                  <span className={s.parityStage}>
                    Stage: <b>Washing</b> · Crew A
                  </span>
                  <span className={s.parityBar}>
                    <i style={{ width: "62%" }} />
                  </span>
                </div>
              </Browser>
            </div>
            <div className={s.parityPhone}>
              <Phone>
                <JobPhoneMock />
              </Phone>
            </div>
            <span className={s.syncPill}>
              <ShieldCheck aria-hidden /> One shared record
            </span>
          </div>
        </div>
      </section>

      {/* 7. Your brand online */}
      <section className="section">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">
              Website builder <FeatureStatusBadge feature="websiteBuilder" />
            </span>
            <h2>Your brand online, with a form that lands in your CRM.</h2>
            <p className="lead">
              A guided builder: logo, colors, fonts, hero, sections, preview, publish. Branded service sections and a quote request form
              connected to the right workspace.
            </p>
            <Link href="/features/website-builder" className="text-link" style={{ marginTop: 24 }}>
              See the builder <ArrowRight aria-hidden />
            </Link>
          </div>
          <div data-reveal="scale">
            <BuilderMock />
          </div>
        </div>
      </section>

      {/* 8. Proposals */}
      <section className="section section--white">
        <div className="container split split--flip">
          <div data-reveal>
            <span className="eyebrow">
              Proposals <FeatureStatusBadge feature="proposalEditor" />
            </span>
            <h2>Proposals that fit your business.</h2>
            <p className="lead">
              An editable proposal preview with your branding, a private signing link for the customer and an invoice link when the work
              is done. No customer account needed.
            </p>
            <div className={s.badges}>
              <span>
                <FileSignature aria-hidden /> E-signature <FeatureStatusBadge feature="eSignature" />
              </span>
              <span>
                <Globe aria-hidden /> Private document links
              </span>
            </div>
            <Link href="/features/quotes-proposals" className="text-link" style={{ marginTop: 24 }}>
              Quotes and proposals <ArrowRight aria-hidden />
            </Link>
          </div>
          <div data-reveal="scale">
            <ProposalMock />
          </div>
        </div>
      </section>

      {/* 9. Plans for 1, 2 or 3 services */}
      <section className="section">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">Plans</span>
            <h2>Plans for 1, 2 or 3 services.</h2>
            <p>
              A service workspace is one service-specific setup with its own leads, quotes and jobs. Your team, trucks and equipment are
              shared across all of them.
            </p>
          </div>
          <div className={s.workspaces} data-reveal-stagger>
            {plans.map((p) => (
              <div key={p.key} className={`card card--hover ${s.wsCard} ${p.featured ? s.wsFeatured : ""}`}>
                <span className={s.wsCount}>{p.workspaces}</span>
                <h3>
                  {p.workspaces} service workspace{p.workspaces > 1 ? "s" : ""}
                </h3>
                <p>{p.tagline}</p>
                <div className={s.wsBlocks} aria-hidden>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <i key={i} className={i < p.workspaces ? s.wsOn : ""} />
                  ))}
                </div>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {p.nameConfirmed ? p.name : "Plan name to be confirmed"}
                </span>
              </div>
            ))}
          </div>
          <div className={s.plansCta} data-reveal>
            <Link href="/pricing" className="btn btn--ghost">
              View plans <ArrowRight aria-hidden />
            </Link>
            <span className="muted">Pricing is shared during your demo until public checkout is approved.</span>
          </div>
        </div>
      </section>

      {/* 10. Final navy CTA */}
      <CTASection
        title="Every great business deserves a SideKick."
        body="See the whole workflow with your services and your team in mind."
        primary={{ label: "Book a Demo", href: "/contact" }}
        secondary={{ label: "Explore Features", href: "/features" }}
      />
    </>
  );
}
