import Link from "next/link";
import { ScrollText, ShieldAlert } from "lucide-react";
import { Breadcrumbs } from "./ui";
import s from "./LegalPage.module.css";

export type LegalSection = { id: string; heading: string; outline: string[] };

/**
 * Versionable legal page template: headings, anchor links and last-updated
 * date. The section bodies are intentionally placeholders marked
 * "Awaiting approved counsel copy" and must NOT be published as binding terms.
 */
export function LegalPage({
  title,
  purpose,
  lastUpdated,
  version,
  sections,
}: {
  title: string;
  purpose: string;
  lastUpdated?: string;
  version?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <Breadcrumbs items={[{ label: title }]} />
      <article className={s.layout}>
        <header className={s.head}>
          <span className="eyebrow">
            <ScrollText aria-hidden style={{ width: 16, height: 16 }} /> Legal
          </span>
          <h1>{title}</h1>
          <p className="lead">{purpose}</p>
          <dl className={s.meta}>
            <div>
              <dt>Last updated</dt>
              <dd>{lastUpdated ?? "Not yet published"}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{version ?? "Draft template"}</dd>
            </div>
          </dl>

          <div className={s.notice} role="note">
            <ShieldAlert aria-hidden />
            <div>
              <strong>Awaiting approved counsel copy.</strong> This page is a structural template. The outline below lists the sections legal
              review must cover; it is not policy text and must not be published as binding terms.
            </div>
          </div>
        </header>

        <aside className={s.toc}>
          <span className={s.tocTitle}>On this page</span>
          <nav aria-label={`${title} sections`}>
            <ol role="list">
              {sections.map((sec, i) => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`}>
                    <span>{String(i + 1).padStart(2, "0")}</span> {sec.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <div className={s.article}>
          {sections.map((sec, i) => (
            <section key={sec.id} id={sec.id} className={s.section}>
              <h2>
                <span className={s.num}>{String(i + 1).padStart(2, "0")}</span> {sec.heading}
                <a href={`#${sec.id}`} className={s.anchor} aria-label={`Link to ${sec.heading}`}>
                  #
                </a>
              </h2>
              <p className={s.placeholder}>Approved copy for this section will appear here.</p>
              <ul className={s.outline}>
                {sec.outline.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </section>
          ))}

          <footer className={s.foot}>
            Questions about this page? <Link href="/contact">Contact SideKick</Link>.
          </footer>
        </div>
      </article>
    </div>
  );
}
