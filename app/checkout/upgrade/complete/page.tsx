import type { Metadata } from "next";
import { UpgradeStatus } from "@/components/marketing/UpgradeStatus";
import { section, wrap } from "@/components/marketing/tw";
import { PUBLIC_ID } from "@/lib/upgrade";

export const metadata: Metadata = {
  title: "Confirming your plan change | SideKick CRM",
  robots: { index: false, follow: false },
};

export default async function UpgradeCompletePage({ searchParams }: { searchParams: Promise<{ change?: string | string[] }> }) {
  const raw = (await searchParams).change;
  const changeId = typeof raw === "string" && PUBLIC_ID.test(raw) ? raw : null;
  return (
    <section className={`${section} grid min-h-[70vh] items-center bg-white`}>
      <div className={`${wrap} max-w-[calc(640px+var(--gutter)*2)]`}>
        <UpgradeStatus changeId={changeId} />
      </div>
    </section>
  );
}
