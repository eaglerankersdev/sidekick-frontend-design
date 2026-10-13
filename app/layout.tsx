import type { Metadata, Viewport } from "next";
import "@fontsource-variable/quicksand";
import "./globals.css";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { MotionProvider } from "@/lib/motion";
import { SideKickPet } from "@/components/marketing/SideKickPet";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidekickcrm.example";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SideKick CRM | One Platform for Service Businesses",
    template: "%s",
  },
  description:
    "From the first quote request to the final paid invoice, keep your service business moving on your desktop and wherever the work takes you.",
  openGraph: {
    type: "website",
    siteName: "SideKick CRM",
    images: [{ url: "/brand/sidekick-crm-logo.png", width: 2048, height: 778, alt: "SideKick CRM" }],
  },
  icons: { icon: "/brand/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#002052",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ ["--font-sans" as string]: "'Quicksand Variable'" }}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <MotionProvider />
        <SideKickPet />
      </body>
    </html>
  );
}
