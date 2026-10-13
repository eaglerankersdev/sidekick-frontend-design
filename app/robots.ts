import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidekickcrm.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/privacy", "/terms", "/cookies"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
