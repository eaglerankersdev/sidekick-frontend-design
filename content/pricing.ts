import type { PlanKey } from "@/lib/pricing";

/**
 * Marketing copy for each plan. Prices, allowances and add-on amounts are never
 * stored here: they come live from the SideKick API (lib/pricing.ts). If the API
 * is unavailable the cards show this copy with "Talk to sales" and no numbers.
 */
export type PlanCopy = {
  key: PlanKey;
  name: string;
  workspaces: 1 | 2 | 3;
  tagline: string;
  featured?: boolean;
};

export const planCopy: PlanCopy[] = [
  { key: "basic", name: "Basic", workspaces: 1, tagline: "One service, fully connected." },
  { key: "growth", name: "Growth", workspaces: 2, tagline: "Two services, shared team and resources.", featured: true },
  { key: "enterprise", name: "Enterprise", workspaces: 3, tagline: "Three services under one business." },
];

export const planCopyByKey = Object.fromEntries(planCopy.map((p) => [p.key, p])) as Record<PlanKey, PlanCopy>;

/** Labels for API module keys (backend BUSINESS_MODULES). Unknown keys are shown humanised. */
export const moduleLabels: Record<string, string> = {
  leads: "Leads",
  quotes: "Quotes",
  jobs: "Jobs and scheduling",
  invoices: "Invoices",
  reports: "Reports",
  websites: "Website builder",
};

export const pricingFaqs = [
  {
    q: "What is the difference between the plans?",
    a: "Each plan sets how many service workspaces, team members and monthly AI credits you get, and how many website pages you can publish. Basic has one workspace, Growth two and Enterprise three. Your staff, trucks and equipment are shared across all of them.",
  },
  {
    q: "What if I need more team members?",
    a: "You can add team members above your plan's limit. Each extra member is a monthly add-on to your subscription.",
  },
  {
    q: "What happens when I run out of AI credits?",
    a: "AI credits refresh with each monthly billing cycle. If you need more before then, you can buy a one-time AI credit top-up.",
  },
  {
    q: "Do privacy and terms pages count toward my website pages?",
    a: "No. Your privacy policy and terms pages are included on every plan and don't count toward the page limit.",
  },
  {
    q: "Are there end-customer accounts?",
    a: "No. People who request service become lead records in your CRM. They open private quote, signature and invoice links without creating an account.",
  },
  {
    q: "Can I buy or change a plan in the mobile app?",
    a: "No. Plans are bought and changed on the web. The web and mobile apps share the same data.",
  },
];
