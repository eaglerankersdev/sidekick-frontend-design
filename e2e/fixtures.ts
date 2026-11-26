// Contract-shaped sample of GET /v1/public/pricing (owner-decided values), for tests only.
const plan = (key: string, name: string, priceMinor: number, workspaces: number, aiCredits: number, teamMembers: number, maxPages: number, servicePages: string, modules: string[]) => ({
  key, name, priceMinor, interval: "month", workspaces, aiCredits, teamMembers, extraMemberMinor: 1000,
  website: { maxPages, policyPagesCount: false, servicePages }, modules, available: true,
});
const core = ["leads", "quotes", "jobs", "invoices", "reports", "websites"];
export const pricing = {
  currency: "usd",
  plans: [
    plan("basic", "Basic", 4999, 1, 600, 2, 1, "none", core),
    plan("growth", "Growth", 9999, 2, 1500, 5, 6, "single", core),
    plan("enterprise", "Enterprise", 14999, 3, 2500, 10, 10, "dedicated", core),
  ],
  topUp: { credits: 1000, priceMinor: 1000 },
  addons: { extraMember: { priceMinor: 1000, interval: "month" }, creditPack: { credits: 1000, priceMinor: 1000 } },
};

