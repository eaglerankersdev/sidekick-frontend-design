"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUp, CalendarDays, Check, FileText, LockKeyhole, Network, PenLine } from "lucide-react";
import { FeatureStatusBadge } from "./ui";
import { BrandBadge } from "./BrandLogo";
import s from "./MCPConnections.module.css";

// The MCP section: what a connection is for, shown as a conversation in an AI app that uses SideKick. The visitor picks
// a question; the app reads through SideKick (or prepares a change that waits for approval) and answers. Sample rows use
// service names only, never a business or customer. Nothing here connects to anything.

type Row = { main: string; meta: string; value?: string };
type Convo = {
  ask: string;
  tool: { icon: typeof FileText; action: string };
  intro: string;
  rows?: Row[];
  draft?: { title: string; body: string };
  outro: string;
};

const CONVOS: Convo[] = [
  {
    ask: "Which quotes are still waiting on a reply?",
    tool: { icon: FileText, action: "Read quotes" },
    intro: "Three quotes are waiting on the customer:",
    rows: [
      { main: "House wash", meta: "Sent 6 days ago", value: "$480" },
      { main: "Driveway sealing", meta: "Sent 4 days ago", value: "$1,150" },
      { main: "Gutter cleaning", meta: "Sent yesterday", value: "$220" },
    ],
    outro: "Want me to draft a follow-up for the oldest one?",
  },
  {
    ask: "What’s on the calendar tomorrow?",
    tool: { icon: CalendarDays, action: "Read calendar" },
    intro: "Three jobs are booked for tomorrow:",
    rows: [
      { main: "Roof soft wash", meta: "Crew A", value: "8:00" },
      { main: "Patio sealing", meta: "Crew B", value: "11:30" },
      { main: "House wash", meta: "Crew A", value: "2:00" },
    ],
    outro: "Crew A has a two-hour gap after the roof job.",
  },
  {
    ask: "Draft a follow-up for the oldest quote",
    tool: { icon: PenLine, action: "Prepare a change" },
    intro: "I’ve prepared a follow-up for the house wash quote:",
    draft: {
      title: "Follow-up email",
      body: "Hi, just checking in on the house wash quote we sent last week. Happy to answer any questions or find a date that suits you.",
    },
    outro: "Nothing is sent until you approve it in SideKick.",
  },
];

const STEPS = [
  { title: "Copy your address", body: "Find it in SideKick under Settings, then AI connections." },
  { title: "Sign in and choose", body: "Pick the business, the workspaces and whether the app may prepare changes." },
  { title: "Ask", body: "The app answers from your CRM, within your role’s access." },
];

export function MCPConnections() {
  const id = useId();
  const [active, setActive] = useState(0);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const convo = CONVOS[active];
  const Tool = convo.tool.icon;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function ask(i: number) {
    if (i === active && !thinking) return;
    setActive(i);
    window.clearTimeout(timer.current);
    // A short pause reads as the app calling SideKick; skipped when the visitor prefers less motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setThinking(false);
    setThinking(true);
    timer.current = window.setTimeout(() => setThinking(false), 700);
  }

  return (
    <section className={`section ${s.section}`} id="mcp" aria-labelledby={`${id}-heading`}>
      <div className="container">
        <div className={s.heading}>
          <div>
            <span className="eyebrow" /* taste-skill-ignore: the site-wide section label */>
              <Network aria-hidden /> MCP connections <FeatureStatusBadge feature="mcp" />
            </span>
            <h2 id={`${id}-heading`}>Ask your CRM from your AI app.</h2>
          </div>
          <div>
            <p>Connect SideKick to the AI app you already use. It reads the work you can see, and anything it prepares waits for your approval.</p>
            <div className={s.clients}>
              <BrandBadge brand="claude" />
              <BrandBadge brand="chatgpt" />
              <BrandBadge brand="cursor" />
            </div>
          </div>
        </div>

        <div className={s.stage}>
          <figure className={s.window} aria-label="Example conversation in an AI app connected to SideKick" data-ui>
            <div className={s.bar} aria-hidden>
              <span className={s.dots}>
                <i />
                <i />
                <i />
              </span>
              <span className={s.barTitle}>Your AI app</span>
              <span className={s.connected}>
                <span className={s.mark}>S</span> SideKick connected
              </span>
            </div>

            <div className={s.thread} aria-live="polite">
              <div key={`q${active}`} className={`${s.ask} ${s.in}`}>
                {convo.ask}
              </div>

              <div key={`t${active}`} className={`${s.tool} ${s.in}`} style={{ animationDelay: "120ms" }}>
                <span className={s.mark} aria-hidden>
                  S
                </span>
                <span>
                  <b>SideKick</b> · {convo.tool.action}
                </span>
                <span className={s.toolScope}>
                  <Tool aria-hidden /> Pressure Washing workspace
                </span>
              </div>

              {thinking ? (
                <div className={s.thinking} aria-label="Working">
                  <i />
                  <i />
                  <i />
                </div>
              ) : (
                <div key={`a${active}`} className={`${s.answer} ${s.in}`}>
                  <p>{convo.intro}</p>
                  {convo.rows && (
                    <ul role="list" className={s.rows}>
                      {convo.rows.map((r) => (
                        <li key={r.main + r.value}>
                          <span>
                            <b>{r.main}</b>
                            <small>{r.meta}</small>
                          </span>
                          {r.value && <span className={s.value}>{r.value}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {convo.draft && (
                    <div className={s.draft}>
                      <p className={s.draftTitle}>
                        <PenLine aria-hidden /> {convo.draft.title}
                      </p>
                      <p>{convo.draft.body}</p>
                      <p className={s.pending}>
                        <LockKeyhole aria-hidden /> Waiting for your approval in SideKick
                      </p>
                    </div>
                  )}
                  <p>{convo.outro}</p>
                </div>
              )}
            </div>

            <div className={s.composer}>
              <p className={s.tryLabel} id={`${id}-try`}>
                Try asking
              </p>
              <div className={s.chips} role="group" aria-labelledby={`${id}-try`}>
                {CONVOS.map((c, i) => (
                  <button key={c.ask} type="button" className={s.chip} aria-pressed={active === i} onClick={() => ask(i)}>
                    {c.ask}
                  </button>
                ))}
              </div>
              <div className={s.input} aria-hidden>
                <span>Ask anything</span>
                <span className={s.send}>
                  <ArrowUp />
                </span>
              </div>
            </div>
          </figure>
        </div>

        <ol className={s.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className={s.num} aria-hidden>
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>

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
          </div>
        </div>
        <p className={s.note}>MCP connections are in development. Ask during your demo when they open for your account.</p>
      </div>
    </section>
  );
}
