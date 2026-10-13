export type NavLink = { label: string; href: string; description?: string; icon?: string };

export const productNav: NavLink[] = [
  { label: "All Features", href: "/features", description: "Leads, quotes, jobs, invoices and more", icon: "layout-grid" },
  { label: "AI & MCP", href: "/features/ai-mcp", description: "Helpful suggestions, human control", icon: "sparkles" },
  { label: "Website Builder", href: "/features/website-builder", description: "A site that looks like your business", icon: "panels-top-left" },
  { label: "Quotes & Proposals", href: "/features/quotes-proposals", description: "From request to approval", icon: "file-signature" },
  { label: "Jobs & Scheduling", href: "/features/jobs-scheduling", description: "The right crew at the right time", icon: "calendar-check" },
  { label: "Mobile App", href: "/features/mobile-app", description: "Your business in your pocket", icon: "smartphone" },
  { label: "Integrations", href: "/integrations", description: "Connect the tools you use", icon: "plug" },
];

export const industryNav: NavLink[] = [
  { label: "All Industries", href: "/industries", description: "Find your service-business setup", icon: "layout-grid" },
  { label: "Pressure Washing", href: "/industries/pressure-washing", description: "From property details to paid jobs", icon: "droplets" },
  { label: "Concrete Sealing", href: "/industries/concrete-sealing", description: "Keep every project stage in view", icon: "layers" },
  { label: "Towing Services", href: "/industries/towing", description: "Bring drivers, trucks and jobs together", icon: "truck" },
  { label: "Junk Removal", href: "/industries/junk-removal", description: "Turn removal requests into a clear plan", icon: "package-open" },
  { label: "Painting", href: "/industries/painting", description: "Keep proposals and crews coordinated", icon: "paintbrush" },
];

export const mainNav: NavLink[] = [
  { label: "Pricing", href: "/pricing" },
];

export const solutionNav: NavLink[] = [
  { label: "For service businesses", href: "/features", description: "One place to run your day", icon: "briefcase-business" },
  { label: "For white-label partners", href: "/white-label", description: "Your brand. Your own CRM offering.", icon: "palette" },
];

/** Keep login out of navigation until the real CRM entry URL is configured. */
export const LOGIN_URL = process.env.NEXT_PUBLIC_CRM_LOGIN_URL || null;

export const footerNav = {
  Product: productNav,
  Industries: industryNav,
  "White-Label": [
    { label: "White-Label CRM", href: "/white-label" },
    { label: "Discuss a partnership", href: "/contact?audience=reseller" },
  ],
  Company: [
    { label: "About SideKick", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact / Book a Demo", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
} satisfies Record<string, NavLink[]>;

/** Only real, verified social profiles go here. Empty until supplied. */
export const socialLinks: { label: string; href: string }[] = [];
