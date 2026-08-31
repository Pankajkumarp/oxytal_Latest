import type { MetadataRoute } from "next";
import { getSitemapCaseStudies, getSitemapPages } from "./lib/contentEntry";
import { SITE_URL as BASE_URL } from "./lib/siteUrl";

/**
 * Placed at the true top-level `app/` (a sibling of `icon.tsx`/
 * `apple-icon.tsx`, not inside the `(content)` route group) so it serves
 * at the bare `/sitemap.xml` Google/Bing expect. `proxy.ts`'s matcher
 * already excludes any path with a dot in it, so this is reachable
 * without the `/en-US` locale rewrite every other content path gets.
 *
 * Content-driven, matching this whole site: rather than a hand-maintained
 * list of routes, every URL here comes straight from Contentful —
 * `getSitemapPages` (every `page` entry flagged `fields.published`) plus
 * `getSitemapCaseStudies` (every case-study `contentDetail` entry, at the
 * `/case-studies/<slug>` path the catch-all route falls back to — see
 * that route's own `caseStudySlugFromPath`). A `page` entry's own `slug`
 * of `"home"` is this site's actual root path (see `getPageBySlug`'s
 * lookup convention), so it maps to the bare `BASE_URL` here instead of
 * `BASE_URL/home`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, caseStudies] = await Promise.all([
    getSitemapPages(),
    getSitemapCaseStudies(),
  ]);

  const pageEntries: MetadataRoute.Sitemap = pages
    .filter((page) => page.fields.slug)
    .map((page) => ({
      url:
        page.fields.slug === "home"
          ? BASE_URL
          : `${BASE_URL}/${page.fields.slug}`,
      lastModified: page.sys.updatedAt,
    }));

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies
    .filter((study) => study.fields.slug)
    .map((study) => ({
      url: `${BASE_URL}/case-studies/${study.fields.slug}`,
      lastModified: study.sys.updatedAt,
    }));

  return [...pageEntries, ...caseStudyEntries];
}
