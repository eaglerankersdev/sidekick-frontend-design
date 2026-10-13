import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/IndustryPage";
import { industryBySlug } from "@/content/industries";

const industry = industryBySlug("pressure-washing");

export const metadata: Metadata = {
  title: industry.seoTitle,
  description: industry.seoDescription,
  alternates: { canonical: "/industries/pressure-washing" },
};

export default function Page() {
  return <IndustryPage slug="pressure-washing" />;
}
