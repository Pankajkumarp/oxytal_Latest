"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ArrowRight,
  Box,
  Brain,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import {
  CallToActionSkeleton,
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeAI/HomeProducts/HomeTalkToUs use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface FeatureItem {
  name: string;
  description?: string;
  iconUrl?: string;
  badge?: string;
  /** Whether the icon slot (image or fallback glyph) should render at all — from `contentDetail.showIcon`, defaulting to shown when unset. */
  showIcon: boolean;
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [Brain, ShieldCheck, Box, Sparkles];

/** Maps a resolved `contentDetail` entry to the plain `FeatureItem` shape this component renders — reusing `contentDetail` (title/shortDescription/icon/showIcon) instead of a dedicated content type, same pattern as HomeProducts/HomeTalkToUs. */
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
    badge: entry.fields.badge,
    // `showIcon` is optional in Contentful — an entry that has never set it
    // comes back as `undefined`, which should still show the icon (today's
    // behavior, unchanged). Only an explicit `false` hides it.
    showIcon: entry.fields.showIcon !== false,
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
 * "About Us", rendered from a `composableElement` entry (`subType:
 * "aboutus"` — see `ComposableElementRenderer`):
 *
 * - the first `callToAction` entry among `elements` supplies the intro:
 *   `eyebrow` for the small label, `title` + `highlightText` for the
 *   heading (`highlightText` renders in emerald, same convention
 *   PageBody's own `callToAction` case uses), `description` (plain
 *   `Text`, not `RichText` — rendered directly into a `<p>`, same as
 *   PageBody's own `callToAction` case) for the paragraph under the
 *   heading, and the first entry in `ctaButton` for the "Learn how we
 *   work" link
 * - every `contentDetail` entry among `elements` becomes one feature item
 *   (via `contentDetailToFeatureItem`) — `title`/`shortDescription` as the
 *   name/description, `icon` (falls back to a cycled Lucide icon, unless
 *   `showIcon` is explicitly `false`) as the glyph, and `badge` as a small
 *   label above the title (renders nothing when unset)
 * - the composableElement's own `backgroundImage` field (links to a
 *   `dataImage` entry, same field HomeTalkToUs uses) is an *optional*
 *   full-bleed section background image — unlike HomeTalkToUs there's no
 *   placeholder fallback photo here, so the section just renders on its
 *   plain light background until an editor sets one
 *
 * Every field above renders exactly what's in Contentful — an unset
 * eyebrow simply renders nothing (no hardcoded placeholder copy), and an
 * empty `contentDetail` roster renders no feature cards.
 *
 * Animation: the heading gets the same GSAP split-text reveal every
 * sibling section's own heading uses; the feature cards fade + rise in
 * with a stagger as the grid scrolls into view, and each card gets its
 * own GSAP hover (a quieter lift + shadow than HomeTalkToUs' own, with
 * the icon growing via a single clean scale rather than a bounce) — see
 * the CARD LOAD REVEAL/CARD HOVER comments below.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeAboutUs({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const intro = elements.find(
    (element): element is PlainEntry<CallToActionSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "callToAction"
  );

  const ctaLink = intro?.fields.ctaButton?.find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;

  const contentDetailFeatures = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToFeatureItem);

  const eyebrow = intro?.fields.eyebrow;
  const title =
    intro?.fields.title ??
    "";
  const highlight = intro?.fields.highlightText ?? "";
  // `description` is a plain `Text` field on `callToAction` (see
  // app/types/contentful.ts), not `RichText` — same plain-string value
  // PageBody's own `callToAction` case (in app/ui/PageBody.tsx) renders
  // directly into a `<p>`, no `documentToReactComponents` involved.
  const description = intro?.fields.description;
  const features = contentDetailFeatures.length
    ? contentDetailFeatures
    : DEFAULT_FEATURES;

  const ctaHref = (ctaLink && resolveLinkHref(ctaLink)) ?? "";
  const ctaLabel = ctaLink?.fields.label ?? "";

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeTalkToUs/PageBody's default composableElement renderer
  // use). Optional here: no placeholder fallback, so it's simply absent
  // until an editor sets one.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to its text/button/card colors. `undefined` for an
  // unset or unrecognized value, in which case every themed class below
  // falls back to this section's existing default (today's plain look).
  const theme = resolveTheme(entry.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading splits into words on scroll-in (same
     GSAP split-text treatment as HomeServices/HomeProducts/HomeAI/
     HomeTalkToUs). Skipped entirely under prefers-reduced-motion.
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
     HomeTalkToUs/AISolutionsCapabilities' own card grids use. Skipped
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
     CARD HOVER — distinct from HomeTalkToUs' own lift + icon-elastic-
     pop treatment (and every other sibling section's lift/tilt/pulse/
     spotlight/focus-bracket hover): a quieter lift with a softer, wider
     shadow, and the icon grows with a single clean scale — no bounce,
     no rotation. GSAP rather than CSS so the shadow and lift stay in
     lockstep as one tween. Skipped under prefers-reduced-motion — the
     card keeps its plain static shadow with no hover motion in that
     case.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-feature-icon]");

    gsap.to(card, {
      y: -4,
      boxShadow: "0 16px 32px -14px rgba(16,24,40,0.14)",
      duration: 0.4,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, { scale: 1.12, duration: 0.4, ease: "power2.out" });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-feature-icon]");

    // `clearProps` rather than animating back to an explicit value —
    // the card keeps its own static shadow (the `shadow-[...]` class
    // below) at rest, so leaving just drops the inline override instead
    // of animating all the way down to no shadow at all.
    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      clearProps: "boxShadow",
    });

    if (icon) {
      gsap.to(icon, { scale: 1, duration: 0.35, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
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
          DECORATIVE BACKGROUND — a soft mint wash in the top-right
          corner when there's no real background image; a light scrim
          over it instead when there is, so the copy stays readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-24 lg:py-28">
        {/* =================================================
            INTRO — eyebrow, heading (with highlighted tail), CTA link.
        ================================================= */}
        <div className="flex max-w-2xl flex-col items-start gap-6">
          {eyebrow && (
            <span
              className={cx(
                "inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase z-2",
                theme?.accentText ?? "text-emerald-600"
              )}
            >
              <span
                aria-hidden
                className={cx("h-px w-6 z-2", theme?.buttonBg ?? "bg-emerald-500")}
              />
              {eyebrow}
            </span>
          )}

          <h2
            ref={headingRef}
            className={cx(
              "text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] z-2",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {title}{" "}
            <span className={theme?.accentText ?? "text-emerald-600"}>
              {highlight}
            </span>
          </h2>
          {description && (
            <p
              className={cx("mt-1 max-w-2xl text-[15px] leading-relaxed", theme?.body ?? "text-[#565A57]")}
            >
              {description}
            </p>
          )}
{ctaLabel ? (
          <Link
            href={ctaHref}
            className={cx(
              "group inline-flex items-center gap-3 text-[15px] font-semibold z-2",
              theme?.accentText ?? "text-emerald-700"
            )}
          >
            <span
              className={cx(
                "flex z-2 h-9 w-9 items-center justify-center rounded-full border transition-transform duration-300 group-hover:translate-x-0.5",
                theme?.cardBorder ?? "border-emerald-200",
                theme?.cardBg ?? "bg-white",
                theme?.accentText ?? "text-emerald-600"
              )}
            >
              <ArrowRight size={16} aria-hidden />
            </span>
            {ctaLabel}
          </Link>
):null}
        </div>

        {/* =================================================
            FEATURES — one per contentDetail entry.
        ================================================= */}
        <div
          ref={cardsRef}
          className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 md:mt-12 md:grid-cols-4"
        >
          {features.map((feature, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
            return (
              <div key={feature.name}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "rounded-xl z-2 p-7 shadow-[0_4px_14px_-8px_rgba(16,24,40,0.08)]",
                theme?.cardBorder ?? "border-gray-100",
                theme?.cardBg ?? "bg-white"
              )}
              >
                
                {feature.showIcon && (
                  <div
                    data-feature-icon
                    className={cx(
                      "flex h-11 w-11 items-center justify-center rounded-xl z-2 mb-3",
                      theme?.eyebrowBg ?? "bg-emerald-50",
                      theme?.accentText ?? "text-emerald-600"
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
                )}

                <div>
                  {feature.badge && (
                    <span
                      className={cx(
                        "text-[14px] font-semibold uppercase mb-2 block",
                        theme?.accentText ?? "text-emerald-600"
                      )}
                    >
                      {feature.badge}
                    </span>
                  )}
                  <h3
                    className={cx(
                      "text-[17px] font-bold",
                      theme?.heading ?? "text-gray-900"
                    )}
                  >
                    {feature.name}
                  </h3>
                  {feature.description && (
                    <p
                      className={cx(
                        "mt-1 text-[13.5px] leading-relaxed",
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
      </div>
    </section>
  );
}
