import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCaseStudyBySlug,
  getFooter,
  getNavigation,
  getPageBySlug,
  getRelatedCaseStudies,
} from "../../../lib/contentEntry";
import { getAssetUrl } from "../../../lib/contentfulAsset";
import Navbar from "@/app/ui/Navbar";
import PageBody from "@/app/ui/PageBody";
import Footer from "@/app/ui/Footer";
import CaseStudyDetail from "@/app/ui/CaseStudyDetail";

type Props = {
  params: Promise<{
    locale: string;
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
 * `proxy.ts` rewrites every locale-less request to `/en-US/...` before this
 * route ever sees it, so *every* content URL — including `/case-studies/
 * <slug>` — arrives here as `/en-US/case-studies/<slug>`, never as a bare
 * top-level path a separate route folder could intercept. A case study's
 * own detail page therefore has to be handled as a fallback right inside
 * this catch-all rather than as its own route.
 *
 * `caseStudySlugFromPath` recognizes that shape (`"case-studies/<rest>"`,
 * with something after the slash) and returns just `<rest>` — the slug
 * `getCaseStudyBySlug` looks up directly against `contentDetail.slug` (see
 * app/lib/contentEntry.ts). This only ever fires once `getPageBySlug` has
 * already come back empty, so an actual `page` entry at that path (there
 * isn't one today, but nothing stops an editor from adding one) still wins.
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
        url: `https://www.oxytal.com/${path}`,
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
      url: `https://www.oxytal.com/${path}`,
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
      <main>
        <Navbar entry={navigation} />
        <PageBody blocks={page.fields.body} />
        <Footer entry={footer} />
      </main>
    );
  }

  const caseStudySlug = caseStudySlugFromPath(path);
  const study = caseStudySlug ? await getCaseStudyBySlug(caseStudySlug) : null;

  if (!study) {
    notFound();
  }

  const related = await getRelatedCaseStudies(caseStudySlug!, 3);

  return (
    <main>
      <Navbar entry={navigation} />
      <CaseStudyDetail entry={study} related={related} />
      <Footer entry={footer} />
    </main>
  );
}
