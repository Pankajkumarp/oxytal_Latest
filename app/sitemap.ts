import type { MetadataRoute } from "next";
import { getSitemapCaseStudies, getSitemapPages } from "./lib/contentEntry";
import { SITE_URL as BASE_URL } from "./lib/siteUrl";

/**
 * Contentful's `slug` field is free text, and in practice a handful of
 * `page`/`contentDetail` entries have ended up with garbage in it — a full
 * third-party URL pasted in whole (e.g. `https://career.oxyem.io/`) or a
 * slug that already includes the `case-studies/` segment/a leading slash
 * (producing a doubled `/case-studies//case-studies/<slug>` once this file
 * prepends its own `case-studies/` prefix). Rather than emit whatever the
 * CMS happens to contain, every slug is normalized through here first:
 * surrounding slashes are trimmed, an accidental `${prefix}/` repeat is
 * collapsed, and anything that still looks like an absolute URL (has a
 * `scheme://`) is rejected outright — a sitemap entry should always be a
 * same-site path, never another domain.
 */
function normalizeSlug(rawSlug: string, prefix?: string): string | null {
  let slug = rawSlug.trim().replace(/^\/+|\/+$/g, "");
  if (!slug || /^[a-z][a-z0-9+.-]*:\/\//i.test(slug)) {
    return null;
  }
  if (prefix && (slug === prefix || slug.startsWith(`${prefix}/`))) {
    slug = slug.slice(prefix.length + 1);
  }
  return slug || null;
}

/**
 * Collapses entries that resolved to the same `url` (duplicate Contentful
 * entries sharing a slug, or two raw slugs that normalized to the same
 * path) down to one, keeping whichever has the most recent `lastModified`.
 */
function dedupeByUrl(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const entry of entries) {
    const existing = byUrl.get(entry.url);
    if (
      !existing ||
      (entry.lastModified &&
        (!existing.lastModified ||
          new Date(entry.lastModified) > new Date(existing.lastModified)))
    ) {
      byUrl.set(entry.url, entry);
    }
  }

  return [...byUrl.values()];
}

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
 * `BASE_URL/home`. Every slug is run through `normalizeSlug` first (see
 * its own doc comment) and the resulting URLs through `dedupeByUrl`, so a
 * malformed or duplicated Contentful `slug` field can't leak a third-party
 * URL or a doubled path into the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, caseStudies] = await Promise.all([
    getSitemapPages(),
    getSitemapCaseStudies(),
  ]);

  const pageEntries: MetadataRoute.Sitemap = pages.flatMap((page) => {
    const slug = page.fields.slug ? normalizeSlug(page.fields.slug) : null;
    if (!slug) return [];
    return [
      {
        url: slug === "home" ? BASE_URL : `${BASE_URL}/${slug}`,
        lastModified: page.sys.updatedAt,
      },
    ];
  });

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.flatMap(
    (study) => {
      const slug = study.fields.slug
        ? normalizeSlug(study.fields.slug, "case-studies")
        : null;
      if (!slug) return [];
      return [
        {
          url: `${BASE_URL}/case-studies/${slug}`,
          lastModified: study.sys.updatedAt,
        },
      ];
    }
  );

  return dedupeByUrl([...pageEntries, ...caseStudyEntries]);
}
