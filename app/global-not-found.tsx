import type { Metadata } from "next";
import type { ReactElement } from "react";
import type { Entry, EntrySkeletonType } from "contentful";
import { Poppins } from "next/font/google";
import "./globals.css";
import { getFooter, getNavigation, getPageBySlug } from "@/app/lib/contentEntry";
import { getAssetUrl } from "@/app/lib/contentfulAsset";
import Navbar from "@/app/ui/Navbar";
import PageBody from "@/app/ui/PageBody";
import Footer from "@/app/ui/Footer";
import Home404 from "@/app/ui/Home404";
import SkipToContent from "@/app/ui/SkipToContent";
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
 * A placeholder `composableElement` entry (`subType: "notfound"`), passed
 * to `Home404` only when no real one is available yet — same trick
 * `app/(content)/page-not-found/page.tsx` uses.
 */
const NOT_FOUND_FALLBACK_ENTRY = {
  sys: { id: "404-fallback", contentType: { sys: { id: "composableElement" } } },
  fields: { type: "section", subType: "notfound", elements: [] },
} as unknown as PlainEntry<ComposableElementSkeleton>;

// `global-not-found.tsx` bypasses this app's normal layout composition
// entirely (see node_modules/next/dist/docs/.../not-found.md), so it has to
// import its own font instead of inheriting `app/(content)/[locale]/layout`'s
// `poppins` — same font/weights/CSS variable, so the rendered UI (Navbar,
// Home404, Footer) looks identical either way.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

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
 * Handles every URL that doesn't match any real route in the app (Next.js
 * 16's `global-not-found.js` convention — enabled via `experimental.
 * globalNotFound` in next.config.ts). This app needs it specifically
 * because it has two independent root layouts (`[locale]/layout.tsx` and
 * `page-not-found/layout.tsx`), and Next.js can't compose a normal
 * `app/(content)/not-found.tsx` boundary across multiple root layouts —
 * without this file, a genuinely mistyped/broken URL silently fell back to
 * Next's own generic built-in 404 UI (no Contentful copy, no dynamic
 * metadata, not even this site's fonts/theme) instead of anything defined
 * in this app. `app/(content)/not-found.tsx`'s `redirect('/page-not-found')`
 * was an attempt to route around that same limitation and never actually
 * fired for this reason; it's kept only for the (rare) case of an explicit
 * in-app `notFound()` call inside a route that *does* resolve under
 * `[locale]`, where a normal not-found boundary can compose correctly.
 *
 * Renders the exact same Contentful-driven content as
 * `app/(content)/page-not-found/page.tsx` (Navbar + the "404" page's own
 * `body`, or `Home404`'s hardcoded fallback copy when no such Contentful
 * page entry exists yet) — see that file's doc comment for the full
 * rationale. Deliberately duplicated rather than shared as a single
 * component: this file must stay self-contained (own `<html>`/`<body>`,
 * own font import, own `globals.css` import) since it bypasses layouts,
 * so importing shared page logic from a route file would be misleading
 * about what actually runs where.
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
export default async function GlobalNotFound(): Promise<ReactElement<any>> {
  const [page, navigation, footer] = await Promise.all([
    getPageBySlug("404", "en-US"),
    getNavigation(),
    getFooter(),
  ]);

  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SkipToContent />
        <Navbar entry={navigation} />
        <main id="main-content">
          {page ? <PageBody blocks={page.fields.body} /> : <Home404 entry={NOT_FOUND_FALLBACK_ENTRY} />}
        </main>
        <Footer entry={footer} />
      </body>
    </html>
  );
}
