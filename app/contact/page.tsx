import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, MailCheck, ShieldCheck } from "lucide-react";
import { PageHero, FAQ } from "@/components/marketing/ui";
import { DemoLeadForm } from "@/components/marketing/DemoLeadForm";
import s from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact SideKick CRM | Book a Product Demo",
  description: "Tell us what you do and what you'd like to manage better. We'll help you explore the right SideKick workflow.",
  alternates: { canonical: "/contact" },
};

const faqs = [
  { q: "Where can I see pricing?", a: "Plan structure is on the pricing page: 1, 2 or 3 service workspaces. Prices are shared during your demo until public checkout is approved." },
  { q: "Is my industry supported?", a: "Pressure washing, concrete sealing, towing, junk removal and painting have tailored setups. Other services can be configured from supported building blocks, with your review." },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ audience?: string; industry?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="Contact / Book a demo"
        title="Let's see how SideKick"
        accent="fits your business."
        intro="Tell us what you do and what you'd like to manage better. We'll help you explore the right SideKick workflow."
      />

      <section className="section section--white" style={{ paddingTop: 40 }}>
        <div className={`container ${s.layout}`}>
          <div className={s.formCol} data-reveal>
            <DemoLeadForm defaultAudience={sp.audience === "reseller" ? "reseller" : "provider"} defaultIndustry={sp.industry} />
          </div>
          <aside className={s.aside}>
            <div className={`card ${s.asideCard}`} data-reveal data-delay="0.1">
              <span className="icon-tile">
                <CalendarCheck />
              </span>
              <h3>What the demo is</h3>
              <p>A guided preview of the workflow on a call, scheduled with you by email after you submit the form. There is no instant calendar booking yet.</p>
            </div>
            <div className={`card ${s.asideCard}`} data-reveal data-delay="0.18">
              <span className="icon-tile">
                <MailCheck />
              </span>
              <h3>What happens next</h3>
              <p>You see a confirmation here, and our team follows up by email to arrange a time. We do not promise a specific response time.</p>
            </div>
            <div className={`card ${s.asideCard}`} data-reveal data-delay="0.26">
              <span className="icon-tile">
                <ShieldCheck />
              </span>
              <h3>Your information</h3>
              <p>
                Used only to respond to your inquiry. See the <Link href="/privacy">privacy policy</Link>. The form includes spam protection.
              </p>
            </div>
            <div className={s.links}>
              <Link href="/pricing" className="text-link">
                Pricing <ArrowRight aria-hidden />
              </Link>
              <Link href="/industries" className="text-link">
                Industries <ArrowRight aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <FAQ items={faqs} title="Before you book" />
    </>
  );
}
