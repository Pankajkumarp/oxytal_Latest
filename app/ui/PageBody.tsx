import type { ReactElement } from "react";
import type { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { cx } from "../lib/cx";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import CommonVideo, {
  type CommonVideoAspectRatio,
  type CommonVideoHeadingLevel,
  type CommonVideoOverlay,
} from "./CommonVideo";
import BannerImage from "./BannerImage";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveNavContrast } from "../lib/navContrast";
import type {
  BannerImageSkeleton,
  CallToActionSkeleton,
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
  DataVideoSkeleton,
} from "../types/contentful";
import ComposableElementRenderer from "./ComposableElementRenderer";
import ThemePattern from "./ThemePattern";

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

/**
 * Renders `page.fields.body` — the Contentful "Page" content type's
 * page-builder field. Add a `dataVideo` (or `dataText` / `dataImage` /
 * `callToAction` / `composableElement` / `bannerImage`) entry to a page's
 * `body` field in Contentful and it shows up here automatically once
 * published; nothing in this file needs to change for that.
 *
 * Unknown or unresolved (unpublished) blocks are skipped rather than
 * throwing, so one bad block never takes down the whole page.
 */
export default function PageBody({ blocks }: { blocks?: unknown[] }) {
  if (!blocks?.length) {
    return null;
  }

  return <>{blocks.map((block) => renderBlock(block))}</>;
}

/** Default (unthemed) colors, used for every block rendered outside a themed `composableElement` wrapper — i.e. wherever `renderBlock` isn't passed a resolved `theme`. */
const DEFAULT_BLOCK_THEME: SectionTheme = {
  sectionBg: "",
  eyebrowBg: "bg-emerald-50",
  eyebrowText: "text-emerald-700",
  heading: "text-gray-900",
  body: "text-gray-500",
  muted: "text-gray-400",
  buttonBg: "bg-emerald-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-emerald-500",
  accentText: "text-emerald-600",
  cardBg: "bg-white",
  cardBorder: "border-gray-100",
  patternColor: "#059669",
  showPattern: false,
};

const ASPECT_RATIOS: readonly CommonVideoAspectRatio[] = [
  "16/9",
  "21/9",
  "4/3",
  "1/1",
  "9/16",
];

/** `dataVideo.aspectRatio` is free text in Contentful — normalizes "16:9" (colon) to "16/9" (slash) and falls back to CommonVideo's own default for anything unrecognized. */
function resolveAspectRatio(value: unknown): CommonVideoAspectRatio | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(":", "/");

  return (ASPECT_RATIOS as readonly string[]).includes(normalized)
    ? (normalized as CommonVideoAspectRatio)
    : undefined;
}

const VIDEO_HEADING_LEVELS: readonly CommonVideoHeadingLevel[] = [
  "h1",
  "h2",
  "h3",
  "h4",
];

/** `dataVideo.headingLevel` is free text in Contentful — unlike `resolveHeadingLevel` (dataText's own resolver, which allows h1–h6), CommonVideo's `headingLevel` only accepts h1–h4, so this validates against that narrower set instead and falls back to CommonVideo's own default ("h2") for anything unrecognized, including h5/h6. */
function resolveVideoHeadingLevel(value: unknown): CommonVideoHeadingLevel | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  return (VIDEO_HEADING_LEVELS as readonly string[]).includes(normalized)
    ? (normalized as CommonVideoHeadingLevel)
    : undefined;
}

/**
 * `dataVideo.overlay` is a locked "dark"/"light" enum in Contentful, but
 * genuinely optional — unlike `resolveNavContrast` (which always falls
 * back to "light"), an unset or unrecognized value here resolves to
 * `undefined` so `CommonVideo` renders no tint at all.
 */
function resolveOverlay(value: unknown): CommonVideoOverlay | undefined {
  return value === "dark" || value === "light" ? value : undefined;
}

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  // Assumes `linkedPage` stores a page slug (e.g. "about"). Adjust this if
  // your Contentful editors store something else there (a full path, a
  // reference, etc.).
  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * Renders one page-builder block. `theme` — resolved from the nearest
 * enclosing themed `composableElement` wrapper's `themeColor` (see the
 * "composableElement" case below) — is threaded through so `dataText`/
 * `callToAction` blocks nested inside it use that theme's colors instead
 * of the site's default emerald palette (`DEFAULT_BLOCK_THEME`). Blocks
 * rendered directly in `page.body` (not inside a themed wrapper) get
 * `DEFAULT_BLOCK_THEME` — i.e. today's unthemed look, unchanged.
 */
function renderBlock(
  value: unknown,
  theme: SectionTheme = DEFAULT_BLOCK_THEME
): ReactElement | null {
  if (!isEntry(value)) {
    return null;
  }

  switch (value.sys.contentType.sys.id) {
    case "dataVideo": {
      const entry = value as unknown as PlainEntry<DataVideoSkeleton>;
      const videoSrc = getAssetUrl(entry.fields.videoFile);
      const videoSrcMobile = getAssetUrl(entry.fields.videoFileMobile);

      if (!videoSrc) {
        return null;
      }

      // `poster` links to a `dataImage` *entry*, not a raw asset — resolve
      // that entry's own `image` field for the actual asset URL (same
      // pattern as `composableElement.backgroundImage` below).
      const posterEntry = entry.fields.poster;
      const posterUrl = isEntry(posterEntry)
        ? getAssetUrl(
          (posterEntry as unknown as PlainEntry<DataImageSkeleton>).fields
            .image
        )
        : undefined;

      // `button` links to a `dataLink` *entry* — its own `label`/href
      // become CommonVideo's `buttonText`/`buttonLink`, same resolution
      // every other CTA in this file uses. CommonVideo only renders the
      // overlay content block at all when at least one of eyebrow/
      // heading/description/button is set — an editor who only fills in
      // `heading`, say, gets just a heading, no empty eyebrow/text/button
      // slots.
      const buttonEntry = entry.fields.button;
      const buttonLink = isEntry(buttonEntry)
        ? (buttonEntry as unknown as PlainEntry<DataLinkSkeleton>)
        : undefined;

      return (
        // Plain, unstyled wrapper (no visual footprint) just to carry
        // `data-nav-contrast` — CommonVideo itself still renders with no
        // wrapper of its own by design (see the `className=""` comment
        // below).
        <div key={entry.sys.id} data-nav-contrast={resolveNavContrast(entry.fields.navType)}>
          <CommonVideo
            videoSrc={videoSrc}
            videoSrcMobile={videoSrcMobile}
            videoLabel={entry.fields.altText}
            controls={entry.fields.showControls ?? false}
            poster={posterUrl}
            aspectRatio={resolveAspectRatio(entry.fields.aspectRatio)}
            aspectRatioMobile={resolveAspectRatio(entry.fields.aspectRatioMobile)}
            autoPlay={entry.fields.autoPlay ?? true}
            loop={entry.fields.loop ?? true}
            overlay={resolveOverlay(entry.fields.overlay)}
            textDelay={entry.fields.textDelay}
            eyebrow={entry.fields.eyebrow}
            heading={entry.fields.heading}
            headingLevel={resolveVideoHeadingLevel(entry.fields.headingLevel)}
            description={entry.fields.text}
            buttonText={buttonLink?.fields.label}
            buttonLink={buttonLink ? resolveLinkHref(buttonLink) : undefined}
            // Video-only CommonVideo renders with no wrapper by design. Give
            // it the same horizontal gutter as the rest of the page (not the
            // narrow text `container`, which made it look squeezed on wide
            // screens) — CommonVideo's own max-h cap keeps the height in
            // check regardless of how wide this ends up being.
            className=""
          />
        </div>
      );
    }

    case "dataText": {
      const entry = value as unknown as PlainEntry<DataTextSkeleton>;
            return (
        <div
          key={entry.sys.id}
          data-nav-contrast={resolveNavContrast(entry.fields.navType)}
          className="container mx-auto px-5 py-10 md:px-10 md:py-14"
        >
          {entry.fields.eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme.eyebrowBg,
                theme.eyebrowText
              )}
            >
              {entry.fields.eyebrow}
            </span>
          )}

          {entry.fields.heading && (
            <DynamicHeading level={resolveHeadingLevel(entry.fields.headingLevel, "h2")}
              className={cx(
                "mt-4 max-w-3xl text-[28px] leading-tight font-extrabold tracking-tight md:text-[36px]",
                theme.heading
              )}
            >
              {entry.fields.heading}
            </DynamicHeading>
          )}

          {entry.fields.text && (
            <div
              className={cx(
                "rich-text mt-4 max-w-3xl text-[15.5px] leading-relaxed",
                theme.body
              )}
            >
              {documentToReactComponents(entry.fields.text)}
            </div>
          )}
        </div>
      );
    }

    case "dataImage": {
      const entry = value as unknown as PlainEntry<DataImageSkeleton>;
      const imageSrc = getAssetUrl(entry.fields.image);

      if (!imageSrc) {
        return null;
      }

      return (
        <div
          key={entry.sys.id}
          data-nav-contrast={resolveNavContrast(entry.fields.navType)}
          className="container mx-auto px-5 py-10 md:px-10 md:py-14"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project */}
          <img
            src={imageSrc}
            alt={entry.fields.altText ?? ""}
            loading={entry.fields.lazyLoad === false ? "eager" : "lazy"}
            className="w-full rounded-2xl object-cover md:rounded-[28px]"
          />
        </div>
      );
    }

    case "dataLink": {
      const entry = value as unknown as PlainEntry<DataLinkSkeleton>;
      const href = resolveLinkHref(entry);

      return (
        <a
          key={entry.sys.id}
          href={href ?? "#"}
          aria-label={entry.fields.ariaLabel}
          className={cx(
            "text-[15px] font-semibold underline underline-offset-2",
            theme.accentText
          )}
        >
          {entry.fields.label}
        </a>
      );
    }

    case "callToAction": {
      const entry = value as unknown as PlainEntry<CallToActionSkeleton>;
      const link = entry.fields.ctaButton?.find(isEntry) as
        | PlainEntry<DataLinkSkeleton>
        | undefined;
      const href = link ? resolveLinkHref(link) : undefined;

      return (
        <div
          key={entry.sys.id}
          className="container mx-auto px-5 py-10 md:px-10 md:py-14"
        >
          <div className="flex max-w-2xl flex-col gap-4">
            {entry.fields.eyebrow && (
              <span
                className={cx(
                  "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                  theme.eyebrowBg,
                  theme.eyebrowText
                )}
              >
                {entry.fields.eyebrow}
              </span>
            )}

            <h2
              className={cx(
                "text-[28px] leading-tight font-extrabold tracking-tight md:text-[36px]",
                theme.heading
              )}
            >
              {entry.fields.title}
              {entry.fields.highlightText && (
                <span className={theme.accentText}>
                  {" "}
                  {entry.fields.highlightText}
                </span>
              )}
            </h2>

            <p
              className={cx(
                "text-[15.5px] leading-relaxed md:text-[17px]",
                theme.body
              )}
            >
              {entry.fields.description}
            </p>

            {href && link && (
              <a
                href={href}
                className={cx(
                  "mt-1 inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme.buttonBg,
                  theme.buttonText,
                  theme.buttonHoverBg
                )}
              >
                {link.fields.label}
              </a>
            )}
          </div>
        </div>
      );
    }

    case "bannerImage": {
      const entry = value as unknown as PlainEntry<BannerImageSkeleton>;
      return <BannerImage key={entry.sys.id} entry={entry} />;
    }

    case "composableElement": {
      const entry = value as unknown as PlainEntry<ComposableElementSkeleton>;
      const subType = entry.fields.subType;
      if (subType && subType !== "default") {
        return <ComposableElementRenderer key={entry.sys.id} entry={entry} />;
      }
      const elements = entry.fields.elements ?? [];
      // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
      // resolve that entry's own `image` field for the actual asset URL.
      const backgroundImageEntry = entry.fields.backgroundImage;
      const backgroundUrl = isEntry(backgroundImageEntry)
        ? getAssetUrl(
          (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
            .fields.image
        )
        : undefined;

      // `themeColor` now names one of the presets in app/lib/theme.ts
      // (e.g. "dark", "blue", "emerald") rather than a raw CSS color value.
      // `resolveTheme` returns `undefined` for anything else, in which case
      // this wrapper and every block nested inside it fall back to
      // `DEFAULT_BLOCK_THEME` (today's plain emerald/gray look) unchanged.
      // A background image still wins over a themed background color when
      // both are set, same as before.
      const theme = resolveTheme(entry.fields.themeColor) ?? DEFAULT_BLOCK_THEME;

      return (
        <div
          key={entry.sys.id}
          className={cx("relative flex flex-col", !backgroundUrl && theme.sectionBg)}
          style={{
            backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
            backgroundSize: backgroundUrl ? "cover" : undefined,
            backgroundPosition: backgroundUrl ? "center" : undefined,
          }}
        >
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
          {elements.map((element) => renderBlock(element, theme))}
        </div>
      );
    }

    // Navigation data isn't page content — skip it if it ever ends up in `body`.
    case "dataNavigation":
      return null;

    // `contentDetail` (case-study/service-detail entries) has no real
    // authored examples yet to design and verify a layout against — skip
    // for now rather than shipping an unverified guess.
    case "contentDetail":
      return null;

    default:
      return null;
  }
}
