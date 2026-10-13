"use client";

/**
 * Signature interaction #1: Lead → Quote → Job → Invoice visual journey.
 * Desktop: the step list pins while the preview card on the right cross-fades
 * as the user scrolls (GSAP ScrollTrigger, scrub). Mobile / reduced motion:
 * plain stacked blocks, no pinning, no scroll-jacking.
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Inbox, Users, FileText, Briefcase, CalendarDays, Receipt, CreditCard } from "lucide-react";
import { LeadRecordMock, QuoteMock, TimelineMock, InvoiceMock, DispatchMock, PreviewLabel } from "@/components/mocks/Mocks";
import { REDUCED } from "@/lib/motion";
import s from "./WorkflowJourney.module.css";

const steps = [
  { icon: Inbox, title: "Request", body: "A branded form or a manual entry captures the inquiry.", key: "request" },
  { icon: Users, title: "Lead", body: "Every request becomes its own lead record with status, source and assignment.", key: "lead" },
  { icon: FileText, title: "Quote", body: "You prepare the quote with your approved price rules, and you decide when to send it.", key: "quote" },
  { icon: Briefcase, title: "Job", body: "Create the job when you are ready. Nothing is booked automatically.", key: "job" },
  { icon: CalendarDays, title: "Schedule", body: "Assign crews, trucks and equipment from a shared resource pool.", key: "schedule" },
  { icon: Receipt, title: "Invoice", body: "Create the invoice in the CRM, tied to the exact lead and job.", key: "invoice" },
  { icon: CreditCard, title: "Payment", body: "Collect through your own Stripe account. Paid status syncs back.", key: "payment" },
];

function Visual({ k }: { k: string }) {
  switch (k) {
    case "request":
      return <LeadRecordMock service="Pressure Washing" fields={["Contact", "Service", "Address", "Photos"]} />;
    case "lead":
      return <LeadRecordMock service="Pressure Washing" fields={["Status: New", "Assigned to", "Source", "Notes"]} />;
    case "quote":
      return (
        <QuoteMock
          lines={[
            ["Driveway clean", "Approx. 900 sq ft"],
            ["Walkway clean", "Approx. 120 sq ft"],
            ["Price rule", "Provider-approved"],
          ]}
        />
      );
    case "job":
      return <TimelineMock stages={["Quote accepted", "Job created", "Crew assigned", "Completed"]} done={2} />;
    case "schedule":
      return <DispatchMock />;
    case "invoice":
      return <InvoiceMock />;
    default:
      return <InvoiceMock />;
  }
}

export function WorkflowJourney() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();

    mm.add(`(min-width: 960px) and (prefers-reduced-motion: no-preference)`, () => {
      const items = gsap.utils.toArray<HTMLElement>(`.${s.step}`, el);
      const visuals = gsap.utils.toArray<HTMLElement>(`.${s.visual}`, el);
      gsap.set(visuals, { autoAlpha: 0, y: 24, scale: 0.98 });
      gsap.set(visuals[0], { autoAlpha: 1, y: 0, scale: 1 });

      const triggers = items.map((item, i) =>
        ScrollTrigger.create({
          trigger: item,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (!self.isActive) return;
            setActive(i);
            visuals.forEach((v, j) =>
              gsap.to(v, {
                autoAlpha: j === i ? 1 : 0,
                y: j === i ? 0 : j < i ? -24 : 24,
                scale: j === i ? 1 : 0.98,
                duration: 0.5,
                ease: "power3.out",
                overwrite: true,
              }),
            );
          },
        }),
      );
      const line = el.querySelector<HTMLElement>(`.${s.progress}`);
      const lineTween = line
        ? gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: { trigger: el.querySelector(`.${s.steps}`), start: "top center", end: "bottom center", scrub: 0.4 },
            },
          )
        : null;
      return () => {
        triggers.forEach((t) => t.kill());
        lineTween?.scrollTrigger?.kill();
        lineTween?.kill();
      };
    });

    mm.add(`(max-width: 959px), ${REDUCED}`, () => {
      gsap.set(el.querySelectorAll(`.${s.visual}`), { clearProps: "all" });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className={s.journey}>
      <div className={s.steps}>
        <span className={s.track} aria-hidden>
          <span className={s.progress} />
        </span>
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={st.key} className={`${s.step} ${active === i ? s.stepActive : ""}`}>
              <span className={s.stepIcon}>
                <Icon aria-hidden />
              </span>
              <div>
                <span className={s.stepIndex}>Step {i + 1}</span>
                <h3>{st.title}</h3>
                <p>{st.body}</p>
              </div>
              {/* Mobile-only inline visual (hidden on desktop by CSS) */}
              <div className={s.inlineVisual}>
                <Visual k={st.key} />
              </div>
            </div>
          );
        })}
      </div>
      <div className={s.stage} aria-hidden>
        <div className={s.stageInner}>
          <PreviewLabel />
          <div className={s.visuals}>
            {steps.map((st) => (
              <div key={st.key} className={s.visual}>
                <Visual k={st.key} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
