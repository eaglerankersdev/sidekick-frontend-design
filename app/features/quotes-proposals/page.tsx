import type { Metadata } from "next";
import { FeatureDetailPage } from "@/components/marketing/FeatureDetailPage";
import { featurePages } from "@/content/feature-pages";

const spec = featurePages["quotes-proposals"];

export const metadata: Metadata = {
  title: spec.seoTitle,
  description: spec.seoDescription,
  alternates: { canonical: "/features/quotes-proposals" },
};

export default function Page() {
  return <FeatureDetailPage slug="quotes-proposals" />;
}
