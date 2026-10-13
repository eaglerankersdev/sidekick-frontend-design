import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/IndustryPage";
import { industryBySlug } from "@/content/industries";

const industry = industryBySlug("towing");

export const metadata: Metadata = {
  title: industry.seoTitle,
  description: industry.seoDescription,
  alternates: { canonical: "/industries/towing" },
};

export default function Page() {
  return <IndustryPage slug="towing" />;
}
