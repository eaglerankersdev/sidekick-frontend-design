import type { Metadata } from "next";
import { UpgradeStatus } from "@/components/marketing/UpgradeStatus";
import { cardBase, pageBg } from "@/components/marketing/checkout-styles";
import { wrap } from "@/components/marketing/tw";
import { PUBLIC_ID } from "@/lib/upgrade";

export const metadata: Metadata = {
  title: "Confirming your plan change | SideKick CRM",
  robots: { index: false, follow: false },
};

export default async function UpgradeCompletePage({ searchParams }: { searchParams: Promise<{ change?: string | string[] }> }) {
  const raw = (await searchParams).change;
  const changeId = typeof raw === "string" && PUBLIC_ID.test(raw) ? raw : null;
  return (
    <section className={`${pageBg} grid min-h-[70vh] items-center py-[clamp(40px,6vw,88px)]`}>
      <div className={`${wrap} max-w-[calc(680px+var(--gutter)*2)]`}>
        <div className={`${cardBase} px-[clamp(20px,5vw,48px)] py-[clamp(24px,5vw,44px)]`}>
          <UpgradeStatus changeId={changeId} />
        </div>
      </div>
    </section>
  );
}
