"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import {
  BarChart3,
  Bot,
  Clock,
  MessageCircle,
  Send,
  Share2,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
} from "../types/contentful";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeAI/HomeProducts use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

type Align = "left" | "center" | "right";

/** Cross-axis alignment for the flex columns (the left content column itself, and each feature card within it). */
const ALIGN_ITEMS: Record<Align, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};
/** Text alignment for the heading/description/feature copy. */
const TEXT_ALIGN: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};
/** Horizontal justification for the CTA + note row. */
const JUSTIFY_CONTENT: Record<Align, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

/** Normalizes the composableElement's `textStart` field (free text in Contentful — case/whitespace can vary) to one of the three supported alignments. Defaults to "left" — today's layout — for an unset or unrecognized value. */
function resolveAlign(value?: string): Align {
  const normalized = value?.trim().toLowerCase();
  return normalized === "center" || normalized === "right"
    ? normalized
    : "left";
}

interface FeatureItem {
  name: string;
  description?: string;
  iconUrl?: string;
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [Target, Share2, Bot, BarChart3];

/** Maps a resolved `contentDetail` entry to the plain `FeatureItem` shape this component renders — reusing `contentDetail` (title/shortDescription/icon) instead of a dedicated content type, same pattern as HomeProducts' `contentDetailToProductItem`. */
function contentDetailToFeatureItem(
  entry: PlainEntry<ContentDetailSkeleton>
): FeatureItem {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
      (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
    )
    : undefined;

  return {
    name: entry.fields.title ?? "",
    description: entry.fields.shortDescription,
    iconUrl,
  };
}

/**
 * Placeholder roster, used only when the `composableElement`'s `elements`
 * has no `contentDetail` entries yet. Swap/add real features in Contentful
 * by adding `contentDetail` entries (title/shortDescription/icon) —
 * nothing here needs to change.
 */
const DEFAULT_FEATURES: FeatureItem[] = [];

/**
 * "Talk to Us", rendered from a `composableElement` entry (`subType:
 * "talktous"` — see `ComposableElementRenderer`):
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading/description intro copy
 * - a second `dataText` entry (if present) supplies the handwritten-style
 *   note next to the CTA button, via its `eyebrow` field (same "reuse a
 *   secondary dataText" pattern HomeAI's proof callout uses)
 * - every `contentDetail` entry among `elements` becomes one feature item
 *   (via `contentDetailToFeatureItem`) — `title`/`shortDescription` as the
 *   name/description, `icon` (falls back to a cycled Lucide icon, same
 *   pattern as HomeServices) as the glyph
 * - `dataLink` entries among `elements`: the one with `type: "primary"`
 *   becomes the CTA button
 * - the composableElement's own `backgroundImage` field (links to a
 *   `dataImage` entry, same as PageBody's default composableElement
 *   renderer) is an *optional* full-bleed section background image —
 *   like HomeAboutUs/HomeAI, there's no placeholder fallback, so when
 *   it's unset the section just shows its themed background color
 *   (`theme.sectionBg`, via `resolveTheme(entry.fields.themeColor)`)
 *   instead. The left-to-right mint scrim that keeps copy readable over
 *   a background photo only renders when there is one — otherwise it
 *   would sit on top of (and mask) the themed background color.
 *
 * Every field above renders exactly what's in Contentful — an unset
 * eyebrow/heading/description/note/note-bottom/CTA label simply renders
 * nothing (no hardcoded placeholder copy), and an empty `contentDetail`
 * roster renders no feature cards.
 *
 * Animation: the heading gets the same GSAP split-text reveal every
 * sibling section's own heading uses; the feature cards fade + rise in
 * with a stagger as the grid scrolls into view, and each card gets its
 * own GSAP hover (lift + shadow, with the icon box giving a bouncy
 * elastic "pop") — see the CARD LOAD REVEAL/CARD HOVER comments below
 * for how this differs from every sibling section's own hover treatment.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeTalkToUs({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const noteEntry = dataTextEntries[1];

  const primaryLink = elements
    .filter(
      (element): element is PlainEntry<DataLinkSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "dataLink"
    )
    .find((link) => link.fields.type === "primary");

  const contentDetailFeatures = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToFeatureItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;
  const features = contentDetailFeatures.length
    ? contentDetailFeatures
    : DEFAULT_FEATURES;

  const note = noteEntry?.fields.heading;
  const noteBottom = noteEntry?.fields.eyebrow;
  const ctaHref =
    (primaryLink && resolveLinkHref(primaryLink)) ??
    "https://www.oxytal.com/contact";
  const ctaLabel = primaryLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAI/HomeAboutUs use). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one — in which
  // case the section falls back to its themed background color instead
  // (see `theme.sectionBg` below).
  const illustrationEntry = entry.fields.backgroundImage;
  const illustrationUrl = isEntry(illustrationEntry)
    ? getAssetUrl(
      (illustrationEntry as unknown as PlainEntry<DataImageSkeleton>).fields
        .image
    )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to its text/button colors. `undefined` for an unset
  // or unrecognized value, in which case every themed class below falls
  // back to this section's existing default (today's plain mint look).
  // The scrim/background photo itself stay unthemed either way.
  const theme = resolveTheme(entry.fields.themeColor);

  // "left" (default), "center", or "right" — drives the left column's own
  // cross-axis alignment, its text alignment, and the CTA row's
  // justification below, so an editor-set `textStart` moves the eyebrow/
  // heading/copy/features/CTA together rather than piecemeal.
  const align = resolveAlign(entry.fields.textStart);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading splits into words on scroll-in (same
     GSAP split-text treatment as HomeServices/HomeProducts/HomeAI).
     Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!headingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(headingRef.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 3,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              once: true,
            },
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     CARD LOAD REVEAL — the feature cards fade + rise into place with a
     stagger as the grid scrolls into view, same GSAP vocabulary
     AISolutionsCapabilities/ContactFaq's own card grids use. Skipped
     entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current || !features.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, [features.length]);

  /* =========================================================
     CARD HOVER — distinct from every sibling section's own lift/tilt/
     pulse/spotlight/focus-bracket treatments: the card lifts with a
     soft shadow while its icon box gives a quick elastic "pop" (a
     bouncy scale + slight rotate), rather than either alone. GSAP
     rather than CSS since the icon's elastic overshoot isn't
     expressible as a single CSS easing. Skipped under
     prefers-reduced-motion — the card keeps its plain border/background
     with no hover motion in that case.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-feature-icon]");

    gsap.to(card, {
      y: -6,
      boxShadow: "0 20px 36px -14px rgba(16,24,40,0.18)",
      duration: 0.35,
      ease: "power2.out",
    });

    if (icon) {
      gsap.fromTo(
        icon,
        { rotate: 0, scale: 1 },
        { rotate: 8, scale: 1.15, duration: 0.5, ease: "elastic.out(1, 0.5)" }
      );
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-feature-icon]");

    // `clearProps: "boxShadow"` rather than animating back to an
    // explicit value — the card always keeps its own static shadow
    // (the `shadow-[...]` class below) at rest, so leaving just drops
    // the inline override and lets that class-defined shadow show
    // again, instead of animating all the way down to no shadow at all.
    gsap.to(card, {
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      clearProps: "boxShadow",
    });

    if (icon) {
      gsap.to(icon, {
        rotate: 0,
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        illustrationUrl
          ? "bg-cover bg-center"
          : (theme?.sectionBg ?? "bg-emerald-50/40")
      )}
      style={
        illustrationUrl
          ? { backgroundImage: `url(${illustrationUrl})` }
          : undefined
      }
    >
      {/* =================================================
          DECORATIVE OVERLAY — mint scrim over the background image so
          the left-hand copy stays readable regardless of what's behind
          it; fades out toward the right so the image still reads there.
          Only rendered when there's an actual photo to scrim — with no
          `illustrationUrl`, this would otherwise sit on top of (and
          mask) the themed background color above.
      ================================================= */}
      <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      <div
        className={cx(
          "container mx-auto grid gap-12 px-5 py-16 md:px-10 md:py-24 lg:items-center lg:gap-8 lg:py-28",
          align === "center"
            ? "justify-items-center max-w-4xl mx-auto"
            : "lg:grid-cols-2 lg:items-center"
        )}
      >
        {/* =================================================
            LEFT — badge, heading, copy, features, CTA + note.
        ================================================= */}
        <div className={cx("flex flex-col gap-6", ALIGN_ITEMS[align])}>
          {eyebrow && (
            <span
              className={cx(
                "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ring-1 z-2",
                theme?.eyebrowBg ?? "bg-white/80",
                theme?.eyebrowText ?? "text-emerald-700",
                theme ? "ring-black/5" : "ring-emerald-100"
              )}
            >
              <MessageCircle size={14} aria-hidden />
              {eyebrow}
            </span>
          )}

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              " text-[30px] leading-[1.15] font-extrabold tracking-tight sm:text-[36px] md:text-[42px] z-2",
              TEXT_ALIGN[align],
              align === "center" ? "max-w-3xl": "max-w-lg",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

          {description && (
            <div
              className={cx(
                "rich-text max-w-md text-[15.5px] leading-relaxed md:text-[17px] z-2",
                TEXT_ALIGN[align],
                align === "center" ? "max-w-3xl": "max-w-md",
                theme?.body ?? "text-gray-500"
              )}
            >
              {description}
            </div>
          )}

          {/* =================================================
              FEATURES — one per contentDetail entry.
          ================================================= */}
          <div
            ref={cardsRef}
            className="mt-2 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2"
          >
            {features.map((feature, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <div
                  key={feature.name}
                  onMouseEnter={handleCardEnter}
                  onMouseLeave={handleCardLeave}
                  className={cx(
                "flex flex-col gap-3 z-2 border p-5 rounded-2xl shadow-[0_4px_14px_-8px_rgba(16,24,40,0.08)]",
                ALIGN_ITEMS[align],
                theme?.cardBorder ?? "border-gray-100",
                theme?.cardBg ?? "bg-white"
              )}
                >
                  <div
                    data-feature-icon
                    className={cx(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      theme?.eyebrowBg ?? "bg-emerald-100",
                      theme?.accentText ?? "text-emerald-700"
                    )}
                  >
                    {feature.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                      <img
                        src={feature.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={20} aria-hidden />
                    )}
                  </div>

                  <div>
                    <h3
                      className={cx(
                        "text-[14.5px] leading-snug font-bold",
                        TEXT_ALIGN[align],
                        theme?.heading ?? "text-gray-900"
                      )}
                    >
                      {feature.name}
                    </h3>
                    {feature.description && (
                      <p
                        className={cx(
                          "mt-1 text-[13px] leading-relaxed",
                          TEXT_ALIGN[align],
                          theme?.body ?? "text-gray-500"
                        )}
                      >
                        {feature.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* =================================================
              CTA + handwritten-style note.
          ================================================= */}
          {(ctaLabel || note) && (
            <div
              className={cx(
                "mt-4 flex flex-wrap items-center gap-4",
                JUSTIFY_CONTENT[align]
              )}
            >
              {ctaLabel && (
                <Link
                  href={ctaHref}
                  className={cx(
                    "inline-flex w-fit items-center gap-2 z-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                    theme?.buttonBg ?? "bg-emerald-600",
                    theme?.buttonText ?? "text-white",
                    theme?.buttonHoverBg ?? "hover:bg-emerald-500"
                  )}
                >
                  <Send size={16} aria-hidden />
                  {ctaLabel}
                </Link>
              )}

              {note && (
                <>
                  <span
                    aria-hidden
                    className={cx(
                      "hidden items-center gap-1.5 sm:inline-flex z-2",
                      theme?.accentText ?? "text-emerald-600"
                    )}
                  >
                    <svg
                      width="34"
                      height="20"
                      viewBox="0 0 34 20"
                      fill="none"
                      className="-scale-x-100"
                    >
                      <path
                        d="M1 2c8 0 12 14 20 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray="3 4"
                      />
                      <path
                        d="M17 12l4 4-4.5 2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </span>

                  <span
                    className={cx(
                      "text-[13.5px] font-medium italic z-2",
                      theme?.accentText ?? "text-emerald-600"
                    )}
                  >
                    {note}
                  </span>
                </>
              )}
            </div>
          )}

          {noteBottom && (
            <p
              className={cx(
                "mt-1 inline-flex items-center gap-1.5 text-[13px] z-2",
                theme?.muted ?? "text-gray-500"
              )}
            >
              <Clock size={14} aria-hidden />
              {noteBottom}
            </p>
          )}
        </div>

        {/* =================================================
            RIGHT — empty spacer. The illustration itself is now the
            whole section's background (see the `<section>` above), so
            this column just reserves space on large screens, keeping
            the copy to the left half where the scrim is strongest.
        ================================================= */}
        <div aria-hidden className="hidden lg:block" />
      </div>
    </section>
  );
}
