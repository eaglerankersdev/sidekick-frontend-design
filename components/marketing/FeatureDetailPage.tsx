import Link from "next/link";
import { MCPConnections } from "./MCPConnections";
import { ArrowRight } from "lucide-react";
import { featurePages } from "@/content/feature-pages";
import { PageHero, SectionList, CTASection, Guardrail, FeatureStatusBadge } from "./ui";
import { AISuggestionMock, BuilderMock, ProposalMock, DispatchMock, TimelineMock, Phone, JobPhoneMock, Browser, PreviewLabel } from "@/components/mocks/Mocks";
import s from "./FeatureDetailPage.module.css";

function Visual({ kind }: { kind: string }) {
  switch (kind) {
    case "ai":
      return <AISuggestionMock />;
    case "builder":
      return <BuilderMock />;
    case "proposal":
      return <ProposalMock />;
    case "schedule":
      return (
        <div className={s.schedule}>
          <DispatchMock />
          <div className={s.scheduleFront}>
            <TimelineMock stages={["Scheduled", "On site", "In progress", "Complete"]} done={2} />
          </div>
        </div>
      );
    case "mobile":
      return (
        <div className={s.mobile}>
          <div className={s.mobileBrowser}>
            <Browser url="app.sidekickcrm.com/jobs">
              <div className={s.mobileSummary}><span>Job SK-1042 · Crew A</span><strong>Driveway + walkway clean</strong><p>The same job, from office to field.</p><TimelineMock stages={["Scheduled", "On site", "In progress", "Complete"]} done={2} /></div>
            </Browser>
          </div>
          <div className={s.mobilePhone}>
            <Phone>
              <JobPhoneMock />
            </Phone>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function FeatureDetailPage({ slug }: { slug: keyof typeof featurePages }) {
  const f = featurePages[slug];
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Features", href: "/features" }, { label: f.eyebrow }]}
        eyebrow={f.eyebrow}
        title={f.heroTitle}
        accent={f.heroAccent}
        intro={f.intro}
        actions={
          <>
            <Link href="/contact" className="btn btn--primary">
              {f.cta} <ArrowRight aria-hidden />
            </Link>
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <FeatureStatusBadge feature={f.status} />
            </span>
          </>
        }
      >
        <div className={s.visual}>
          <PreviewLabel>{f.visual === "ai" || f.visual === "proposal" || f.visual === "builder" ? "Concept preview · sample data" : "Product preview · sample data"}</PreviewLabel>
          <Visual kind={f.visual} />
        </div>
      </PageHero>

      <section className="section section--white">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">In detail</span>
            <h2>How it works.</h2>
          </div>
          <div className={s.layout}>
            <SectionList items={f.sections} />
            <aside className={s.aside}>
              <Guardrail>{f.guardrail}</Guardrail>
              <div className={`card ${s.asideCard}`}>
                <h3>Related</h3>
                <ul role="list" className={s.related}>
                  {Object.values(featurePages)
                    .filter((p) => p.slug !== slug)
                    .map((p) => (
                      <li key={p.slug}>
                        <Link href={`/features/${p.slug}`}>
                          {p.eyebrow} <ArrowRight aria-hidden />
                        </Link>
                      </li>
                    ))}
                  <li>
                    <Link href="/integrations">
                      Integrations <ArrowRight aria-hidden />
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {slug === "ai-mcp" && <MCPConnections />}

      <CTASection title={`${f.cta}.`} body="We will show you what is available today and what is on the way." primary={{ label: f.cta, href: "/contact" }} secondary={{ label: "All features", href: "/features" }} />
    </>
  );
}
