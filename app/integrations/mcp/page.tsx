import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { PageHero, FAQ, CTASection, FeatureStatusBadge } from "@/components/marketing/ui";
import { BrandLogo, type Brand } from "@/components/marketing/BrandLogo";
import s from "./mcp.module.css";

export const metadata: Metadata = {
  title: "Connect an AI App to SideKick CRM | MCP Connection Guide",
  description:
    "How to connect Claude, ChatGPT, Claude Code or Cursor to your SideKick CRM over MCP, what the app can and can’t do, and how to disconnect it.",
  alternates: { canonical: "/integrations/mcp" },
};

// The public half of P4-AI09: a guide only. The address, the connection list and Disconnect live in the CRM
// (Settings → AI connections); the steps below match that screen word for word.
const ADDRESS = "https://<your CRM address>/api/mcp";

const toc = [
  { id: "before", label: "Before you start" },
  { id: "connect", label: "Connect your app" },
  { id: "choose", label: "What you choose" },
  { id: "limits", label: "What it can and can’t do" },
  { id: "lasts", label: "How long it lasts" },
  { id: "disconnect", label: "Disconnect" },
];

const apps: { name: string; brand: Brand; steps: { text: string; code?: string }[] }[] = [
  {
    name: "Claude",
    brand: "claude",
    steps: [
      { text: "In Claude, open Settings, then Connectors, and add a custom connector." },
      { text: "Name it SideKick and paste your address:", code: ADDRESS },
      { text: "Select Connect. Sign in on your SideKick page when asked, choose a business and workspaces, then select Connect." },
    ],
  },
  {
    name: "ChatGPT",
    brand: "chatgpt",
    steps: [
      { text: "In ChatGPT, open Settings, then Apps & Connectors. Under Advanced, turn on developer mode and create a connector." },
      { text: "Paste your address and choose OAuth sign-in:", code: ADDRESS },
      { text: "Sign in on your SideKick page when asked, choose a business and workspaces, then select Connect." },
    ],
  },
  {
    name: "Claude Code",
    brand: "claude",
    steps: [
      { text: "In your terminal, add SideKick as a server:", code: `claude mcp add --transport http sidekick ${ADDRESS}` },
      { text: "Start Claude Code, type /mcp, choose sidekick and select Authenticate." },
      { text: "Sign in on your SideKick page in the browser that opens, choose a business and workspaces, then select Connect." },
    ],
  },
  {
    name: "Cursor",
    brand: "cursor",
    steps: [
      { text: "In Cursor, open Settings, then MCP, and add a new MCP server." },
      { text: "Add this to your MCP settings:", code: `{ "mcpServers": { "sidekick": { "url": "${ADDRESS}" } } }` },
      { text: "Select Login next to SideKick. Sign in on your SideKick page, choose a business and workspaces, then select Connect." },
    ],
  },
];

const can = [
  "Read leads, quotes, jobs and the calendar you can already see, in the workspaces you ticked",
  "Prepare changes, only if you allowed it. Each one waits for your approval in SideKick",
];
const cannot = [
  "See or store your SideKick password",
  "Reach another business, or a workspace you didn’t tick",
  "Do anything your own role in SideKick doesn’t allow",
  "Send, charge or refund money on its own",
  "Query the database directly",
];

const faqs = [
  {
    q: "Is this available on my account?",
    a: "MCP connections are in development. When they open for your account, you’ll find the address and this guide in your CRM under Settings, then AI connections. Ask during your demo for the current status.",
  },
  {
    q: "Which AI apps can connect?",
    a: "Any app that can add a remote MCP server and sign in with OAuth. Claude, ChatGPT, Claude Code and Cursor are covered step by step above. Menu names in those apps change between versions, so look for the nearest match.",
  },
  {
    q: "Can everyone on my team connect their own app?",
    a: "Yes. Each person connects with their own SideKick sign-in, and their app only sees what their role and workspace access allow. Nobody can connect an app on someone else’s behalf.",
  },
  {
    q: "The app says it can’t connect. What should I check?",
    a: "Copy the address again from Settings, then AI connections, and make sure it ends in /api/mcp. Sign in with the account you use for that CRM. If your business doesn’t appear, or appears greyed out, its plan has ended or your access is paused.",
  },
  {
    q: "Why do I have to connect again?",
    a: "A connection ends when you disconnect it, when the business’s plan ends, or when you leave the business. After the plan is renewed, connect again from your AI app and choose your workspaces once more.",
  },
];

export default function McpGuidePage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Integrations", href: "/integrations" }, { label: "MCP connection guide" }]}
        eyebrow="MCP connection guide"
        title="Connect your AI app to SideKick."
        intro="Add one address to Claude, ChatGPT, Claude Code or Cursor, sign in on your own SideKick page and choose what the app can use. Your permissions still decide everything."
      />

      <section className="section section--white" style={{ paddingTop: 40 }}>
        <div className={`container ${s.layout}`}>
          <nav className={s.toc} aria-label="On this page">
            <p>On this page</p>
            <ol role="list">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`}>{t.label}</a>
                </li>
              ))}
            </ol>
            <FeatureStatusBadge feature="mcp" />
          </nav>

          <div className={s.body}>
            <section id="before" className={s.block} aria-labelledby="before-h">
              <h2 id="before-h">Before you start</h2>
              <ul role="list" className={s.needs}>
                <li>
                  <b>A SideKick sign-in</b>
                  <span>For a business whose plan is active, with at least one workspace you can open.</span>
                </li>
                <li>
                  <b>Your address</b>
                  <span>
                    In your CRM, open Settings, then AI connections, and copy it. It ends in <code>/api/mcp</code>.
                  </span>
                </li>
                <li>
                  <b>An AI app</b>
                  <span>One that can add a remote MCP server and sign in with OAuth.</span>
                </li>
              </ul>
            </section>

            <section id="connect" className={s.block} aria-labelledby="connect-h">
              <h2 id="connect-h">Connect your app</h2>
              <p className={s.lead}>Replace the address below with the one from your Settings. Every app ends on the same SideKick page.</p>
              <div className={s.apps}>
                {apps.map((app) => (
                  <article key={app.name} className={s.app} id={`app-${app.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    <header>
                      <BrandLogo brand={app.brand} compact />
                      <h3>{app.name}</h3>
                    </header>
                    <ol className={s.steps}>
                      {app.steps.map((step) => (
                        <li key={step.text}>
                          <span>{step.text}</span>
                          {step.code && <code className={s.code}>{step.code}</code>}
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </section>

            <section id="choose" className={s.block} aria-labelledby="choose-h">
              <h2 id="choose-h">What you choose when you connect</h2>
              <p className={s.lead}>The app sends you to your own SideKick sign-in. It never sees your password. Then you choose:</p>
              <dl className={s.choices}>
                <div>
                  <dt>One business</dt>
                  <dd>If you belong to more than one, pick the one this app is for. Connect again to add another.</dd>
                </div>
                <div>
                  <dt>Workspaces</dt>
                  <dd>Only the ones you tick. Nothing is ticked for you unless you have a single workspace.</dd>
                </div>
                <div>
                  <dt>Read, or read and prepare changes</dt>
                  <dd>Reading is on. Preparing changes is off until you turn it on.</dd>
                </div>
              </dl>
            </section>

            <section id="limits" className={s.block} aria-labelledby="limits-h">
              <h2 id="limits-h">What a connected app can and can’t do</h2>
              <div className={s.limits}>
                <div>
                  <h3>It can</h3>
                  <ul role="list">
                    {can.map((t) => (
                      <li key={t}>
                        <Check aria-hidden className={s.yes} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>It can’t</h3>
                  <ul role="list">
                    {cannot.map((t) => (
                      <li key={t}>
                        <X aria-hidden className={s.no} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className={s.note}>SideKick checks your access on every request, not only when you connect. If your role changes, the app’s reach changes with it.</p>
            </section>

            <section id="lasts" className={s.block} aria-labelledby="lasts-h">
              <h2 id="lasts-h">How long it stays connected</h2>
              <p>
                For as long as the business’s plan is active. The app renews its access on its own, so you won’t be asked to sign in every day. The
                connection ends when:
              </p>
              <ul role="list" className={s.ends}>
                <li>You disconnect it</li>
                <li>The business’s plan ends. Connect again once it’s renewed</li>
                <li>You leave the business, or your access is removed</li>
              </ul>
            </section>

            <section id="disconnect" className={s.block} aria-labelledby="disconnect-h">
              <h2 id="disconnect-h">Disconnect an app</h2>
              <p>
                In your CRM, open Settings, then AI connections. Each app you connected is listed with the business, workspaces and permissions
                you gave it. Select Disconnect and confirm. The app loses access straight away, even if it is in the middle of a task.
              </p>
              <Link href="/integrations#mcp" className="text-link">
                See how a connection looks <ArrowRight aria-hidden />
              </Link>
            </section>
          </div>
        </div>
      </section>

      <FAQ items={faqs} title="Questions about MCP connections" />

      <CTASection
        title="Want to see it with your own CRM?"
        body="We’ll walk through connecting an AI app during your demo and tell you plainly when it opens for your account."
        primary={{ label: "Book a Demo", href: "/contact" }}
        secondary={{ label: "All integrations", href: "/integrations" }}
      />
    </>
  );
}
