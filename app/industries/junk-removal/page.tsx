import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/IndustryPage";
import { industryBySlug } from "@/content/industries";

const industry = industryBySlug("junk-removal");

export const metadata: Metadata = {
  title: industry.seoTitle,
  description: industry.seoDescription,
  alternates: { canonical: "/industries/junk-removal" },
};

export default function Page() {
  return <IndustryPage slug="junk-removal" />;
}
