import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Layers3, Smartphone, Workflow, Sparkles, Building2, Store } from "lucide-react";
import { PageHero, CTASection } from "@/components/marketing/ui";
import s from "./about.module.css";

export const metadata: Metadata = {
  title: "About SideKick CRM | Built for Service Businesses",
  description: "SideKick is being built to bring the everyday work of service businesses into one clear, connected place.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About SideKick"
        title="Good software should help you"
        accent="get the job done."
        intro="SideKick is being built to bring the everyday work of service businesses into one clear, connected place."
        actions={
          <>
            <Link href="/features" className="btn btn--primary">
              Meet the Platform <ArrowRight aria-hidden />
            </Link>
            <Link href="/contact" className="btn btn--ghost">
              Book a Demo
            </Link>
          </>
        }
      >
        <div className={s.mascot} aria-hidden>
          <Image src="/brand/sidekick-crm-logo.png" alt="" width={2048} height={778} priority />
        </div>
      </PageHero>

      {/* 1 + 2 */}
      <section className="section section--white">
        <div className="container grid grid--2">
          <div className="card" data-reveal>
            <span className="eyebrow">Our purpose</span>
            <h3>Fewer disconnected tools.</h3>
            <p>
              A request in one inbox, a quote in a spreadsheet, a schedule on a whiteboard and an invoice somewhere else. SideKick exists
              to give that chain one home, with clear lead-to-job-to-payment visibility.
            </p>
          </div>
          <div className="card" data-reveal data-delay="0.1">
            <span className="eyebrow">Why service businesses</span>
            <h3>Because the work moves.</h3>
            <p>
              Managing inquiries, quoting fairly, keeping crews busy and following up on payment is hard when the team is split between an
              office and a job site. That is the problem we build for.
            </p>
          </div>
        </div>
      </section>

      {/* 3. What makes SideKick different */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What makes SideKick different</span>
            <h2>Four decisions we made early.</h2>
          </div>
          <div className="grid grid--4" data-reveal-stagger>
            {[
              { icon: <Layers3 />, t: "Service workspaces", b: "One business, up to three services, each with its own setup and shared resources." },
              { icon: <Smartphone />, t: "Web and mobile, one backend", b: "The field and the office always look at the same record." },
              { icon: <Workflow />, t: "Editable workflows", b: "Stages, fields and forms that match how your service actually runs." },
              { icon: <Sparkles />, t: "Human-reviewed AI", b: "Suggestions you accept, edit or ignore. Never silent changes." },
            ].map((c) => (
              <div key={c.t} className="card card--hover">
                <span className="icon-tile">{c.icon}</span>
                <h3>{c.t}</h3>
                <p>{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Personality */}
      <section className="section section--navy">
        <div className="container split">
          <div data-reveal>
            <span className="eyebrow">The SideKick personality</span>
            <h2>A reliable partner, not a replacement for your judgment.</h2>
            <p className="lead">
              SideKick keeps the work organized and surfaces what needs a decision. The decision stays yours: when to send a quote, who to
              assign, what to charge.
            </p>
            <ul role="list" className="check-list">
              <li>
                <Check aria-hidden />
                <span>Clear over clever</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Honest about what is available today</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Helpful in the background, visible when it matters</span>
              </li>
            </ul>
          </div>
          <div className={s.quoteCard} data-reveal="scale">
            <p>"Every great business deserves a SideKick."</p>
          </div>
        </div>
      </section>

      {/* 5. Two buyer paths */}
      <section className="section section--white">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">For businesses and resellers</span>
            <h2>Two ways to work with SideKick.</h2>
          </div>
          <div className="grid grid--2" data-reveal-stagger>
            <Link href="/industries" className={`card card--hover ${s.path}`}>
              <span className="icon-tile">
                <Building2 />
              </span>
              <h3>I run a service business</h3>
              <p>Use SideKick for your own leads, quotes, jobs and invoices, configured for your service.</p>
              <span className="text-link">
                Explore industries <ArrowRight aria-hidden />
              </span>
            </Link>
            <Link href="/white-label" className={`card card--hover ${s.path}`}>
              <span className="icon-tile">
                <Store />
              </span>
              <h3>I want to resell a white-label CRM</h3>
              <p>Offer a branded CRM to your own clients on SideKick's hosted platform.</p>
              <span className="text-link">
                White-label CRM <ArrowRight aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <CTASection title="Meet the platform." body="See how the pieces fit together, then book a walkthrough." primary={{ label: "Meet the Platform", href: "/features" }} secondary={{ label: "Book a Demo", href: "/contact" }} />
    </>
  );
}
