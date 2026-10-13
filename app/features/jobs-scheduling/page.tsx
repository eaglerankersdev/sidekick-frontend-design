import type { Metadata } from "next";
import { FeatureDetailPage } from "@/components/marketing/FeatureDetailPage";
import { featurePages } from "@/content/feature-pages";

const spec = featurePages["jobs-scheduling"];

export const metadata: Metadata = {
  title: spec.seoTitle,
  description: spec.seoDescription,
  alternates: { canonical: "/features/jobs-scheduling" },
};

export default function Page() {
  return <FeatureDetailPage slug="jobs-scheduling" />;
}
