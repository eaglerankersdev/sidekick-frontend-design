/**
 * Plan configuration. Only the workspace allowances are confirmed (1 / 2 / 3).
 * Plan names other than "Basic", prices and feature limits are placeholders
 * awaiting final commercial configuration; nothing here is a published price.
 */
export type Plan = {
  key: string;
  name: string;
  nameConfirmed: boolean;
  workspaces: 1 | 2 | 3;
  tagline: string;
  websitePages: string;
  highlights: string[];
  featured?: boolean;
};

export const plans: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    nameConfirmed: true,
    workspaces: 1,
    tagline: "One service, fully connected.",
    websitePages: "One main page with policy content",
    highlights: ["1 service workspace", "Leads, quotes, jobs, scheduling and invoices", "Team roles and reporting", "Web and mobile access"],
  },
  {
    key: "tier-2",
    name: "Middle tier",
    nameConfirmed: false,
    workspaces: 2,
    tagline: "Two services, shared team and resources.",
    websitePages: "Additional pages (allocation pending)",
    highlights: ["Up to 2 service workspaces", "Everything in Basic", "Shared staff, trucks and equipment across services", "More website pages"],
    featured: true,
  },
  {
    key: "tier-3",
    name: "Highest tier",
    nameConfirmed: false,
    workspaces: 3,
    tagline: "Three services under one business.",
    websitePages: "Most pages (up to a proposed ceiling of 10)",
    highlights: ["Up to 3 service workspaces", "Everything in the middle tier", "Shared staff, trucks and equipment across services", "Most website pages"],
  },
];

/** Rows for the comparison table. Cells are intentionally unchecked (brief §14.4). */
export const comparisonRows = [
  "Lead management",
  "Quotes",
  "Jobs",
  "Scheduling",
  "Invoices",
  "Roles and permissions",
  "Reporting",
  "Mobile app",
  "AI assistance",
  "Website features",
];

export const pricingFaqs = [
  {
    q: "Can I manage multiple services?",
    a: "Yes. Each plan includes a set number of service workspaces: Basic has one, the middle tier up to two, and the highest tier up to three. Your staff, trucks and equipment are shared across all of them.",
  },
  {
    q: "Are there end-customer accounts?",
    a: "No. People who request service become lead records in your CRM. They can open private quote, signature and invoice links without creating an account.",
  },
  {
    q: "Can I access my CRM on mobile?",
    a: "Yes. The web and mobile apps share the same data. A few administrative features, such as bulk import/export, the website builder and plan purchasing, are web-only.",
  },
  {
    q: "How are plan changes handled?",
    a: "Plan purchase and changes happen on the web. Our team can walk you through what changes when you move between workspace allowances.",
  },
];
