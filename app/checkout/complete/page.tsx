import type { Metadata } from "next";
import { CheckoutStatus } from "@/components/marketing/CheckoutStatus";
import { cardBase, pageBg } from "@/components/marketing/checkout-styles";
import { wrap } from "@/components/marketing/tw";
import { SIGNUP_ID } from "@/lib/signup";

export const metadata: Metadata = {
  title: "Confirming your payment | SideKick CRM",
  robots: { index: false, follow: false },
};

export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ signup?: string | string[] }> }) {
  const raw = (await searchParams).signup;
  const signupId = typeof raw === "string" && SIGNUP_ID.test(raw) ? raw : null;
  return (
    <section className={`${pageBg} grid min-h-[70vh] items-center py-[clamp(40px,6vw,88px)]`}>
      <div className={`${wrap} max-w-[calc(680px+var(--gutter)*2)]`}>
        <div className={`${cardBase} px-[clamp(20px,5vw,48px)] py-[clamp(24px,5vw,44px)]`}>
          <CheckoutStatus signupId={signupId} />
        </div>
      </div>
    </section>
  );
}
