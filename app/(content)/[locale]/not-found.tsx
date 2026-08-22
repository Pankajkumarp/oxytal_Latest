import type { Metadata } from "next";
import type { ReactElement } from "react";
import type { Entry, EntrySkeletonType } from "contentful";
import { getFooter, getNavigation, getPageBySlug } from "@/app/lib/contentEntry";
import { getAssetUrl } from "@/app/lib/contentfulAsset";
import Navbar from "@/app/ui/Navbar";
import PageBody from "@/app/ui/PageBody";
import Footer from "@/app/ui/Footer";
import Home404 from "@/app/ui/Home404";
import { ComposableElementSkeleton } from "@/app/types/contentful";

/**
 * `Entry<Skeleton>` on its own leaves `Modifiers` unconstrained, which
 * widens every field to also allow the `WITH_ALL_LOCALES` (locale-keyed
 * object) shape. This app's Contentful client is created with no chain
 * modifiers (see app/lib/contentful.ts), so pin `Modifiers` to `undefined`
 * to get the plain, single-locale field shape it actually returns.
 */
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

/**
 * Route segment config: caches this route's rendered output (ISR),
 * matching the `REVALIDATE_SECONDS` the data layer itself uses (see
 * app/lib/contentEntry.ts) — a 24h safety net, not the primary
 * invalidation path. The real mechanism is the Contentful webhook calling
 * `app/api/revalidate` on publish/unpublish/delete, which expires the
 * cache immediately; this only kicks in if a webhook call is ever missed.
 * Only takes effect in a production build — dev always renders on demand
 * and never caches.
 */
export const revalidate = 86400; // 24 hours

/**
 * A placeholder `composableElement` entry (`subType: "notfound"`), passed
 * to `Home404` only when no real one is available yet — same trick
 * `app/(content)/page-not-found/page.tsx` uses.
 */
const NOT_FOUND_FALLBACK_ENTRY = {
  sys: { id: "404-fallback", contentType: { sys: { id: "composableElement" } } },
  fields: { type: "section", subType: "notfound", elements: [] },
} as unknown as PlainEntry<ComposableElementSkeleton>;

/**
 * Renders when `[locale]/[[...slug]]/page.tsx` calls `notFound()` (no
 * Contentful `page` entry — and no case study — matches the requested
 * slug). Deliberately placed *inside* `[locale]/`, not at the `(content)`
 * group root: `(content)` sits above two independent root layouts
 * (`[locale]/layout.tsx` and `page-not-found/layout.tsx`), and Next.js
 * can't compose a `not-found.tsx` boundary across multiple root layouts —
 * a `(content)/not-found.tsx` silently never rendered at all, falling
 * through to Next's own generic built-in 404 UI instead (see
 * node_modules/next/dist/docs/.../not-found.md, "Your app has multiple
 * root layouts... so there's no single layout to compose a global 404
 * from"). Nested here, under `[locale]/layout.tsx` alone, there's no such
 * ambiguity.
 *
 * Renders the real Contentful-driven 404 content in place (same content
 * `app/(content)/page-not-found/page.tsx` and `app/global-not-found.tsx`
 * render) rather than redirecting to `/page-not-found`: a 404 boundary
 * that 3xx-redirects to a 200 URL tells search engines/crawlers the
 * broken URL "moved" instead of "doesn't exist," which is the wrong
 * signal — the response should stay at the requested URL with a real 404
 * status (which Next.js applies automatically for a non-streamed
 * `not-found.js` response).
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("404", "en-US");

  if (!page) {
    return {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved.",
    };
  }

  const metaImage = page.fields?.metaImage;
  const imageUrl =
    metaImage && "fields" in metaImage
      ? getAssetUrl(metaImage.fields.image)
      : undefined;

  const title = page.fields.metaTitle ?? page.fields.systemTitle;
  const description = page.fields.metaDescription;

  return {
    title,
    description,
    applicationName: page.fields.metaTitle ?? "Oxytal",
    appleWebApp: {
      title,
    },
    openGraph: {
      title,
      description,
      siteName: "Oxytal",
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function NotFound(): Promise<ReactElement<any>> {
  const [page, navigation, footer] = await Promise.all([
    getPageBySlug("404", "en-US"),
    getNavigation(),
    getFooter(),
  ]);

  return (
    <main>
      <Navbar entry={navigation} />
      {page ? <PageBody blocks={page.fields.body} /> : <Home404 entry={NOT_FOUND_FALLBACK_ENTRY} />}
      <Footer entry={footer} />
    </main>
  );
}
