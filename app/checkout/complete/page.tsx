import type { Metadata } from "next";
import { CheckoutStatus } from "@/components/marketing/CheckoutStatus";
import { section, wrap } from "@/components/marketing/tw";
import { SIGNUP_ID } from "@/lib/signup";

export const metadata: Metadata = {
  title: "Confirming your payment | SideKick CRM",
  robots: { index: false, follow: false },
};

export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ signup?: string | string[] }> }) {
  const raw = (await searchParams).signup;
  const signupId = typeof raw === "string" && SIGNUP_ID.test(raw) ? raw : null;
  return (
    <section className={`${section} grid min-h-[70vh] items-center bg-white`}>
      <div className={`${wrap} max-w-[calc(640px+var(--gutter)*2)]`}>
        <CheckoutStatus signupId={signupId} />
      </div>
    </section>
  );
}
