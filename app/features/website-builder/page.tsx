import type { Metadata } from "next";
import { FeatureDetailPage } from "@/components/marketing/FeatureDetailPage";
import { featurePages } from "@/content/feature-pages";

const spec = featurePages["website-builder"];

export const metadata: Metadata = {
  title: spec.seoTitle,
  description: spec.seoDescription,
  alternates: { canonical: "/features/website-builder" },
};

export default function Page() {
  return <FeatureDetailPage slug="website-builder" />;
}
