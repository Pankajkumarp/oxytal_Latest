"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveNavContrast } from "../lib/navContrast";
import { resolveTheme } from "../lib/theme";
import { BannerImageSkeleton, DataImageSkeleton, DataLinkSkeleton } from "../types/contentful";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `Entry<Skeleton>` on its own leaves `Modifiers` unconstrained, which
 * widens every field to also allow the `WITH_ALL_LOCALES` (locale-keyed
 * object) shape. This app's Contentful client is created with no chain
 * modifiers (see app/lib/contentful.ts), so pin `Modifiers` to `undefined`
 * to get the plain, single-locale field shape it actually returns.
 */
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution every other CTA in this project uses. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/** Fallback ratios when Contentful's own aspect-ratio fields are unset — a wide letterbox banner on desktop, a taller crop on mobile so the same photo doesn't look squeezed on a phone-width screen. */
const DEFAULT_DESKTOP_RATIO = "1920/500";
const DEFAULT_MOBILE_RATIO = "4/5";

/** Normalizes a free-text "W/H" ratio (e.g. "1920/500") into the `<number> / <number>` shape the CSS `aspect-ratio` property expects — applied via inline `style`, not a Tailwind class, since an arbitrary editor-typed value can't become a literal class Tailwind's build-time scanner would ever discover. Falls back to `fallback` for anything that doesn't parse as `number/number`. */
function resolveAspectRatioStyle(value: string | undefined, fallback: string): string {
  const raw = value?.trim() || fallback;
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  return match ? `${match[1]} / ${match[2]}` : fallback.replace("/", " / ");
}

/**
 * A full-bleed promotional image banner — its own dedicated `bannerImage`
 * content type (see app/types/contentful.ts), placed directly in a
 * page's `body` field (see `PageBody`) rather than nested inside a
 * `composableElement`, since it needs two distinct, non-repeating images
 * (desktop/mobile) and their own aspect-ratio fields — a shape the
 * generic "elements array" every `composableElement` subtype's content
 * reuses doesn't fit.
 *
 * - `desktopImage`/`mobileImage` each link to a `dataImage` *entry*, not
 *   a raw asset — resolved to the actual asset URL (and its own
 *   `altText`), same pattern every other image field in this project
 *   uses. `mobileImage` falls back to `desktopImage` when unset, so a
 *   banner only ever needs one image to start; only one of the two
 *   image elements is ever rendered at once (`hidden`/`md:hidden`), so
 *   the unused one costs nothing at runtime.
 * - `desktopAspectRatio`/`mobileAspectRatio` are free text in the "W/H"
 *   shape this project's own `aspect-[W/H]` Tailwind classes use
 *   elsewhere, applied via inline `style` here instead (see
 *   `resolveAspectRatioStyle`'s own comment for why) — falls back to a
 *   wide 1920:500 desktop letterbox and a taller 4:5 mobile crop
 * - `badgeText`/`title`/`description` are the overlay copy; `link`
 *   becomes the overlay's CTA button (reusing `dataLink`, same
 *   convention every other CTA in this project uses). The overlay only
 *   renders at all when at least one of these is set.
 * - `themeColor` ("dark"/"light" only) resolves via the same
 *   `resolveTheme` every `composableElement` section uses, picking the
 *   overlay text/badge/button colors *and* the legibility scrim's own
 *   tint (dark photo scrim for light-on-photo text, light scrim for
 *   dark-on-photo text). Falls back to "dark" when unset.
 *
 * The image fades + scales in slightly as it scrolls into view, and the
 * overlay copy rises + fades in with a short stagger right after —
 * skipped entirely under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<BannerImageSkeleton>;
}

export default function BannerImage({ entry }: Props) {
  const desktopImageEntry = entry?.fields.desktopImage;
  const desktopImage = isEntry(desktopImageEntry)
    ? (desktopImageEntry as unknown as PlainEntry<DataImageSkeleton>)
    : undefined;
  const desktopUrl = desktopImage ? getAssetUrl(desktopImage.fields.image) : undefined;

  const mobileImageEntry = entry?.fields.mobileImage;
  const mobileImage = isEntry(mobileImageEntry)
    ? (mobileImageEntry as unknown as PlainEntry<DataImageSkeleton>)
    : desktopImage;
  const mobileUrl = mobileImage ? getAssetUrl(mobileImage.fields.image) : desktopUrl;

  const desktopRatio = resolveAspectRatioStyle(entry?.fields.desktopAspectRatio, DEFAULT_DESKTOP_RATIO);
  const mobileRatio = resolveAspectRatioStyle(entry?.fields.mobileAspectRatio, DEFAULT_MOBILE_RATIO);

  const badgeText = entry?.fields.badgeText;
  const title = entry?.fields.title;
  const description = entry?.fields.description;

  const linkEntry = entry?.fields.link;
  const link = isEntry(linkEntry) ? (linkEntry as unknown as PlainEntry<DataLinkSkeleton>) : undefined;
  const linkHref = link ? resolveLinkHref(link) : undefined;

  // Falls back to "dark" (white text over the photo) rather than the
  // site's usual light default — a banner sits over an arbitrary photo,
  // and white-on-photo reads legibly far more often than dark-on-photo.
  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("dark")!;
  const isLight = (entry?.fields.themeColor ?? "").trim().toLowerCase() === "light";

  // A *different* concern from `themeColor`/`isLight` above (which style
  // this banner's own overlay copy): this picks the fixed nav's own
  // logo/icon contrast while it sits over this section — see
  // `navType`'s own doc comment on `BannerImageSkeleton` and
  // `Navbar.tsx`'s "NAV CONTRAST" comment for the mechanism.
  const navContrast = resolveNavContrast(entry?.fields.navType);

  const hasOverlay = Boolean(badgeText || title || description || (link && linkHref));

  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the image fades + scales in slightly as it
     scrolls into view; the overlay copy (badge/title/description/link)
     rises + fades in right after with a short stagger. Skipped entirely
     under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!imageRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(imageRef.current, { opacity: 1, scale: 1 });
      if (overlayRef.current) {
        gsap.set(overlayRef.current.children, { opacity: 1, y: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(imageRef.current, {
        opacity: 0,
        scale: 1.06,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          once: true,
        },
      });

      if (overlayRef.current?.children.length) {
        gsap.from(overlayRef.current.children, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!desktopUrl) {
    return null;
  }

  return (
    <section ref={sectionRef} data-nav-contrast={navContrast} className="relative overflow-hidden">
      <div ref={imageRef} className="relative w-full">
        {/* Desktop image — `md:` and up. */}
        <div className="hidden w-full overflow-hidden md:block" style={{ aspectRatio: desktopRatio }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project */}
          <img
            src={desktopUrl}
            alt={desktopImage?.fields.altText ?? ""}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Mobile image — below `md:`. Falls back to the desktop image/ratio when `mobileImage` is unset. */}
        <div className="block w-full overflow-hidden md:hidden" style={{ aspectRatio: mobileRatio }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project */}
          <img
            src={mobileUrl}
            alt={mobileImage?.fields.altText ?? ""}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {hasOverlay && (
        <>
          {/* Legibility scrim — tinted to match the theme's own text
              color (dark scrim under light text, light scrim under dark
              text), not the photo itself, so overlay copy stays readable
              regardless of what's in the image. */}
          <div
            aria-hidden
            className={cx(
              "pointer-events-none absolute inset-0 z-1 bg-gradient-to-t",
              isLight
                ? "from-white/85 via-white/25 to-transparent"
                : "from-black/70 via-black/25 to-transparent"
            )}
          />

          <div
            ref={overlayRef}
            className="absolute inset-0 z-2 flex flex-col items-start justify-end gap-3 p-6 md:p-12"
          >
            {badgeText && (
              <span
                className={cx(
                  "inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase",
                  theme.eyebrowBg,
                  theme.eyebrowText
                )}
              >
                {badgeText}
              </span>
            )}

            {title && (
              <h2
                className={cx(
                  "max-w-2xl text-[26px] leading-[1.15] font-extrabold tracking-tight sm:text-[32px] md:text-[40px]",
                  theme.heading
                )}
              >
                {title}
              </h2>
            )}

            {description && (
              <p className={cx("max-w-xl text-[15px] leading-relaxed", theme.body)}>
                {description}
              </p>
            )}

            {link && linkHref && (
              <a
                href={linkHref}
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
        </>
      )}
    </section>
  );
}
