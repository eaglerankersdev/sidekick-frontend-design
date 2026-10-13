import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/IndustryPage";
import { industryBySlug } from "@/content/industries";

const industry = industryBySlug("concrete-sealing");

export const metadata: Metadata = {
  title: industry.seoTitle,
  description: industry.seoDescription,
  alternates: { canonical: "/industries/concrete-sealing" },
};

export default function Page() {
  return <IndustryPage slug="concrete-sealing" />;
}
