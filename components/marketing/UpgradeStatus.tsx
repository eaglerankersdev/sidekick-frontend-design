"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, Loader2, SearchX, ShieldCheck } from "lucide-react";
import type { ChangeView } from "@/lib/upgrade";
import { pollDelay } from "./CheckoutStatus";
import { btnGhost, btnPrimary } from "./tw";

type View = ChangeView | { state: "timeout" };

const MAX_WAIT_MS = 120_000;
/** A bank check can take a while; keep listening for longer while the payment page is open. */
const MAX_PAY_WAIT_MS = 15 * 60_000;

export function UpgradeStatus({ changeId }: { changeId: string | null }) {
  const [view, setView] = useState<View>(changeId ? { state: "wait" } : { state: "not_found" });
  const [round, setRound] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const settled = !["wait", "error", "pay"].includes(view.state);

  useEffect(() => {
    if (!changeId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    let paying = false;
    const poll = async (attempt: number) => {
      let next: View = { state: "error" };
      try {
        const res = await fetch(`/checkout/upgrade/complete/status?change=${encodeURIComponent(changeId)}`, { cache: "no-store" });
        next = (await res.json()) as ChangeView;
      } catch {
        // Offline or a hiccup: the next poll may succeed.
      }
      if (stopped) return;
      if (next.state === "wait" || next.state === "error" || next.state === "pay") {
        if (next.state === "pay") paying = true;
        if (Date.now() - started >= (paying ? MAX_PAY_WAIT_MS : MAX_WAIT_MS)) return setView({ state: "timeout" });
        if (next.state !== "error") setView(next);
        timer = setTimeout(() => poll(attempt + 1), paying ? 4000 : pollDelay(attempt));
        return;
      }
      setView(next);
    };
    poll(0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [changeId, round]);

  useEffect(() => {
    if (settled || view.state === "pay") headingRef.current?.focus();
  }, [view.state, settled]);

  const c = content(view, () => {
    setView({ state: "wait" });
    setRound((r) => r + 1);
  });

  return (
    <div aria-live="polite" className="grid min-h-[360px] content-center justify-items-start gap-5 sm:min-h-[320px]">
      <span className={`grid size-14 place-items-center rounded-2xl [&>svg]:size-7 ${c.tone}`}>{c.icon}</span>
      <h1 ref={headingRef} tabIndex={-1} className="outline-none! text-h2 text-balance max-sm:text-[clamp(1.85rem,7.8vw,2.4rem)] max-sm:leading-[1.15]">
        {c.title}
      </h1>
      <p className="max-w-[52ch] text-lead leading-[1.55]">{c.body}</p>
      {c.actions && <div className="mt-2 flex flex-wrap gap-3">{c.actions}</div>}
    </div>
  );
}

const date = (iso: string | null) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
};

function content(view: View, checkAgain: () => void) {
  const crm = (url: string | null) =>
    url ? (
      <a href={url} className={btnPrimary}>
        Open SideKick <ArrowRight aria-hidden />
      </a>
    ) : undefined;
  switch (view.state) {
    case "wait":
    case "error":
      return {
        tone: "bg-ice text-cobalt",
        icon: <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />,
        title: "Confirming your payment",
        body: "Your plan changes as soon as the payment goes through. Keep this page open; it updates by itself.",
      };
    case "pay":
      return {
        tone: "bg-ice text-cobalt",
        icon: <ShieldCheck aria-hidden />,
        title: "Confirm the payment with your bank",
        body: "Your bank asked for an extra check. Open Stripe's secure payment page, confirm it there, then come back to this tab. It updates by itself.",
        actions: (
          <a href={view.url} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            Confirm payment on Stripe <ArrowUpRight aria-hidden />
          </a>
        ),
      };
    case "paid":
      return {
        tone: "bg-ok-bg text-ok",
        icon: <CheckCircle2 aria-hidden />,
        title: "Upgrade complete",
        body: "Payment received. Your new plan and add-ons are ready in SideKick now.",
        actions: crm(view.crmUrl),
      };
    case "scheduled":
      return {
        tone: "bg-ice text-cobalt",
        icon: <CalendarClock aria-hidden />,
        title: "Your change is scheduled",
        body: `Nothing was charged today. Your plan changes at your next renewal${date(view.renewalAt) ? ` on ${date(view.renewalAt)}` : ""}.`,
        actions: crm(view.crmUrl),
      };
    case "failed":
      return {
        tone: "bg-danger-bg text-danger",
        icon: <AlertCircle aria-hidden />,
        title: "Your payment didn't go through",
        body: "Your plan hasn't changed. Try again, or update your card in the CRM under Billing.",
        actions: (
          <>
            <Link href="/checkout/upgrade" className={btnPrimary}>
              Try again <ArrowRight aria-hidden />
            </Link>
            <Link href="/contact" className={btnGhost}>
              Talk to sales
            </Link>
          </>
        ),
      };
    case "timeout":
      return {
        tone: "bg-ice text-cobalt",
        icon: <Clock3 aria-hidden />,
        title: "Still confirming your payment",
        body: "This is taking longer than usual. Your plan changes as soon as the payment goes through; you can also check it in the CRM under Billing.",
        actions: (
          <button type="button" onClick={checkAgain} className={btnPrimary}>
            Check again
          </button>
        ),
      };
    case "not_found":
      return {
        tone: "bg-canvas text-muted",
        icon: <SearchX aria-hidden />,
        title: "We couldn't find this change",
        body: "The link may be out of date, or it was opened in a different browser. You can check your plan in the CRM under Billing.",
        actions: (
          <Link href="/checkout/upgrade" className={btnPrimary}>
            Start again <ArrowRight aria-hidden />
          </Link>
        ),
      };
  }
}
