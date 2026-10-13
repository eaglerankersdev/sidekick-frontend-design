/**
 * Single source of truth for public feature-status labels (brief rule 4.9).
 *
 * IMPORTANT: these values are design placeholders. Before launch, product must
 * confirm each status against the real release state. Changing a value here
 * updates every badge on the site; never hard-code a status in a component.
 */
export type FeatureStatus = "available" | "in-development" | "planned" | "pending-review";

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  available: "Available",
  "pending-review": "Availability pending",
  "in-development": "In development",
  planned: "Planned",
};

export const featureAvailability = {
  leads: "pending-review",
  quotes: "pending-review",
  jobs: "pending-review",
  scheduling: "pending-review",
  invoices: "pending-review",
  stripeInvoices: "pending-review",
  rbac: "pending-review",
  reporting: "pending-review",
  serviceWorkspaces: "pending-review",

  aiSuggestions: "in-development",
  aiOnboarding: "in-development",
  aiPricingAssist: "in-development",
  aiDocumentAssist: "planned",
  mcp: "planned",

  proposalEditor: "in-development",
  eSignature: "in-development",
  websiteBuilder: "in-development",
  mobileApp: "in-development",
  dispatchBoard: "in-development",

  emailSender: "in-development",
  webhooks: "in-development",
  metaLeads: "planned",
  callRail: "planned",
  areaVerification: "planned",
} as const satisfies Record<string, FeatureStatus>;

export type FeatureKey = keyof typeof featureAvailability;

export function statusOf(key: FeatureKey): FeatureStatus {
  return featureAvailability[key];
}
