"use client";

/**
 * Signature interaction #1: Lead → Quote → Job → Invoice visual journey.
 * Desktop: the step list pins while the preview card on the right cross-fades
 * as the user scrolls. Mobile uses a measured horizontal story driven by normal
 * page scrolling. Reduced motion and short viewports retain the readable list.
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

const records = [
  { title: "Driveway & walkway clean", status: "New request", rows: [["Customer", "Jamie Taylor"], ["Source", "Website form"], ["Service", "Pressure washing"]] },
  { title: "Jamie Taylor", status: "New lead", rows: [["Assigned to", "Alex Morgan"], ["Property", "128 Oak Street"], ["Next step", "Prepare quote"]] },
  { title: "Quote #1042", status: "Ready to review", rows: [["Driveway clean", "$180.00"], ["Walkway clean", "$60.00"], ["Total", "$240.00"]] },
  { title: "Job #1042", status: "Created", rows: [["Customer", "Jamie Taylor"], ["Service", "Driveway & walkway"], ["Quote", "#1042 · accepted"]] },
  { title: "Tuesday, 9:00 AM", status: "Scheduled", rows: [["Crew", "Crew A · 2 people"], ["Vehicle", "Truck 01"], ["Equipment", "Pressure washer"]] },
  { title: "Invoice #1042", status: "Ready to send", rows: [["Customer", "Jamie Taylor"], ["Linked job", "#1042 · completed"], ["Amount due", "$240.00"]] },
  { title: "Payment received", status: "Paid", rows: [["Invoice", "#1042"], ["Amount", "$240.00"], ["Collected through", "Your Stripe account"]] },
];

function MobileRecord({ index }: { index: number }) {
  const record = records[index];
  return <div className={s.record}>
    <div className={s.recordHeader}><span>Sample job · 1042</span><span className={s.recordStatus}>{record.status}</span></div>
    <strong className={s.recordTitle}>{record.title}</strong>
    <dl>{record.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className={s.recordFoot}>One customer. One connected record.</p>
  </div>;
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

    mm.add('(max-width: 959px) and (prefers-reduced-motion: no-preference)', () => {
      const viewport = el.querySelector<HTMLElement>(`.${s.mobileViewport}`)!;
      const rail = el.querySelector<HTMLElement>(`.${s.steps}`)!;
      let tween: gsap.core.Tween | undefined;
      let previousWidth = 0;
      let previousHeight = 0;
      const reset = () => {
        tween?.scrollTrigger?.kill();
        tween?.kill();
        gsap.set(rail, { clearProps: "transform" });
        delete el.dataset.mobileScroll;
        el.style.removeProperty("height");
      };
      const measure = () => {
        const width = el.clientWidth;
        const height = window.innerHeight;
        if (width === previousWidth && height === previousHeight) return;
        previousWidth = width;
        previousHeight = height;
        reset();
        el.dataset.mobileScroll = "true";
        const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) + 12;
        // Never trap tall content behind the browser chrome or fixed navigation.
        if (viewport.offsetHeight + top + 24 > height) {
          reset();
          return;
        }
        const distance = rail.scrollWidth - viewport.clientWidth;
        const scrollDistance = Math.min(viewport.clientWidth, 300) * (steps.length - 1);
        el.style.height = `${viewport.offsetHeight + scrollDistance}px`;
        tween = gsap.to(rail, {
          x: -distance, ease: "none",
          scrollTrigger: {
            trigger: el, start: `top ${top}px`, end: `+=${scrollDistance}`, scrub: true,
            onUpdate: self => setActive(Math.round(self.progress * (steps.length - 1))),
          },
        });
      };
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      window.addEventListener('resize', measure);
      let mounted = true;
      document.fonts.ready.then(() => { if (mounted) { previousWidth = 0; measure(); ScrollTrigger.refresh(); } });
      measure();
      return () => {
        mounted = false;
        observer.disconnect();
        window.removeEventListener('resize', measure);
        reset();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className={s.journey} data-workflow-journey>
      <div className={s.mobileViewport}>
      <div className={s.mobileProgress} aria-hidden="true"><span>Scroll to follow the work</span><span>{String(active + 1).padStart(2, "0")} / 07</span></div>
      <div className={s.steps}>
        <span className={s.track} aria-hidden>
          <span className={s.progress} />
        </span>
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={st.key} data-workflow-card className={`${s.step} ${active === i ? s.stepActive : ""}`}>
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
                <MobileRecord index={i} />
              </div>
            </div>
          );
        })}
      </div>
      <div className={s.mobileMeter} aria-hidden="true"><span style={{ transform: `scaleX(${(active + 1) / steps.length})` }} /></div>
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
