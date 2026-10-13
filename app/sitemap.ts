import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidekickcrm.example";

// Legal placeholders are excluded until approved copy is published.
const routes = [
  "/", "/features", "/features/ai-mcp", "/features/website-builder", "/features/quotes-proposals", "/features/jobs-scheduling", "/features/mobile-app",
  "/industries", "/industries/pressure-washing", "/industries/concrete-sealing", "/industries/towing", "/industries/junk-removal", "/industries/painting",
  "/pricing", "/white-label", "/integrations", "/about", "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((r) => ({ url: `${SITE_URL}${r}`, lastModified: now, changeFrequency: "monthly", priority: r === "/" ? 1 : 0.7 }));
}
