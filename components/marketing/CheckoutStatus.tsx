"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Loader2, SearchX, UserRound } from "lucide-react";
import type { StatusView } from "@/lib/signup";
import { btnGhost, btnPrimary } from "./tw";

type View = StatusView | { state: "timeout" };

const POLL_MS = 2000;
const MAX_WAIT_MS = 120_000;
const FORWARD_MS = 2500;

/** 2 s for the first 30 s, then slowing to 10 s; gives up after about 2 minutes. */
export const pollDelay = (attempt: number) => (attempt < 15 ? POLL_MS : Math.min(POLL_MS * 1.5 ** (attempt - 14), 10_000));

export function CheckoutStatus({ signupId }: { signupId: string | null }) {
  const [view, setView] = useState<View>(signupId ? { state: "wait", status: "processing" } : { state: "not_found" });
  const [round, setRound] = useState(0); // bumping it restarts polling ("Check again")
  const headingRef = useRef<HTMLHeadingElement>(null);
  const waiting = view.state === "wait" || view.state === "error";

  useEffect(() => {
    if (!signupId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const poll = async (attempt: number) => {
      let next: View = { state: "error" };
      try {
        const res = await fetch(`/checkout/complete/status?signup=${encodeURIComponent(signupId)}`, { cache: "no-store" });
        next = (await res.json()) as StatusView;
      } catch {
        // Offline or the server hiccuped: keep waiting, the next poll may succeed.
      }
      if (stopped) return;
      if (next.state === "wait" || next.state === "error") {
        if (Date.now() - started >= MAX_WAIT_MS) return setView({ state: "timeout" });
        if (next.state === "wait") setView(next);
        timer = setTimeout(() => poll(attempt + 1), pollDelay(attempt));
        return;
      }
      setView(next);
    };
    poll(0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [signupId, round]);

  // Move focus to the new heading once the outcome is known, so keyboard and screen reader users land on it.
  useEffect(() => {
    if (!waiting) headingRef.current?.focus();
  }, [view.state, waiting]);

  useEffect(() => {
    if (view.state !== "set_password") return;
    const t = setTimeout(() => window.location.assign(view.url), FORWARD_MS);
    return () => clearTimeout(t);
  }, [view]);

  const c = content(view, () => {
    setView({ state: "wait", status: "processing" });
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

function content(view: View, checkAgain: () => void) {
  const spinner = <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />;
  switch (view.state) {
    case "wait":
    case "error":
      return {
        tone: "bg-ice text-cobalt",
        icon: spinner,
        title: "Confirming your payment",
        body: "Stripe is confirming your payment with us. Keep this page open; it updates by itself.",
      };
    case "set_password":
      return {
        tone: "bg-ok-bg text-ok",
        icon: <CheckCircle2 aria-hidden />,
        title: "Payment confirmed. Set your password",
        body: "Your SideKick account is ready. Taking you to set your password now.",
        actions: (
          <a href={view.url} className={btnPrimary}>
            Set your password <ArrowRight aria-hidden />
          </a>
        ),
      };
    case "sign_in":
      return {
        tone: "bg-ice text-cobalt",
        icon: <UserRound aria-hidden />,
        title: "You already have an account",
        body: "This email already has a SideKick account. Sign in to continue.",
        actions: (
          <a href={view.url} className={btnPrimary}>
            Sign in <ArrowRight aria-hidden />
          </a>
        ),
      };
    case "retry":
      return {
        tone: "bg-danger-bg text-danger",
        icon: <AlertCircle aria-hidden />,
        title: view.status === "expired" ? "This checkout has expired" : "Your payment didn't go through",
        body:
          view.status === "expired"
            ? "Checkout links stay open for a limited time. Start again and it only takes a minute."
            : "Your account wasn't created. You can try again, or talk to our sales team.",
        actions: (
          <>
            <Link href={`/checkout?plan=${view.planKey}`} className={btnPrimary}>
              Try again <ArrowRight aria-hidden />
            </Link>
            <Link href={`/contact?plan=${view.planKey}`} className={btnGhost}>
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
        body: "This is taking longer than usual. We'll also email you a link to set your password once the payment is confirmed.",
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
        title: "We couldn't find this checkout",
        body: "The link may be out of date, or it was opened in a different browser. If you paid, check your email for a link to set your password.",
        actions: (
          <Link href="/pricing#plans" className={btnPrimary}>
            Back to pricing <ArrowRight aria-hidden />
          </Link>
        ),
      };
  }
}
