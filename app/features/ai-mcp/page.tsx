import type { Metadata } from "next";
import { FeatureDetailPage } from "@/components/marketing/FeatureDetailPage";
import { featurePages } from "@/content/feature-pages";

const spec = featurePages["ai-mcp"];

export const metadata: Metadata = {
  title: spec.seoTitle,
  description: spec.seoDescription,
  alternates: { canonical: "/features/ai-mcp" },
};

export default function Page() {
  return <FeatureDetailPage slug="ai-mcp" />;
}
