import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | SideKick CRM",
  description: "Public terms governing SideKick website and product use.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      purpose="Public terms governing SideKick website and product use, subject to the final company contracting model. Reseller and provider contracts are not identical."
      sections={[
        { id: "acceptance", heading: "Legal entity, acceptance and eligibility", outline: ["Contracting entity", "Acceptance of terms", "Eligibility"] },
        { id: "scope", heading: "Service scope, accounts and permitted use", outline: ["Service scope", "Accounts", "Permitted and prohibited use"] },
        { id: "billing", heading: "Subscription, billing and reseller terms", outline: ["Subscription and billing references", "Applicable reseller-specific terms"] },
        { id: "data", heading: "Data rights, confidentiality and intellectual property", outline: ["Data rights", "Confidentiality", "Intellectual property"] },
        { id: "availability", heading: "Availability, third-party services and limitations", outline: ["Availability", "Third-party services", "Limitations of liability"] },
        { id: "termination", heading: "Termination, disputes, jurisdiction and updates", outline: ["Termination", "Disputes and jurisdiction", "Contact", "Updates to these terms"] },
      ]}
    />
  );
}
