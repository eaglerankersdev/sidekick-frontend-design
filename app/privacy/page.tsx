import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | SideKick CRM",
  description: "How the SideKick marketing website and related services collect, use, share, retain and protect information.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true }, // Do not index until approved counsel copy is published
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      purpose="Explains how the SideKick marketing website and related services collect, use, share, retain and protect information."
      sections={[
        { id: "identity", heading: "Effective date, legal identity and contact", outline: ["Effective date", "Legal company identity", "Privacy contact method"] },
        { id: "information", heading: "Information we collect", outline: ["Site forms", "Cookies and comparable technologies", "Product accounts"] },
        { id: "purposes", heading: "Purposes and legal bases", outline: ["Purposes of processing", "Applicable legal bases where required"] },
        { id: "sharing", heading: "Service providers and processing", outline: ["Service providers", "Payment processors", "Analytics", "Cross-border processing where applicable"] },
        { id: "retention", heading: "Retention, security and your rights", outline: ["Retention periods", "Security measures", "Rights and requests process"] },
        { id: "children", heading: "Children's privacy, changes and contact", outline: ["Children's privacy", "Changes to this policy", "How to contact us"] },
      ]}
    />
  );
}
