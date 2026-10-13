import type { FeatureKey } from "./feature-availability";

export type FeaturePageSection = { title: string; body: string; bullets?: string[]; status?: FeatureKey; note?: string };

export type FeaturePageSpec = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroAccent: string;
  intro: string;
  status: FeatureKey;
  cta: string;
  visual: "ai" | "builder" | "proposal" | "schedule" | "mobile";
  sections: FeaturePageSection[];
  guardrail: string;
};

export const featurePages: Record<string, FeaturePageSpec> = {
  "ai-mcp": {
    slug: "ai-mcp",
    seoTitle: "SideKick AI & MCP | Helpful Suggestions, Human Control",
    seoDescription: "Get useful recommendations while configuring your CRM, without giving up control over the final setup.",
    eyebrow: "AI & MCP",
    heroTitle: "Smart help.",
    heroAccent: "Your decisions.",
    intro: "Get useful recommendations while configuring your CRM, without giving up control over the final setup.",
    status: "aiSuggestions",
    cta: "Request an AI Walkthrough",
    visual: "ai",
    sections: [
      { title: "Curated niche onboarding", body: "Guided questions for the five selected industries produce a proposed setup you review.", status: "aiOnboarding" },
      { title: "Other services", body: "Describe your service. AI proposes only supported CRM fields and workflows, never invented ones.", status: "aiOnboarding" },
      { title: "Inline suggestions", body: "In everyday fields, you select, edit or ignore each recommendation.", status: "aiSuggestions" },
      { title: "Pricing assistance", body: "Editable suggestions for your price rules. Customer prices are never published automatically.", status: "aiPricingAssist" },
      { title: "Document assistance", body: "Extract and organize content from your existing documents into editable proposals, where supported.", status: "aiDocumentAssist" },
      {
        title: "MCP, simply explained",
        body: "Authorized AI tools can use approved CRM actions through secure permissions. They never get direct database access.",
        status: "mcp",
        note: "Capabilities are described only after they are implemented.",
      },
      { title: "Control and security", body: "Business and workspace roles, review gates, backend-only AI credentials and usage limits.", bullets: ["RBAC at business and workspace level", "Explicit accept / edit / ignore gates", "Credentials stay on the backend", "Usage limits per business"] },
    ],
    guardrail: "Autonomous account changes are never the default. Every AI suggestion waits for a person.",
  },
  "website-builder": {
    slug: "website-builder",
    seoTitle: "SideKick Website Builder | A Site That Looks Like Your Business",
    seoDescription: "Start with your logo, choose your style, arrange your sections and publish a site that fits your services.",
    eyebrow: "Website builder",
    heroTitle: "A professional website.",
    heroAccent: "Without the complicated builder.",
    intro: "Start with your logo, choose your style, arrange your sections and publish a site that fits your services.",
    status: "websiteBuilder",
    cta: "See the Builder",
    visual: "builder",
    sections: [
      { title: "Guided setup", body: "Seven steps, in order.", bullets: ["Logo", "Colors", "Fonts", "Hero", "Sections", "Preview", "Publish"] },
      { title: "Hero variants", body: "Image-led, video-led and a quote-request-focused variant.", note: "The third variant is proposed and pending." },
      { title: "Editable components", body: "Service cards, about, gallery, testimonials, FAQ and contact content, where supported." },
      { title: "Multiple services", body: "List several offerings even on a single-page site.", note: "Listing a service on your website is not the same as enabling an extra CRM workspace." },
      { title: "Plan-based pages", body: "Basic includes one main page with manageable policy content. Higher plans support multiple pages.", note: "Target is up to ten pages; final allocation is pending." },
      { title: "Static publishing", body: "Edit later and republish. Quote forms on your site connect to the correct CRM workspace." },
    ],
    guardrail: "The builder is web-only. Customers can view published sites on any mobile browser.",
  },
  "quotes-proposals": {
    slug: "quotes-proposals",
    seoTitle: "SideKick Quotes & Proposals | From Request to Approval",
    seoDescription: "Create a clear quote, present your work professionally and keep the document connected to the lead.",
    eyebrow: "Quotes & proposals",
    heroTitle: "Turn a request into a proposal",
    heroAccent: "worth saying yes to.",
    intro: "Create a clear quote, present your work professionally and keep the document connected to the lead.",
    status: "proposalEditor",
    cta: "Explore Proposal Workflows",
    visual: "proposal",
    sections: [
      { title: "Provider controls the quote", body: "A lead submission never forces automatic pricing or sending. You decide both.", status: "quotes" },
      { title: "Flexible quote details", body: "Service lines, quantities, approved pricing rules and manual overrides.", status: "quotes" },
      { title: "Proposal templates", body: "Branded themes, colors, fonts, images and editable sections.", status: "proposalEditor" },
      { title: "Bring your own document", body: "AI-assisted content extraction into an editable template.", status: "aiDocumentAssist", note: "No promise of pixel-perfect recreation." },
      { title: "Customer review and signature", body: "A private, document-specific link. No customer account required.", status: "eSignature" },
      { title: "Versions matter", body: "The exact sent and signed version is preserved even when later drafts change." },
    ],
    guardrail: "Proposal editor visuals on this page are concept previews until real screenshots are approved.",
  },
  "jobs-scheduling": {
    slug: "jobs-scheduling",
    seoTitle: "SideKick Jobs & Scheduling | Keep Work Moving",
    seoDescription: "Keep scheduled jobs, assignments and progress connected, whether your team is in the office or out on a job.",
    eyebrow: "Jobs & scheduling",
    heroTitle: "The right work. The right crew.",
    heroAccent: "The right time.",
    intro: "Keep scheduled jobs, assignments and progress connected, whether your team is in the office or out on a job.",
    status: "scheduling",
    cta: "See the Workflow",
    visual: "schedule",
    sections: [
      { title: "From lead to work", body: "You create a job when you are ready. There is no compulsory automatic booking.", status: "jobs" },
      { title: "Job stages", body: "Service-specific steps and updates on one shared record.", status: "jobs" },
      { title: "Schedule and assign", body: "Appointments, employees or crews and available resources.", status: "scheduling" },
      { title: "Shared resources", body: "Avoid overlapping use of a worker, truck or piece of equipment across service workspaces." },
      { title: "Dispatch where relevant", body: "A separate dispatch interface backed by the same scheduling and resource data.", status: "dispatchBoard" },
      { title: "Web + mobile parity", body: "The field team updates progress; the office sees the same status.", status: "mobileApp" },
    ],
    guardrail: "Route optimization, live GPS and offline sync are not promised.",
  },
  "mobile-app": {
    slug: "mobile-app",
    seoTitle: "SideKick CRM Mobile App | Your Business in Your Pocket",
    seoDescription: "Open the same leads, quotes, jobs, schedules and invoices from a mobile experience built for busy service teams.",
    eyebrow: "Mobile app",
    heroTitle: "Your work doesn't stop at your desk.",
    heroAccent: "Neither should your CRM.",
    intro: "Open the same leads, quotes, jobs, schedules and invoices from a mobile experience built for busy service teams.",
    status: "mobileApp",
    cta: "Request Mobile Demo",
    visual: "mobile",
    sections: [
      { title: "Same business, same data", body: "One shared backend across the Next.js web app and the React Native / Expo mobile app." },
      { title: "Manage leads on the go", body: "View, create, assign and update the records you are permitted to." },
      { title: "Jobs and schedules", body: "Review assigned work, upload photos and update stages." },
      { title: "Quotes and invoices", body: "Create and review permitted records. Customers pay through invoice links, not app-store billing." },
      { title: "Role-aware experience", body: "Owners, managers, staff, resellers and Super Admin functions, according to permissions." },
      {
        title: "Web-only exceptions",
        body: "Some administrative work stays on the web.",
        bullets: ["Bulk import / export", "Website builder and publishing", "Website page management", "Excel email campaigns", "CRM plan purchasing"],
        note: "Mobile subscription-management UX is still undecided.",
      },
    ],
    guardrail: "No app-store badges are shown until actual public listings exist.",
  },
};
