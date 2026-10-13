"use client";

/**
 * Signature interaction #2: five-niche switcher.
 * Accessible tabs (roving focus, arrow keys), GSAP cross-fade of the preview.
 */
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { industries } from "@/content/industries";
import { NavIcon } from "./NavIcon";
import { LeadRecordMock, TimelineMock, PreviewLabel } from "@/components/mocks/Mocks";
import { prefersReducedMotion } from "@/lib/motion";
import s from "./IndustrySwitcher.module.css";

export function IndustrySwitcher() {
  const [idx, setIdx] = useState(0);
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!panel.current || prefersReducedMotion()) return;
    const items = panel.current.querySelectorAll(`.${s.anim}`);
    gsap.fromTo(items, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.06, overwrite: true });
  }, [idx]);

  const onKey = (e: React.KeyboardEvent) => {
    const n = industries.length;
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % n;
    else if (e.key === "ArrowLeft") next = (idx - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    setIdx(next);
    tabRefs.current[next]?.focus();
  };

  const ind = industries[idx];

  return (
    <div className={s.wrap}>
      <div role="tablist" aria-label="Industries" className={`${s.tabs} no-scrollbar`} onKeyDown={onKey}>
        {industries.map((it, i) => (
          <button
            key={it.slug}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={idx === i}
            aria-controls={`${id}-panel`}
            tabIndex={idx === i ? 0 : -1}
            className={`${s.tab} ${idx === i ? s.tabActive : ""}`}
            onClick={() => setIdx(i)}
            type="button"
          >
            <NavIcon name={it.icon} />
            {it.navName}
          </button>
        ))}
      </div>

      <div ref={panel} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${idx}`} className={s.panel}>
        <div className={s.copy}>
          <span className={`eyebrow ${s.anim}`}>{ind.name} CRM</span>
          <h3 className={s.anim}>
            {ind.heroTitle} <span className="grad-text">{ind.heroAccent}</span>
          </h3>
          <p className={`lead ${s.anim}`}>{ind.cardBlurb}</p>
          <ul role="list" className={`${s.facts} ${s.anim}`}>
            <li>
              <strong>Request form asks for</strong>
              <span>{ind.formFields.join(" · ")}</span>
            </li>
            <li>
              <strong>{ind.stagesAreExamples ? "Example stages" : "Workflow stages"}</strong>
              <span>{ind.stages.join(" → ")}</span>
            </li>
          </ul>
          <Link href={`/industries/${ind.slug}`} className={`btn btn--primary ${s.anim}`}>
            See {ind.navName} CRM <ArrowRight aria-hidden />
          </Link>
        </div>
        <div className={s.visual}>
          <div className={`${s.visualInner} ${s.anim}`}>
            <PreviewLabel>Same CRM, configured for {ind.navName}</PreviewLabel>
            <div className={s.stack}>
              <div className={s.stackBack}>
                <TimelineMock stages={ind.stages.slice(0, 5)} done={2} example={ind.stagesAreExamples} />
              </div>
              <div className={s.stackFront}>
                <LeadRecordMock service={ind.name} fields={ind.formFields} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
