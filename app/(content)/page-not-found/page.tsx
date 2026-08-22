import type { Metadata } from "next";
import type { ReactElement } from 'react';
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
 * to `Home404` only when no real one is available yet — same "render
 * with a fake entry" trick `app/(content)/[locale]/test-case-studies-preview`
 * uses to preview a composableElement-driven component standalone.
 */
const NOT_FOUND_FALLBACK_ENTRY = {
  sys: { id: "404-fallback", contentType: { sys: { id: "composableElement" } } },
  fields: { type: "section", subType: "notfound", elements: [] },
} as unknown as PlainEntry<ComposableElementSkeleton>;

/**
 * The site's actual not-found page — served at `/page-not-found`, *not*
 * `/404` (see `app/(content)/not-found.tsx`'s own doc comment for why:
 * Next.js's App Router reserves the literal `/404` path internally, so
 * a real route can never be placed there — a request to it is always
 * treated as "the" 404 fallback, bypassing this route's own
 * `generateMetadata`/`Page` entirely). Same Contentful-driven shape as
 * the `[[...slug]]` catch-all route (Navbar + PageBody(page.body) +
 * Footer), looked up via `getPageBySlug("404", ...)` — the *Contentful*
 * entry's own `slug` field stays "404" (an internal identifier editors
 * already know this page by), decoupled from the *URL* path, which is
 * `/page-not-found` for the reason above.
 *
 * Publishing a `page` entry with slug "404" whose body includes a
 * `composableElement` entry (`subType: "notfound"` — see `Home404` /
 * `ComposableElementRenderer`) fully replaces the fallback below with
 * editor-controlled copy; nothing here needs to change for that.
 *
 * No such `page` entry needs to exist yet, though: when `getPageBySlug`
 * finds nothing, this renders `Home404` directly (with a placeholder
 * entry, so it falls back to its own default copy) instead of an empty
 * page. This route can never call `notFound()` itself — that's exactly
 * what redirects here (see `app/(content)/not-found.tsx`).
 *
 * `generateMetadata` below derives title/description/OpenGraph/Twitter
 * from the same `page` entry (slug "404") this route already fetches
 * for its body content — same `metaTitle`/`metaDescription`/`metaImage`
 * derivation the `[[...slug]]` catch-all route's own `generateMetadata`
 * uses (see that file) — so this page picks up an editor's own title/
 * description instead of inheriting the generic site-wide defaults from
 * this route's own `layout.tsx`. Falls back to a plain "Page Not Found"
 * title/description (rather than the layout's generic site name) when
 * no such entry is set up yet, so this page is never mistaken for the
 * homepage in search results or a shared link preview.
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
      url: "https://www.oxytal.com/page-not-found",
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
export default async function Page(): Promise<ReactElement<any>> {
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
