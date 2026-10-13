"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { BotMessageSquare, PlugZap, ShieldCheck, BriefcaseBusiness, ArrowRight, LockKeyhole, Check, Network } from "lucide-react";
import { FeatureStatusBadge } from "./ui";
import s from "./MCPConnections.module.css";
import { BrandBadge, BrandLogo } from "./BrandLogo";

const steps = [
  { title: "Connect", label: "Your AI tool", icon: BotMessageSquare, detail: "Start with an MCP-compatible AI client. You choose which tool you want to use with your CRM." },
  { title: "Authorize", label: "MCP connection", icon: PlugZap, detail: "Approve the connection before a tool can request access. An AI client never gets direct database access." },
  { title: "Choose scope", label: "Your permissions", icon: ShieldCheck, detail: "SideKick checks the business, service workspace and role. A tool can only use the access you allow." },
  { title: "Use approved actions", label: "Your CRM", icon: BriefcaseBusiness, detail: "Only approved CRM services can respond. This example allows reading leads in one workspace; it does not allow changes." },
];

export function MCPConnections() {
  const [active, setActive] = useState(2);
  const id = useId();
  const ActiveIcon = steps[active].icon;
  return (
    <section className={`section ${s.section}`} id="mcp" aria-labelledby={`${id}-heading`}>
      <div className="container">
        <div className={s.heading}>
          <div><span className="eyebrow"><Network aria-hidden /> MCP connections <FeatureStatusBadge feature="mcp" /></span><h2 id={`${id}-heading`}>Your CRM. Connected<br className={s.desktopBreak} /> on your terms.</h2></div>
          <div><p>Bring compatible AI tools closer to your work. You decide what they can access, and your CRM permissions still apply.</p><Link href="/features/ai-mcp" className="text-link">Explore AI & MCP <ArrowRight aria-hidden /></Link></div>
        </div>
        <div className={s.clients}>
          <div><span className={s.clientEyebrow}>Familiar tools. Your permissions.</span><p>AI client examples for the planned MCP connection.</p></div>
          <div className={s.clientLogos}><BrandBadge brand="claude" /><BrandBadge brand="chatgpt" /><BrandBadge brand="cursor" /></div>
        </div>
        <div className={s.diagram}>
          <div className={s.diagramTop}><span><span className={s.dot} />Permission-first by design</span><span>Concept preview</span></div>
          <div className={s.nodes} role="group" aria-label="Explore the planned MCP connection steps">
            {steps.map((step, index) => <button key={step.title} type="button" className={`${s.node} ${active === index ? s.active : ""}`}
              aria-pressed={active === index} aria-controls={`${id}-detail`} onClick={() => setActive(index)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(index); }} onFocus={() => setActive(index)}>
              <span className={s.nodeIcon}>{index === 1 ? <BrandLogo brand="mcp" compact /> : <step.icon aria-hidden strokeWidth={1.5} />}</span>
              <span className={s.nodeLabel}>{step.label}</span><span className={s.nodeStep}>{index + 1}. {step.title}</span>
              {index < 3 && <ArrowRight className={s.connector} aria-hidden />}
            </button>)}
          </div>
          <div id={`${id}-detail`} className={s.detail} aria-live="polite" aria-atomic="true"><span className={s.detailIcon}><ActiveIcon aria-hidden /></span><div><strong>{steps[active].title}</strong><p>{steps[active].detail}</p></div></div>
          <div className={s.scope}><span><BriefcaseBusiness aria-hidden /> Workspace: Pressure Washing</span><span><LockKeyhole aria-hidden /> Access: Read leads</span><span className={s.scopeNote}>Example scope</span></div>
        </div>
        <div className={s.bottom}><ul role="list">{["No direct database access", "Your permissions apply", "You control access"].map((text) => <li key={text}><Check aria-hidden />{text}</li>)}</ul><Link href="/integrations" className="text-link">All integrations <ArrowRight aria-hidden /></Link></div>
        <p className={s.note}>MCP connections are planned. This interactive diagram explains the intended permission model; it does not connect to an AI tool.</p>
      </div>
    </section>
  );
}
