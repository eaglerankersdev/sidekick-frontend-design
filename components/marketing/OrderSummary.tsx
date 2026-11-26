import Link from "next/link";
import { LockKeyhole, ReceiptText, Settings2 } from "lucide-react";
import { formatMoney, type LivePlan } from "@/lib/pricing";
import { planCopyByKey } from "@/content/pricing";

const count = (n: number) => n.toLocaleString("en-US");

/** Plan, price and allowances exactly as GET /v1/public/pricing returns them. */
export function OrderSummary({ plan, currency, className = "" }: { plan: LivePlan; currency: string; className?: string }) {
  const rows: [string, string][] = [
    ["Service workspaces", count(plan.workspaces)],
    ["AI credits each month", count(plan.aiCredits)],
    ["Team members included", count(plan.teamMembers)],
  ];
  if (plan.extraMemberMinor !== null) rows.push(["Extra team member", `${formatMoney(plan.extraMemberMinor, currency)} per month each`]);

  return (
    <aside aria-labelledby="summary-title" className={`rounded-xl bg-canvas p-5 sm:p-7 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="summary-title" className="text-xl">
          {plan.name} plan
        </h2>
        <Link href="/pricing#plans" className="-my-2 inline-flex min-h-11 items-center text-[0.92rem] font-bold text-cobalt underline-offset-4 hover:underline">
          Change plan
        </Link>
      </div>
      <p className="mt-1 text-[0.95rem] text-muted">{planCopyByKey[plan.key].tagline}</p>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[2.75rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{formatMoney(plan.priceMinor!, currency)}</span>
        <span className="font-semibold text-muted">per month</span>
      </p>

      <dl className="mt-6 grid gap-3 border-t border-line pt-5 text-[0.95rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

/** Trust cues: only what the flow guarantees (Stripe-hosted payment, webhook-confirmed account, CRM billing). */
export function TrustNotes({ className = "" }: { className?: string }) {
  return (
    <ul role="list" className={`grid gap-3 px-1 text-[0.92rem] text-muted [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-cobalt ${className}`}>
      <li className="flex gap-3">
        <LockKeyhole aria-hidden />
        <span>
          <strong className="text-navy">Secure payment by Stripe.</strong> Your card details go to Stripe, never to SideKick.
        </span>
      </li>
      <li className="flex gap-3">
        <ReceiptText aria-hidden />
        <span>Your account is created only after Stripe confirms the payment.</span>
      </li>
      <li className="flex gap-3">
        <Settings2 aria-hidden />
        <span>Plan changes and cancellation are managed in the CRM.</span>
      </li>
    </ul>
  );
}
