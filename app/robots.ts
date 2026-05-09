import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://cheapervideo.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/legal/", "/status"],
        // Keep auth + dashboard + admin private. They're behind auth anyway,
        // but no need for crawlers to spend their budget on them.
        disallow: ["/admin", "/dashboard", "/api/", "/login", "/signup"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
