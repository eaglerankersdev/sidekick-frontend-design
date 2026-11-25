import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowRight, CalendarCheck, MailCheck, ShieldCheck } from "lucide-react";
import { PageHero, FAQ } from "@/components/marketing/ui";
import { DemoLeadForm } from "@/components/marketing/DemoLeadForm";
import { section, textLink, wrap } from "@/components/marketing/tw";
import { parsePlanKey } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Contact SideKick CRM | Book a Product Demo",
  description: "Tell us what you do and what you'd like to manage better. We'll help you explore the right SideKick workflow.",
  alternates: { canonical: "/contact" },
};

const faqs = [
  { q: "Where can I see pricing?", a: "Plans and monthly prices are on the pricing page. If you are not sure which plan fits, choose Not sure above and we will help you decide." },
  { q: "Is my industry supported?", a: "Pressure washing, concrete sealing, towing, junk removal and painting have tailored setups. Other services can be configured from supported building blocks, with your review." },
];

const notes = [
  {
    icon: <CalendarCheck aria-hidden />,
    title: "What the demo is",
    body: "A guided preview of the workflow on a call, scheduled with you by email after you submit the form. There is no instant calendar booking yet.",
  },
  {
    icon: <MailCheck aria-hidden />,
    title: "What happens next",
    body: "You see a confirmation here, and our team follows up by email to arrange a time. We do not promise a specific response time.",
  },
  {
    icon: <ShieldCheck aria-hidden />,
    title: "Your information",
    body: (
      <>
        Used only to respond to your inquiry. See the{" "}
        <Link href="/privacy" className="font-bold text-cobalt underline-offset-4 hover:underline">
          privacy policy
        </Link>
        . The form includes spam protection.
      </>
    ),
  },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ audience?: string; industry?: string; plan?: string | string[] }> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="Contact / Book a demo"
        title="Let's see how SideKick"
        accent="fits your business."
        intro="Tell us what you do and what you'd like to manage better. We'll help you explore the right SideKick workflow."
      />

      <section className={`${section} bg-white pt-10!`}>
        <div className={`${wrap} grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14`}>
          <div className="min-w-0" data-reveal>
            <DemoLeadForm
              defaultAudience={sp.audience === "reseller" ? "reseller" : "provider"}
              defaultIndustry={sp.industry}
              defaultPlan={parsePlanKey(sp.plan)}
              idempotencyKey={randomUUID()}
            />
          </div>
          <aside className="grid gap-2 lg:sticky lg:top-[calc(var(--header-h)+32px)]">
            <ul role="list" className="grid gap-1 rounded-xl bg-canvas p-3 sm:p-4">
              {notes.map((n) => (
                <li key={n.title} className="grid grid-cols-[44px_1fr] gap-4 rounded-lg p-3 sm:p-4">
                  <span className="grid size-11 place-items-center rounded-[14px] bg-white text-cobalt shadow-sm [&_svg]:size-[22px]">{n.icon}</span>
                  <div>
                    <h2 className="text-lg leading-snug">{n.title}</h2>
                    <p className="mt-1.5 text-[0.95rem] text-muted">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-5 px-1 py-2">
              <Link href="/pricing" className={textLink}>
                Pricing <ArrowRight aria-hidden />
              </Link>
              <Link href="/industries" className={textLink}>
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
