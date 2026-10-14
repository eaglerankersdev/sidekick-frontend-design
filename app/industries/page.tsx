import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sparkles, Users, FileText, Briefcase, CalendarDays, Receipt, BarChart3, Inbox } from "lucide-react";
import { PageHero, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { IndustrySwitcher } from "@/components/marketing/IndustrySwitcher";
import { industries } from "@/content/industries";
import s from "./industries.module.css";

export const metadata: Metadata = {
  title: "SideKick CRM for Service Businesses | Explore Industries",
  description:
    "Every service business has its own way of quoting and getting jobs done. SideKick starts with a shared CRM foundation and adapts its setup to your service.",
  alternates: { canonical: "/industries" },
};

const shared = [
  { icon: <Inbox />, label: "Lead intake" },
  { icon: <Users />, label: "Assignments" },
  { icon: <FileText />, label: "Quotes" },
  { icon: <Briefcase />, label: "Jobs" },
  { icon: <CalendarDays />, label: "Scheduling" },
  { icon: <Receipt />, label: "Invoices" },
  { icon: <BarChart3 />, label: "Reporting" },
];

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Built around"
        accent="the work you do."
        intro="Every service business has its own way of quoting and getting jobs done. SideKick starts with a shared CRM foundation and adapts its setup to your service."
        actions={
          <>
            <a href="#industries" className="btn btn--primary">
              Find Your Industry <ArrowRight aria-hidden />
            </a>
            <Link href="/contact" className="btn btn--ghost">
              Book a Demo
            </Link>
          </>
        }
      ><Image src="/illustrations/service-neighborhood.webp" alt="" width={1200} height={800} sizes="(max-width: 960px) 100vw, 650px" className={s.neighborhood} priority /></PageHero>

      {/* 1. Five featured industries */}
      <section className="section section--white" id="industries" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className={`grid grid--3 ${s.cards}`} data-reveal-stagger>
            {industries.map((ind) => (
              <Link key={ind.slug} href={`/industries/${ind.slug}`} className={`card card--hover ${s.card}`}>
                <div className={s.cardPhoto} aria-hidden>
                  <Image src={`/images/industries/${ind.slug}.svg`} alt="" width={800} height={500} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 400px" />
                </div>
                <h3>{ind.name}</h3>
                <p>{ind.cardBlurb}</p>
                <span className="text-link">
                  {ind.name} CRM <ArrowRight aria-hidden />
                </span>
              </Link>
            ))}
            <div className={`card ${s.card} ${s.cardOther}`}>
              <div className={s.cardArt} aria-hidden>
                <Sparkles />
              </div>
              <h3>
                Other services <FeatureStatusBadge feature="aiOnboarding" />
              </h3>
              <p>Describe your service and SideKick proposes a setup from supported CRM building blocks, for you to review.</p>
              <Link href="/contact" className="text-link">
                Talk to us <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2 + 3. Shared vs changes */}
      <section className="section">
        <div className="container">
          <div className={s.twoCol}>
            <div className={`card ${s.col}`} data-reveal>
              <span className="eyebrow">What every industry shares</span>
              <h2>The same foundation.</h2>
              <p className="lead">No niche gets a separate CRM. Everyone runs on the same platform and the same data model.</p>
              <ul role="list" className={s.sharedList}>
                {shared.map((it) => (
                  <li key={it.label}>
                    <span className="icon-tile" style={{ marginBottom: 0 }}>
                      {it.icon}
                    </span>
                    {it.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`card ${s.col} ${s.colNavy}`} data-reveal data-delay="0.1">
              <span className="eyebrow">What changes by service</span>
              <h2>The setup on top.</h2>
              <p className="lead">Each industry gets configuration that matches how its work is actually quoted and done.</p>
              <ul role="list" className="check-list">
                <li>
                  <Check aria-hidden />
                  <span>Onboarding questions</span>
                </li>
                <li>
                  <Check aria-hidden />
                  <span>Relevant fields on the request form and lead</span>
                </li>
                <li>
                  <Check aria-hidden />
                  <span>Workflow stages on jobs</span>
                </li>
                <li>
                  <Check aria-hidden />
                  <span>Supported pricing configuration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Industry preview switcher */}
      <section className="section section--ice">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">Preview</span>
            <h2>Switch the service. Watch the setup change.</h2>
            <p>Only configured features are shown for each niche.</p>
          </div>
          <IndustrySwitcher />
        </div>
      </section>

      {/* 5 + 6. Other services, multiple services */}
      <section className="section section--white">
        <div className="container grid grid--2">
          <div className="card" data-reveal>
            <span className="eyebrow">
              Other services <FeatureStatusBadge feature="aiOnboarding" />
            </span>
            <h3>Not one of the five?</h3>
            <p>
              Describe what you do. SideKick proposes an onboarding setup assembled from supported CRM building blocks, and you review
              every suggestion before it is applied.
            </p>
          </div>
          <div className="card" data-reveal data-delay="0.1">
            <span className="eyebrow">Multiple services</span>
            <h3>One business, up to three workspaces.</h3>
            <p>
              Run pressure washing and concrete sealing side by side. Each service gets its own workspace, while staff, trucks and
              equipment are shared. Your plan sets the allowance: 1, 2 or 3.
            </p>
            <Link href="/pricing" className="text-link" style={{ marginTop: 14 }}>
              View plans <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <CTASection title="Find your industry's workflow." body="Pick a niche above, or book a demo and we will walk through your service." />
    </>
  );
}
