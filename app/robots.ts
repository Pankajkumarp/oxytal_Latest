import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/siteUrl";

/**
 * Placed at the true top-level `app/` (same reasoning as `sitemap.ts` and
 * `icon.tsx`/`apple-icon.tsx` — a sibling of the `(content)` route group)
 * so it serves at the bare `/robots.txt` crawlers expect, unrewritten by
 * `proxy.ts` (its matcher already excludes any dotted path).
 *
 * `/api/` (webhook/revalidate routes — see app/api/revalidate) and
 * `/page-not-found` (the dedicated 404 page's real route, not something
 * worth indexing) are the only paths actually excluded; everything else
 * this content-driven site serves is fair game for crawling.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/page-not-found"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
