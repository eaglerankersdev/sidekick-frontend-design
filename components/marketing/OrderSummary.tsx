import { LockKeyhole, ReceiptText, Settings2 } from "lucide-react";

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
