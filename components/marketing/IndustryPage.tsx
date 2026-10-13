import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industries, industryBySlug, type IndustrySlug } from "@/content/industries";
import { PageHero, SectionList, CTASection, Guardrail } from "./ui";
import { NavIcon } from "./NavIcon";
import {
  Browser,
  Phone,
  LeadRecordMock,
  QuoteMock,
  TimelineMock,
  DispatchMock,
  BeforeAfterMock,
  ProposalMock,
  JobPhoneMock,
  DashboardMock,
  PreviewLabel,
} from "@/components/mocks/Mocks";
import s from "./IndustryPage.module.css";

function HeroVisual({ slug }: { slug: IndustrySlug }) {
  const ind = industryBySlug(slug);
  switch (ind.visual) {
    case "estimate":
      return (
        <div className={s.stack}>
          <LeadRecordMock service={ind.name} fields={ind.formFields} />
          <div className={s.stackFront}>
            <QuoteMock
              title="Estimate"
              lines={[
                ["Driveway", "Approx. 900 sq ft (manual)"],
                ["Walkway", "Approx. 120 sq ft (manual)"],
                ["Price rule", "Provider-approved"],
              ]}
            />
          </div>
        </div>
      );
    case "timeline":
      return (
        <div className={s.stack}>
          <TimelineMock stages={ind.stages} done={3} example />
          <div className={s.stackFrontSm}>
            <LeadRecordMock service={ind.name} fields={ind.formFields.slice(0, 2)} />
          </div>
        </div>
      );
    case "dispatch":
      return (
        <div className={s.stackWide}>
          <DispatchMock />
          <div className={s.phoneCorner}>
            <Phone>
              <JobPhoneMock title="Sedan tow · Main St" stage="Assigned" crew="Truck 2" />
            </Phone>
          </div>
        </div>
      );
    case "beforeAfter":
      return (
        <div className={s.stack}>
          <BeforeAfterMock />
          <div className={s.stackFrontSm}>
            <TimelineMock stages={ind.stages.slice(0, 4)} done={2} />
          </div>
        </div>
      );
    case "proposal":
      return (
        <div className={s.stack}>
          <ProposalMock />
          <div className={s.stackFrontSm}>
            <TimelineMock stages={["Planned", "Prep", "Painting", "Walkthrough"]} done={1} />
          </div>
        </div>
      );
  }
}

export function IndustryPage({ slug }: { slug: IndustrySlug }) {
  const ind = industryBySlug(slug);
  const others = industries.filter((i) => i.slug !== slug);
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Industries", href: "/industries" }, { label: ind.name }]}
        eyebrow={`${ind.name} CRM`}
        title={ind.heroTitle}
        accent={ind.heroAccent}
        intro={ind.intro}
        actions={
          <>
            <Link href="/contact" className="btn btn--primary">
              {ind.cta} <ArrowRight aria-hidden />
            </Link>
            <Link href="/features" className="btn btn--ghost">
              Explore Features
            </Link>
          </>
        }
      >
        <div className={s.heroVisual}>
          <PreviewLabel />
          <HeroVisual slug={slug} />
        </div>
      </PageHero>

      <section className="section section--white">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>The {ind.name.toLowerCase()} workflow, step by step.</h2>
          </div>
          <div className={s.layout}>
            <SectionList items={ind.sections} />
            <aside className={s.aside}>
              <div className={s.asideCard}>
                <PreviewLabel>Workspace preview</PreviewLabel>
                <Browser url={`app.sidekickcrm.com/${ind.slug}`}>
                  <DashboardMock compact />
                </Browser>
                <Guardrail>{ind.guardrail}</Guardrail>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">More industries</span>
            <h2>Same foundation, other setups.</h2>
          </div>
          <div className="grid grid--4" data-reveal-stagger>
            {others.map((o) => (
              <Link key={o.slug} href={`/industries/${o.slug}`} className="card card--hover">
                <span className="icon-tile">
                  <NavIcon name={o.icon} />
                </span>
                <h3>{o.name}</h3>
                <p>{o.cardBlurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection title={`See ${ind.name.toLowerCase()} in SideKick.`} body="A walkthrough of your workflow, with your services in mind." primary={{ label: ind.cta, href: "/contact" }} />
    </>
  );
}
