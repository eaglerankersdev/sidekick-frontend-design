import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy | SideKick CRM",
  description: "Cookies and comparable technologies used on the SideKick public website and the choices available to visitors.",
  alternates: { canonical: "/cookies" },
  robots: { index: false, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      purpose="Explains any cookies or comparable technologies used on the public website and the visitor's available choices. Must match the actual implementation; no tracking is described unless it is configured."
      sections={[
        { id: "necessary", heading: "Necessary session and security cookies", outline: ["Purpose of each necessary cookie"] },
        { id: "analytics", heading: "Analytics or advertising technologies", outline: ["Only if actually installed"] },
        { id: "details", heading: "Duration, provider and purpose", outline: ["Per category: duration, provider, purpose"] },
        { id: "consent", heading: "Consent and preference controls", outline: ["Where legally required"] },
        { id: "browser", heading: "Browser settings, updates and contact", outline: ["Managing cookies in your browser", "Updates to this policy", "Contact"] },
      ]}
    />
  );
}
