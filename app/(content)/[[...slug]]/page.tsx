import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCaseStudyBySlug,
  getFooter,
  getNavigation,
  getPageBySlug,
} from "@/app/lib/contentEntry";
import { getAssetUrl } from "@/app/lib/contentfulAsset";
import { SITE_URL } from "@/app/lib/siteUrl";
import Navbar from "@/app/ui/Navbar";
import PageBody from "@/app/ui/PageBody";
import Footer from "@/app/ui/Footer";
import CaseStudyDetail from "@/app/ui/CaseStudyDetail";
import SkipToContent from "@/app/ui/SkipToContent";

type Props = {
  params: Promise<{
    slug?: string[];
  }>;
};

/**
 * Route segment config: caches this route's rendered output (ISR),
 * matching the `REVALIDATE_SECONDS` the data layer itself uses (see
 * app/lib/contentEntry.ts) — a 24h safety net, not the primary
 * invalidation path. The real mechanism is the Contentful webhook calling
 * `app/api/revalidate` on publish/unpublish/delete, which expires the
 * cache immediately; this only kicks in if a webhook call is ever missed.
 * Only takes effect in a production build — per Next.js's own docs, dev
 * always renders on demand and never caches, so this won't change
 * anything under `next dev`.
 */
export const revalidate = 86400; // 24 hours

/**
 * Required for `revalidate` above to actually take effect as ISR. Per
 * Next's own docs (generateStaticParams.md, "Good to know"): a dynamic
 * route with no `generateStaticParams` at all skips prerendering/caching
 * entirely and is *fully* dynamically rendered — every request re-executes
 * the function, `revalidate` or not. Returning `[]` (rather than
 * enumerating every known slug) means no path is built at deploy time, but
 * the *first* request to any given path is cached going forward, exactly
 * like `dynamicParams`'s on-demand fallback behavior for a route that
 * *does* list some paths. Confirmed empirically (see `app/api/revalidate/
 * route.ts`'s doc comment) that omitting this was why this route showed up
 * as `ƒ` (fully dynamic) in the build output and re-rendered on every hit
 * regardless of `revalidate` — this is what actually makes on-demand ISR
 * caching kick in for it.
 */
export function generateStaticParams() {
  return [];
}

/**
 * This is an optional catch-all (`[[...slug]]`) mounted directly at the
 * `(content)` route group's root, so it matches every content URL as-is —
 * the bare `/` (empty `slug`, treated as `"home"` below), `/about`,
 * `/case-studies/<slug>`, anything. There's no separate route folder for
 * a case study's own detail page, so it's handled as a fallback right
 * inside this catch-all: `caseStudySlugFromPath` recognizes the
 * `"case-studies/<rest>"` shape (something after the slash) and returns
 * just `<rest>` — the slug `getCaseStudyBySlug` looks up directly against
 * `contentDetail.slug` (see app/lib/contentEntry.ts). This only ever fires
 * once `getPageBySlug` has already come back empty, so an actual `page`
 * entry at that path (there isn't one today, but nothing stops an editor
 * from adding one) still wins.
 */
const CASE_STUDY_PREFIX = "case-studies/";

function caseStudySlugFromPath(path: string): string | null {
  return path.startsWith(CASE_STUDY_PREFIX) && path.length > CASE_STUDY_PREFIX.length
    ? path.slice(CASE_STUDY_PREFIX.length)
    : null;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug = [] } = await params;

  const path = slug.join("/") || "home";

  const page = await getPageBySlug(path, "en-US");

  if (page) {
    const metaImage = page.fields?.metaImage;

    const imageUrl =
      metaImage && "fields" in metaImage
        ? getAssetUrl(metaImage.fields.image)
        : undefined;

    return {
      title: page.fields.metaTitle ?? page.fields.systemTitle,
      description: page.fields.metaDescription,

      applicationName: page.fields.metaTitle ?? "Oxytal",

      appleWebApp: {
        title: page.fields.metaTitle ?? page.fields.systemTitle,
      },

      openGraph: {
        title: page.fields.metaTitle ?? page.fields.systemTitle,
        description: page.fields.metaDescription,
        siteName: "Oxytal",
        url: `${SITE_URL}/${path}`,
        images: imageUrl ? [{ url: imageUrl }] : [],
      },

      twitter: {
        card: "summary_large_image",
        title: page.fields.metaTitle ?? page.fields.systemTitle,
        description: page.fields.metaDescription,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `/${path}`,
      },
    };
  }

  const caseStudySlug = caseStudySlugFromPath(path);
  const study = caseStudySlug ? await getCaseStudyBySlug(caseStudySlug) : null;

  if (!study) {
    return {};
  }

  const heroImageEntry = study.fields.heroImage;
  const imageUrl =
    heroImageEntry && "fields" in heroImageEntry
      ? getAssetUrl(heroImageEntry.fields.image)
      : undefined;

  const title = study.fields.title ?? study.fields.systemTitle;
  const description = study.fields.shortDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Oxytal",
      url: `${SITE_URL}/${path}`,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `/${path}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const path = slug?.join("/") || "home";

  const [page, navigation, footer] = await Promise.all([
    getPageBySlug(path, "en-US"),
    getNavigation(),
    getFooter(),
  ]);

  if (page) {
    return (
      <>
      <header>
        <SkipToContent />
        <Navbar entry={navigation} />
      </header>
        <main id="main-content" suppressHydrationWarning >
          <PageBody blocks={page.fields.body} />
        </main>
        <Footer entry={footer} />
      </>
    );
  }

  const caseStudySlug = caseStudySlugFromPath(path);
  const study = caseStudySlug ? await getCaseStudyBySlug(caseStudySlug) : null;

  if (!study) {
    notFound();
  }

  return (
    <>
    <header>
      <SkipToContent />
      <Navbar entry={navigation} />
      </header>
      <main id="main-content">
        <CaseStudyDetail entry={study} />
      </main>
      <Footer entry={footer} />
    </>
  );
}
