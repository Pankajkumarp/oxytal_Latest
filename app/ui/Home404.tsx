import Link from "next/link";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Home as HomeIcon, Send } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
} from "../types/contentful";

/**
 * `Entry<Skeleton>` on its own leaves `Modifiers` unconstrained, which
 * widens every field to also allow the `WITH_ALL_LOCALES` (locale-keyed
 * object) shape. This app's Contentful client is created with no chain
 * modifiers (see app/lib/contentful.ts), so pin `Modifiers` to `undefined`
 * to get the plain, single-locale field shape it actually returns.
 */
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<
  Skeleton,
  undefined
>;

interface AnyEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
}

/** True for a resolved Contentful entry; false for an unresolved link (`{ sys: { type: "Link" } }`) or anything else. */
function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeAI/HomeTalkToUs use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * Placeholder copy, used only when `entry.fields.elements` is empty —
 * i.e. no real "404" `composableElement` exists in Contentful yet, and a
 * caller (see the three routes below) has passed in a synthetic
 * placeholder entry just to get something on screen. Same "only fall
 * back when there's no real content at all" pattern `Footer`'s own
 * `hasEntry` uses: the moment a real `composableElement` (with at least
 * one `elements` entry) exists, every field below renders exactly what's
 * in Contentful, empty or not, instead of quietly falling back to this
 * placeholder text.
 */
const DEFAULT_EYEBROW = "ERROR 404";
const DEFAULT_HEADING = "Page Not Found";
const DEFAULT_DESCRIPTION =
  "The page you're looking for doesn't exist, may have been moved, or the link might be broken.";
const DEFAULT_PRIMARY_LABEL = "Back to Home";

/**
 * The site's not-found page's main content, rendered from a
 * `composableElement` entry (`subType: "notfound"` — see
 * `ComposableElementRenderer`):
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading/description copy
 * - `dataLink` entries among `elements`: the one with `type: "primary"`
 *   becomes the solid "back home" CTA button, any other becomes the
 *   secondary text link
 *
 * Once a real `composableElement` entry with at least one `elements`
 * entry exists, every field renders exactly what's in Contentful — an
 * unset eyebrow/heading/description/primary-CTA-label simply renders
 * nothing (no hardcoded placeholder copy). `DEFAULT_EYEBROW`/
 * `DEFAULT_HEADING`/`DEFAULT_DESCRIPTION`/`DEFAULT_PRIMARY_LABEL` above
 * are used only in the "no real entry at all" case (see `hasContent`
 * below), matching `Footer`'s own `hasEntry` convention. Reused from
 * three places that all render the same "404" Contentful page (slug
 * "404") with this as their own fallback: the directly-navigable
 * `app/(content)/page-not-found/page.tsx`, the in-place 404 boundary
 * `app/(content)/[locale]/not-found.tsx` (fires when
 * `[locale]/[[...slug]]/page.tsx` calls `notFound()`), and the
 * site-wide `app/global-not-found.tsx` (fires for URLs that don't match
 * any route pattern at all).
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function Home404({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  // Whether a real "404" `composableElement` (with actual content) exists
  // at all — false for the synthetic placeholder entry every caller
  // passes when no real one is published yet. `DEFAULT_*` placeholder
  // content below is only used in that absence; once there's real
  // content, every field renders exactly what's in Contentful, empty or
  // not, rather than quietly falling back to hardcoded text.
  const hasContent = elements.length > 0;

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLink = linkEntries.find((link) => link.fields.type !== "primary");

  const eyebrow = hasContent ? copy?.fields.eyebrow : DEFAULT_EYEBROW;
  const heading = hasContent ? copy?.fields.heading : DEFAULT_HEADING;
  const description = hasContent
    ? copy?.fields.text
      ? documentToReactComponents(copy.fields.text)
      : undefined
    : DEFAULT_DESCRIPTION;

  const primaryHref = (primaryLink && resolveLinkHref(primaryLink)) ?? "/";
  const primaryLabel = hasContent
    ? primaryLink?.fields.label
    : DEFAULT_PRIMARY_LABEL;
  const secondaryHref =
    (secondaryLink && resolveLinkHref(secondaryLink)) ??
    "https://www.oxytal.com/contact";
  const secondaryLabel = secondaryLink?.fields.label;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to its text/button colors. `undefined` for an unset
  // or unrecognized value, in which case every themed class below falls
  // back to this section's existing default (today's plain emerald/gray
  // look).
  const theme = resolveTheme(entry.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAboutUs/HomeAI/HomeTalkToUs use). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one.
  // A background image still wins over a themed background color when
  // both are set, same as PageBody's default composableElement renderer.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  return (
    <section
      className={cx(
        "relative flex min-h-[70vh] items-center overflow-hidden",
        !backgroundUrl && (theme?.sectionBg ?? "bg-white")
      )}
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* =================================================
          DECORATIVE BACKGROUND — same blurred-blob treatment used by
          HomeAI/HomeServices/HomeProducts, for a consistent look; a
          light scrim over the background image instead when there is
          one, so the copy stays readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        {backgroundUrl ? (
          <div className="absolute inset-0 bg-white/80" />
        ) : (
          <>
            <div className="absolute inset-x-0 top-1/2 h-[70%] -translate-y-1/2 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,theme(colors.emerald.100),transparent)] opacity-70" />
            <div className="absolute top-1/4 -left-16 hidden h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl animate-float-slow sm:block" />
            <div className="absolute -right-10 bottom-1/4 hidden h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl animate-float-slower md:block" />
          </>
        )}
      </div>

      <div className="container mx-auto flex flex-col items-center gap-6 px-5 py-16 text-center md:px-10 md:py-24">
        <p
          className={cx(
            "text-[80px] leading-none font-extrabold tracking-tight sm:text-[110px] md:text-[140px]",
            theme?.accentText ?? "text-emerald-600"
          )}
        >
          404
        </p>

        {eyebrow && (
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-emerald-50",
              theme?.eyebrowText ?? "text-emerald-700"
            )}
          >
            {eyebrow}
          </span>
        )}

        <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
          className={cx(
            "max-w-2xl text-[28px] leading-tight font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
            theme?.heading ?? "text-gray-900"
          )}
        >
          {heading}
        </DynamicHeading>

        {description && (
          <div
            className={cx(
              "rich-text max-w-xl text-[15.5px] leading-relaxed md:text-[17px]",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {primaryLabel && (
            <Link
              href={primaryHref}
              className={cx(
                "inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                theme?.buttonBg ?? "bg-emerald-600",
                theme?.buttonText ?? "text-white",
                theme?.buttonHoverBg ?? "hover:bg-emerald-500"
              )}
            >
              <HomeIcon size={16} aria-hidden />
              {primaryLabel}
            </Link>
          )}
{secondaryLabel && (
            <Link
              href={secondaryHref}
              className={cx(
                "group inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold",
                theme?.accentText ?? "text-emerald-600"
              )}
            >
              <Send size={16} aria-hidden />
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
