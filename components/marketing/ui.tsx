import Link from "next/link";
import { ArrowRight, Check, Info, ChevronRight } from "lucide-react";
import { STATUS_LABEL, statusOf, type FeatureKey, type FeatureStatus } from "@/content/feature-availability";
import styles from "./ui.module.css";

/* ---------- FeatureStatus badge (reads from the central availability file) ---------- */
export function FeatureStatusBadge({ feature, status }: { feature?: FeatureKey; status?: FeatureStatus | "concept" }) {
  const s = status ?? (feature ? statusOf(feature) : "available");
  const label = s === "concept" ? "Concept preview" : STATUS_LABEL[s];
  return <span className={`status status--${s}`}>{label}</span>;
}

/* ---------- Page hero (used by every inner page) ---------- */
export function PageHero({
  eyebrow,
  title,
  accent,
  intro,
  actions,
  children,
  align = "left",
  tone = "light",
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  intro: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "navy";
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <section className={`${styles.hero} ${tone === "navy" ? styles.heroNavy : ""} ${children ? styles.heroSplit : ""} ${breadcrumbs ? styles.heroWithCrumbs : ""}`}>
      <div className={styles.heroGlow} aria-hidden />
      {breadcrumbs && <div className={`container ${styles.heroCrumbs}`}><Breadcrumbs items={breadcrumbs} /></div>}
      <div className={`container ${styles.heroInner} ${align === "center" ? styles.heroCenter : ""}`}>
        <div className={styles.heroCopy}>
          <div className={styles.heroText}>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className={styles.heroTitle}>
            {title} {accent && <span className="grad-text">{accent}</span>}
          </h1>
          <p className={styles.heroIntro}>
            {intro}
          </p>
          </div>
          {actions && (
            <div className={`btn-row ${styles.heroActions}`}>
              {actions}
            </div>
          )}
        </div>
        {children && (
          <div className={styles.heroVisual} data-reveal="scale" data-delay="0.1">
            <div data-scroll-visual>{children}</div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- CTA section ---------- */
export function CTASection({
  title = "Every great business deserves a SideKick.",
  body = "See the workflow on your own screen, with your services and your team in mind.",
  primary = { label: "Book a Demo", href: "/contact" },
  secondary,
}: {
  title?: string;
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className={`section ${styles.cta}`}>
      <div className="container">
        <div className={styles.ctaCard} data-reveal="scale">
          <div className={styles.ctaOrbA} data-scroll-orb aria-hidden />
          <div className={styles.ctaOrbB} data-scroll-orb aria-hidden />
          <div className={styles.ctaGrid} aria-hidden />
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <Link href={primary.href} className="btn btn--light">
              {primary.label} <ArrowRight aria-hidden />
            </Link>
            {secondary && (
              <Link href={secondary.href} className="btn btn--outline-light">
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ (native details, keyboard accessible, no JS needed) ---------- */
export function FAQ({ items, title = "Frequently asked questions" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <section className="section section--white">
      <div className="container">
        <div className={styles.faqWrap}>
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>{title}</h2>
          </div>
          <div className={styles.faqList} data-reveal-stagger>
            {items.map((f, i) => (
              <details key={i} className={styles.faq} name="faq">
                <summary>
                  <span>{f.q}</span>
                  <ChevronRight aria-hidden />
                </summary>
                <div className={styles.faqBody}>
                  <p>{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Breadcrumbs ---------- */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.crumbs}>
      <ol role="list">
        <li>
          <Link href="/">Home</Link>
        </li>
        {items.map((it, i) => (
          <li key={i} aria-current={i === items.length - 1 ? "page" : undefined}>
            {it.href && i !== items.length - 1 ? <Link href={it.href}>{it.label}</Link> : <span>{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- Feature grid ---------- */
export type FeatureItem = { icon: React.ReactNode; title: string; body: string; feature?: FeatureKey; href?: string };

export function FeatureGrid({ items, columns = 3 }: { items: FeatureItem[]; columns?: 2 | 3 | 4 }) {
  return (
    <div className={`grid grid--${columns}`} data-reveal-stagger>
      {items.map((it) => {
        const inner = (
          <>
            <div className={styles.cardTop}>
              <span className="icon-tile">{it.icon}</span>
              {it.feature && <FeatureStatusBadge feature={it.feature} />}
            </div>
            <h3>{it.title}</h3>
            <p>{it.body}</p>
            {it.href && (
              <span className={`text-link ${styles.cardLink}`}>
                Learn more <ArrowRight aria-hidden />
              </span>
            )}
          </>
        );
        return it.href ? (
          <Link key={it.title} href={it.href} className={`card card--hover ${styles.featureCard}`}>
            {inner}
          </Link>
        ) : (
          <div key={it.title} className={`card card--hover ${styles.featureCard}`}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Workflow stepper (Request → ... → Payment) ---------- */
export function WorkflowStepper({ steps, vertical = false }: { steps: { label: string; detail?: string }[]; vertical?: boolean }) {
  return (
    <ol role="list" className={`${styles.stepper} ${vertical ? styles.stepperVertical : ""}`} data-reveal-stagger data-stagger="0.06">
      {steps.map((s, i) => (
        <li key={s.label} className={styles.step}>
          <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
          <span className={styles.stepLabel}>{s.label}</span>
          {s.detail && <span className={styles.stepDetail}>{s.detail}</span>}
        </li>
      ))}
    </ol>
  );
}

/* ---------- Section list (numbered page sections, from the brief) ---------- */
export function SectionList({
  items,
}: {
  items: { title: string; body: string; bullets?: string[]; status?: FeatureKey; note?: string }[];
}) {
  return (
    <ol role="list" className={styles.sectionList} data-story-list>
      {items.map((it, i) => (
        <li key={it.title} className={styles.sectionItem} data-story-step data-reveal>
          <div className={styles.sectionIndex}>{String(i + 1).padStart(2, "0")}</div>
          <div>
            <div className={styles.sectionTitleRow}>
              <h3>{it.title}</h3>
              {it.status && <FeatureStatusBadge feature={it.status} />}
            </div>
            <p>{it.body}</p>
            {it.bullets && (
              <ul role="list" className="check-list">
                {it.bullets.map((b) => (
                  <li key={b}>
                    <Check aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {it.note && (
              <div className="note">
                <Info aria-hidden />
                <span>{it.note}</span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Guardrail({ children }: { children: React.ReactNode }) {
  return (
    <div className="note" style={{ marginTop: 0 }}>
      <Info aria-hidden />
      <span>{children}</span>
    </div>
  );
}
