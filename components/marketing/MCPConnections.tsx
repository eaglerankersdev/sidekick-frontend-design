"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Network } from "lucide-react";
import { FeatureStatusBadge } from "./ui";
import s from "./MCPConnections.module.css";
import { BrandBadge } from "./BrandLogo";

// The MCP section: the four real steps of connecting an AI app, next to a faithful miniature of SideKick's own
// consent screen (the CRM's /connect/consent). Choosing a step lights the part of the screen it refers to, and the
// visitor can tick the workspaces and permissions as a member would. Nothing here connects to anything.

const steps = [
  { title: "Paste your address", detail: "Copy your SideKick address from Settings and add it to Claude, ChatGPT, Cursor or another app that connects to MCP servers." },
  { title: "Sign in on your page", detail: "The app opens your own SideKick sign-in. It never sees your password." },
  { title: "Choose what it can use", detail: "One business, only the workspaces you tick, and whether it may read or also prepare changes." },
  { title: "Approve, then work", detail: "Anything it prepares waits for your approval in SideKick. Disconnect it anytime in Settings." },
] as const;
type Region = "address" | "sign-in" | "choice" | "approve";
const REGION: Region[] = ["address", "sign-in", "choice", "approve"];

export function MCPConnections() {
  const id = useId();
  const [active, setActive] = useState(2);
  const [workspaces, setWorkspaces] = useState({ washing: true, windows: false });
  const [read, setRead] = useState(true);
  const [prepare, setPrepare] = useState(false);
  const on = (r: Region) => (REGION[active] === r ? s.lit : "");
  const chosen = Object.values(workspaces).filter(Boolean).length;
  return (
    <section className={`section ${s.section}`} id="mcp" aria-labelledby={`${id}-heading`}>
      <div className="container">
        <div className={s.heading}>
          <div>
            {/* taste-skill-ignore: the site-wide section label, kept for consistency with every other section */}
            <span className="eyebrow" /* taste-skill-ignore */>
              <Network aria-hidden /> MCP connections <FeatureStatusBadge feature="mcp" />
            </span>
            <h2 id={`${id}-heading`}>
              Your CRM in your AI app.
              <br className={s.desktopBreak} /> On your terms.
            </h2>
          </div>
          <div>
            <p>Let an AI app read the work you can already see, in the workspaces you choose. Your CRM permissions still decide everything.</p>
            <div className={s.clients}>
              <span>Apps that connect to MCP servers, such as</span>
              <div className={s.clientLogos}>
                <BrandBadge brand="claude" />
                <BrandBadge brand="chatgpt" />
                <BrandBadge brand="cursor" />
              </div>
            </div>
          </div>
        </div>

        <div className={s.stage}>
          <ol className={s.steps} aria-label="How connecting works">
            {steps.map((step, i) => (
              <li key={step.title}>
                <button
                  type="button"
                  className={`${s.step} ${active === i ? s.current : ""} ${i < active ? s.done : ""}`}
                  aria-pressed={active === i}
                  onClick={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setActive(i);
                  }}
                >
                  <span className={s.stepTitle}>{step.title}</span>
                  <span className={s.stepDetail}>{step.detail}</span>
                </button>
              </li>
            ))}
          </ol>

          <figure className={s.screen} aria-label="Example: SideKick’s connection screen" data-ui>
            <div className={`${s.address} ${on("address")}`}>
              <span className={s.addressLabel}>Server address</span>
              <code>https://crm.yourbusiness.com<wbr />/api/mcp</code>
            </div>
            <div className={s.card}>
              <div className={`${s.cardHead} ${on("sign-in")}`}>
                <p className={s.cardTitle}>Connect Claude to SideKick.</p>
                <div className={s.link} aria-hidden>
                  <span className={s.tileApp}>C</span>
                  <span className={s.dash} />
                  <span className={s.lock}>
                    <LockKeyhole />
                  </span>
                  <span className={s.dash} />
                  <span className={s.tileYou}>S</span>
                </div>
                <p className={s.meta}>
                  Published by <b>claude.ai</b> · signed in as <b>owner@yourbusiness.com</b>
                </p>
              </div>
              <div className={`${s.choices} ${on("choice")}`}>
                <p className={s.group}>Business</p>
                <p className={s.business}>
                  <span className={s.radio} aria-hidden /> Rivera Exterior Care
                </p>
                <p className={s.group}>Workspaces</p>
                <label className={s.check}>
                  <input type="checkbox" checked={workspaces.washing} onChange={(e) => setWorkspaces((w) => ({ ...w, washing: e.target.checked }))} />
                  <span>Pressure Washing</span>
                </label>
                <label className={s.check}>
                  <input type="checkbox" checked={workspaces.windows} onChange={(e) => setWorkspaces((w) => ({ ...w, windows: e.target.checked }))} />
                  <span>Window Cleaning</span>
                </label>
                <p className={s.group}>What Claude can do</p>
                <label className={s.check}>
                  <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
                  <span>
                    Read your CRM <small>Leads, quotes, jobs and your calendar</small>
                  </span>
                </label>
                <label className={s.check}>
                  <input type="checkbox" checked={prepare} onChange={(e) => setPrepare(e.target.checked)} />
                  <span>
                    Prepare changes <small>Nothing changes until you approve it</small>
                  </span>
                </label>
              </div>
              <div className={`${s.actions} ${on("approve")}`}>
                <span className={s.connect}>
                  {REGION[active] === "approve" ? (
                    <>
                      <Check aria-hidden /> Connected
                    </>
                  ) : (
                    "Connect Claude"
                  )}
                </span>
                <span className={s.cancel}>Cancel</span>
              </div>
            </div>
            <figcaption className={s.caption} aria-live="polite">
              {chosen || "No"} workspace{chosen === 1 ? "" : "s"} · {read ? (prepare ? "read and prepare changes" : "read only") : prepare ? "prepare changes only" : "nothing allowed yet"}
            </figcaption>
          </figure>
        </div>

        <div className={s.bottom}>
          <ul role="list">
            {["No direct database access", "Your permissions apply on every request", "Disconnect anytime"].map((text) => (
              <li key={text}>
                <Check aria-hidden />
                {text}
              </li>
            ))}
          </ul>
          <div className={s.links}>
            <Link href="/integrations/mcp" className="text-link">
              Read the connection guide <ArrowRight aria-hidden />
            </Link>
            <Link href="/integrations" className="text-link">
              All integrations <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
        <p className={s.note}>MCP connections are in development. Ask during your demo when they open for your account.</p>
      </div>
    </section>
  );
}
