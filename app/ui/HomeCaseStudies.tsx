"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Quote,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
  StatisticSkeleton,
  TestimonialSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeProducts use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/** Splits a plain-text heading on `*word*` markers and renders the marked segments in the theme's accent color (emerald by default) — lets an editor emphasize specific words (e.g. "Results that *speak*. Impact that *scales*.") without needing rich text on `dataText.heading`. */
function renderHighlightedHeading(
  heading: string,
  theme?: SectionTheme
): ReactNode {
  return heading.split(/(\*[^*]+\*)/g).map((part, index) => {
    const match = /^\*([^*]+)\*$/.exec(part);

    if (!match) {
      return part;
    }

    return (
      <span key={index} className={theme?.accentText ?? "text-emerald-600"}>
        {match[1]}
      </span>
    );
  });
}

interface StatItem {
  value: string;
  label: string;
  iconUrl?: string;
}

interface CaseStudyItem {
  id: string;
  /** The first `contentDetail` entry among `elements` gets the "Featured" badge instead of its category; otherwise every card uses the same layout (see `CaseStudyCard`). */
  featured: boolean;
  title: string;
  category?: string;
  description?: string;
  /** Every card's inline photo, from `heroImage` — blank until an editor sets one, no placeholder photo. */
  imageUrl?: string;
  clientName?: string;
  clientLogoUrl?: string;
  stats: StatItem[];
  ctaHref: string;
  ctaLabel?: string;
}

/** Maps a resolved `contentDetail` entry to one `CaseStudyItem` — reusing `contentDetail` (title/category/shortDescription/heroImage/clientName/clientLogo/statistics/cta/slug) instead of a dedicated content type, same pattern as HomeProducts/HomeServices. */
function contentDetailToCaseStudyItem(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): CaseStudyItem {
  const heroImageEntry = entry.fields.heroImage;
  const imageUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
        (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
          .image
      )
    : undefined;

  const clientLogoEntry = entry.fields.clientLogo;
  const clientLogoUrl = isEntry(clientLogoEntry)
    ? getAssetUrl(
        (clientLogoEntry as unknown as PlainEntry<DataImageSkeleton>).fields
          .image
      )
    : undefined;

  const stats: StatItem[] = (entry.fields.statistics ?? [])
    .filter(isEntry)
    .map((stat) => {
      const statistic = stat as unknown as PlainEntry<StatisticSkeleton>;
      const iconEntry = statistic.fields.icon;

      return {
        value: statistic.fields.value ?? "",
        label: statistic.fields.label ?? "",
        iconUrl: isEntry(iconEntry)
          ? getAssetUrl(
              (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields
                .image
            )
          : undefined,
      };
    });

  const ctaLink = entry.fields.cta?.find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;
  const ctaHref =
    (ctaLink && resolveLinkHref(ctaLink)) ??
    (entry.fields.slug ? `/case-studies/${entry.fields.slug}` : "#");
  const ctaLabel = ctaLink?.fields.label;

  return {
    id: entry.sys.id,
    featured: index === 0,
    title: entry.fields.title ?? "",
    category: entry.fields.category,
    description: entry.fields.shortDescription,
    imageUrl,
    clientName: entry.fields.clientName,
    clientLogoUrl,
    stats,
    ctaHref,
    ctaLabel,
  };
}

/** Maps a resolved `statistic` entry placed directly among the composableElement's `elements` (a sibling of `dataText`/`contentDetail`/`testimonial`, not nested inside any one case study) to one `StatItem` — used for the testimonial section's 3 highlight badges (e.g. "+70% Efficiency Gain"), which summarize impact across cases rather than belonging to a single one. */
function statisticEntryToStatItem(
  entry: PlainEntry<StatisticSkeleton>
): StatItem {
  const iconEntry = entry.fields.icon;

  return {
    value: entry.fields.value ?? "",
    label: entry.fields.label ?? "",
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
          (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorPhotoUrl?: string;
  clientLogoUrl?: string;
  /** Up to 3 highlight stat badges shown alongside this testimonial — each testimonial carries its own, since different quotes highlight different results (see `TestimonialSkeleton.stats`). */
  stats: StatItem[];
}

/** Maps a resolved `testimonial` entry to one `TestimonialItem`. */
function testimonialToItem(
  entry: PlainEntry<TestimonialSkeleton>
): TestimonialItem {
  const photoEntry = entry.fields.authorPhoto;
  const authorPhotoUrl = isEntry(photoEntry)
    ? getAssetUrl(
        (photoEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const logoEntry = entry.fields.clientLogo;
  const clientLogoUrl = isEntry(logoEntry)
    ? getAssetUrl(
        (logoEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const stats = (entry.fields.stats ?? [])
    .filter(
      (stat): stat is PlainEntry<StatisticSkeleton> => isEntry(stat)
    )
    .map(statisticEntryToStatItem);

  return {
    id: entry.sys.id,
    quote: entry.fields.quote ?? "",
    authorName: entry.fields.authorName ?? "",
    authorTitle: entry.fields.authorTitle,
    authorPhotoUrl,
    clientLogoUrl,
    stats,
  };
}

/** Cycled by card index as a fallback when a case study's `category` has no matching icon (contentDetail's `icon` field isn't used for the category glyph — this just gives every card a bit of visual variety). */
const FALLBACK_CATEGORY_ICONS: LucideIcon[] = [BarChart3, Boxes];

/** Cycled by stat index as a fallback when a `statistic` entry has no `icon` image set. */
const STAT_ICONS: LucideIcon[] = [Zap, TrendingUp, Users];

/**
 * Placeholder roster, used only when the `composableElement`'s `elements`
 * has no `contentDetail` entries yet. Swap/add real case studies in
 * Contentful by adding `contentDetail` entries (the first one becomes the
 * large "featured" card, the rest render as regular cards) — nothing here
 * needs to change.
 */
const DEFAULT_CASE_STUDIES: CaseStudyItem[] = [];

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [];

/**
 * One case-study card — uniform chrome for both the featured study and the
 * regular ones (badge/category, client logo, title, description, inline
 * photo, 3 stats, CTA), so all cards sit as equal-width slides in the
 * carousel below. The only difference for the featured study is its badge,
 * which reads "Featured" (with a sparkle icon) instead of its category.
 */
function CaseStudyCard({
  study,
  index,
  theme,
}: {
  study: CaseStudyItem;
  index: number;
  theme?: SectionTheme;
}) {
  const CategoryIcon =
    FALLBACK_CATEGORY_ICONS[index % FALLBACK_CATEGORY_ICONS.length];

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  /* =========================================================
     CARD HOVER — the whole card scales up slightly with a soft shadow,
     while the inline photo *within* it zooms in further still (see
     PHOTO HOVER below) — a layered "card grows, photo grows more"
     effect rather than either alone. GSAP rather than CSS so both
     tweens (and the photo's own, nested one) ease in lockstep. Skipped
     under prefers-reduced-motion — the card just stays put.
  ========================================================= */
  const handleCardEnter = () => {
    if (prefersReducedMotion() || !cardRef.current) {
      return;
    }

    gsap.to(cardRef.current, {
      scale: 1.03,
      boxShadow: "0 14px 28px -16px rgba(16,24,40,0.06)",
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleCardLeave = () => {
    if (prefersReducedMotion() || !cardRef.current) {
      return;
    }

    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
      clearProps: "boxShadow",
    });
  };

  /* =========================================================
     PHOTO HOVER — the inline photo zooms in slightly while its
     `overflow-hidden` wrapper crops the excess, a classic "card hover
     reveals more of the photo" treatment. GSAP rather than a plain CSS
     `hover:scale-*` so it eases out smoothly on the way back in too
     (a CSS transition on `transform` would work as well, but every
     other card/photo hover in this codebase is GSAP-driven for
     consistency — see AboutApproach/AboutCulture/HomeTalkToUs).
     Skipped under prefers-reduced-motion — the photo just stays put.
  ========================================================= */
  const handlePhotoEnter = () => {
    if (prefersReducedMotion() || !imageRef.current) {
      return;
    }

    gsap.to(imageRef.current, { scale: 1.08, duration: 0.6, ease: "power2.out" });
  };

  const handlePhotoLeave = () => {
    if (prefersReducedMotion() || !imageRef.current) {
      return;
    }

    gsap.to(imageRef.current, { scale: 1, duration: 0.5, ease: "power2.out" });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      className={cx(
        "group relative z-2 flex h-full flex-col gap-4 rounded-2xl border p-7",
        theme?.cardBorder ?? "border-gray-100 hover:border-emerald-100",
        theme?.cardBg ?? "bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cx(
            "inline-flex items-center gap-2 text-[11px] font-bold tracking-wide uppercase",
            theme?.accentText ?? "text-emerald-600"
          )}
        >
          <span
            className={cx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              theme?.eyebrowBg ?? "bg-emerald-50"
            )}
          >
            {study.featured ? (
              <Sparkles size={14} aria-hidden />
            ) : (
              <CategoryIcon size={14} aria-hidden />
            )}
          </span>
          {study.featured ? "Featured" : study.category}
        </span>

        {study.clientLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
          <img
            src={study.clientLogoUrl}
            alt={study.clientName ?? ""}
            className="h-12 w-auto object-contain"
          />
        ) : (
          study.clientName && (
            <span
              className={cx(
                "text-xs font-bold",
                theme?.muted ?? "text-gray-400"
              )}
            >
              {study.clientName}
            </span>
          )
        )}
      </div>

      <h3
        className={cx(
          "text-[17px] font-bold",
          theme?.heading ?? "text-gray-900"
        )}
      >
        {study.title}
      </h3>

      {study.description && (
        <p
          className={cx(
            "text-[13.5px] leading-relaxed",
            theme?.body ?? "text-gray-500"
          )}
        >
          {study.description}
        </p>
      )}

      {/* Inline photo, shown on every card that has one (not just the
          featured one) — blank when `heroImage` isn't set, no placeholder
          photo. */}
      {study.imageUrl && (
        <div
          onMouseEnter={handlePhotoEnter}
          onMouseLeave={handlePhotoLeave}
          className="relative mt-1 overflow-hidden rounded-1xl aspect-[1740/900]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project */}
          <img
            ref={imageRef}
            src={study.imageUrl}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {study.stats.length > 0 && (
        <div
          className={cx(
            "grid grid-cols-3 gap-2 border-t pt-4",
            theme?.cardBorder ?? "border-gray-100"
          )}
        >
          {study.stats.slice(0, 3).map((stat, statIndex) => {
            const StatIcon = STAT_ICONS[statIndex % STAT_ICONS.length];

            return (
              <div key={stat.label} className="flex flex-col gap-1">
                <span
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-md",
                    theme?.eyebrowBg ?? "bg-emerald-50",
                    theme?.accentText ?? "text-emerald-600"
                  )}
                >
                  {stat.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                    <img
                      src={stat.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-3.5 w-3.5 object-contain"
                    />
                  ) : (
                    <StatIcon size={13} aria-hidden />
                  )}
                </span>
                <span
                  className={cx(
                    "text-[13px] font-extrabold",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  {stat.value}
                </span>
                <span
                  className={cx(
                    "text-[10.5px] leading-snug",
                    theme?.body ?? "text-gray-500"
                  )}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {study.ctaLabel && (
        <Link
          href={study.ctaHref}
          className={cx(
            "group/link mt-auto inline-flex w-fit items-center gap-1.5 pt-1 text-[13.5px] font-semibold",
            theme?.accentText ?? "text-emerald-600"
          )}
        >
          {study.ctaLabel}
          <ArrowRight
            size={13}
            className="transition-transform group-hover/link:translate-x-1"
            aria-hidden
          />
        </Link>
      )}

    </div>
  );
}

/**
 * A real (Embla) 1-at-a-time testimonial slider — same mechanics as the
 * case-study carousel above (loops, autoplays, swipeable on touch,
 * skipped under reduced-motion) plus prev/next arrows and dot indicators;
 * arrows/dots only render when there's more than one testimonial. Each
 * slide shows its own testimonial's highlight stat badges (hidden on
 * mobile, where they'd crowd the quote) next to the quote, since
 * different testimonials highlight different results.
 */
function TestimonialCarousel({
  testimonials,
  theme,
}: {
  testimonials: TestimonialItem[];
  theme?: SectionTheme;
}) {
  const plugins = useMemo(
    () =>
      !prefersReducedMotion()
        ? [
            Autoplay({
              delay: 6000,
              stopOnMouseEnter: true,
              stopOnInteraction: false,
            }),
          ]
        : [],
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins);

  const [, rerender] = useReducer((tick: number) => tick + 1, 0);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    emblaApi.on("select", rerender);
    emblaApi.on("reInit", rerender);

    return () => {
      emblaApi.off("select", rerender);
      emblaApi.off("reInit", rerender);
    };
  }, [emblaApi]);

  const scrollSnaps = emblaApi?.scrollSnapList() ?? [];
  const selectedIndex = emblaApi?.selectedScrollSnap() ?? 0;

  if (!testimonials.length) {
    return null;
  }

  return (
    <div
      className={cx(
        "relative mt-10 overflow-hidden rounded-3xl p-8 md:p-10 z-2 border ",
        theme?.cardBorder ?? "border-gray-100 hover:border-emerald-100",
        theme?.cardBg ?? "bg-white"
      )}
    >

      {/* SLIDER — one testimonial (quote + its own stat badges) per slide, swipeable/looping via Embla. */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-[0_0_100%] flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 px-4"
            >
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center lg:mx-0 lg:items-start lg:text-left">
                <Quote
                  size={30}
                  className={theme?.eyebrowText ?? "text-emerald-300"}
                  aria-hidden
                />

                <p
                  className={cx(
                    "text-[16px] leading-relaxed italic md:text-[18px]",
                    theme?.body ?? "text-gray-700"
                  )}
                >
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  {testimonial.authorPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                    <img
                      src={testimonial.authorPhotoUrl}
                      alt=""
                      aria-hidden
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}

                  <div className="text-left">
                    <div
                      className={cx(
                        "text-[14px] font-bold",
                        theme?.accentText ?? "text-emerald-700"
                      )}
                    >
                      {testimonial.authorName}
                    </div>
                    {testimonial.authorTitle && (
                      <div
                        className={cx(
                          "text-[12.5px]",
                          theme?.muted ?? "text-gray-500"
                        )}
                      >
                        {testimonial.authorTitle}
                      </div>
                    )}
                  </div>

                  {testimonial.clientLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                    <img
                      src={testimonial.clientLogoUrl}
                      alt=""
                      aria-hidden
                      className="ml-2 h-6 w-auto object-contain"
                    />
                  )}
                </div>
              </div>

              {/* This testimonial's own highlight stat badges — different
                  testimonials can spotlight different results. Hidden on
                  mobile to keep the quote the focus there. */}
              {testimonial.stats.length > 0 && (
                <div className="hidden shrink-0 items-center justify-center gap-3 lg:flex">
                  {testimonial.stats.slice(0, 3).map((stat, statIndex) => {
                    const StatIcon = STAT_ICONS[statIndex % STAT_ICONS.length];

                    return (
                      <div
                        key={stat.label}
                        className={cx(
                          "flex w-24 flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-center shadow-sm min-w-[125px] min-h-[125px]",
                          theme?.cardBg ?? "bg-white"
                        )}
                      >
                        <span
                          className={cx(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            theme?.eyebrowBg ?? "bg-emerald-50",
                            theme?.accentText ?? "text-emerald-600"
                          )}
                        >
                          {stat.iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                            <img
                              src={stat.iconUrl}
                              alt=""
                              aria-hidden
                              className="h-4 w-4 object-contain"
                            />
                          ) : (
                            <StatIcon size={15} aria-hidden />
                          )}
                        </span>
                        <span
                          className={cx(
                            "text-[15px] font-extrabold",
                            theme?.heading ?? "text-gray-900"
                          )}
                        >
                          {stat.value}
                        </span>
                        <span
                          className={cx(
                            "text-[10.5px] leading-snug",
                            theme?.body ?? "text-gray-500"
                          )}
                        >
                          {stat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous testimonial"
            className={cx(
              "absolute top-1/2 left-2 -translate-y-1/2 rounded-full border p-2 shadow-md transition-colors md:left-3",
              theme?.cardBorder ?? "border-emerald-100",
              theme?.cardBg ?? "bg-white",
              theme?.accentText ?? "text-emerald-700"
            )}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next testimonial"
            className={cx(
              "absolute top-1/2 right-2 -translate-y-1/2 rounded-full border p-2 shadow-md transition-colors md:right-3",
              theme?.cardBorder ?? "border-emerald-100",
              theme?.cardBg ?? "bg-white",
              theme?.accentText ?? "text-emerald-700"
            )}
          >
            <ChevronRight size={18} aria-hidden />
          </button>

          <div className="relative mt-6 flex items-center justify-center gap-2">
            {scrollSnaps.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => emblaApi?.scrollTo(dotIndex)}
                aria-label={`Go to testimonial ${dotIndex + 1}`}
                className={cx(
                  "h-2 rounded-full transition-all duration-300",
                  dotIndex === selectedIndex
                    ? cx("w-6", theme?.buttonBg ?? "bg-emerald-600")
                    : "w-2 bg-emerald-200 hover:bg-emerald-300"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * A modal listing every testimonial at once (quote, author, and its own
 * stat badges) — opened via the "View all testimonials" link below the
 * slider (see `HomeCaseStudies`), for when there are more testimonials
 * than comfortably fit in the 1-at-a-time slider above. Closes on
 * Escape, backdrop click, or the close button — same conventions as
 * Navbar's mobile panel (plain `useEffect` + DOM listeners, manual body
 * scroll lock), just with proper dialog ARIA semantics since this is a
 * true modal rather than an inline panel.
 */
function TestimonialsModal({
  testimonials,
  onClose,
  theme,
}: {
  testimonials: TestimonialItem[];
  onClose: () => void;
  theme?: SectionTheme;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All testimonials"
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 md:px-8">
          <h3 className="text-lg font-bold text-gray-900">
            All Testimonials
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="flex flex-col gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="rounded-2xl border border-gray-100 p-5"
              >
                <Quote
                  size={20}
                  className={theme?.eyebrowText ?? "text-emerald-300"}
                  aria-hidden
                />

                <p className="mt-2 text-[14.5px] leading-relaxed text-gray-700 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="mt-4 flex items-center gap-3">
                  {testimonial.authorPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                    <img
                      src={testimonial.authorPhotoUrl}
                      alt=""
                      aria-hidden
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}

                  <div>
                    <div
                      className={cx(
                        "text-[13.5px] font-bold",
                        theme?.accentText ?? "text-emerald-700"
                      )}
                    >
                      {testimonial.authorName}
                    </div>
                    {testimonial.authorTitle && (
                      <div className="text-[12px] text-gray-500">
                        {testimonial.authorTitle}
                      </div>
                    )}
                  </div>

                  {testimonial.clientLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                    <img
                      src={testimonial.clientLogoUrl}
                      alt=""
                      aria-hidden
                      className="ml-1 h-5 w-auto object-contain"
                    />
                  )}
                </div>

                {testimonial.stats.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4">
                    {testimonial.stats.map((stat) => (
                      <div key={stat.label} className="text-[12.5px]">
                        <span
                          className={cx(
                            "font-extrabold",
                            theme?.accentText ?? "text-emerald-600"
                          )}
                        >
                          {stat.value}
                        </span>{" "}
                        <span className="text-gray-500">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "Case Studies", rendered from a `composableElement` entry (`subType:
 * "casestudy"` — see `ComposableElementRenderer`):
 *
 * - one `dataText` entry among `elements` supplies the eyebrow/heading/
 *   description intro copy — `heading` supports a lightweight `*word*`
 *   marker convention (see `renderHighlightedHeading`) so specific words
 *   render in emerald without needing rich text
 * - a top-level `dataLink` entry among `elements` (distinct from each
 *   contentDetail's own `cta`) supplies the "See all case studies" link,
 *   same pattern as HomeServices' "Explore all services" CTA
 * - every `contentDetail` entry among `elements` becomes one case-study
 *   card (via `contentDetailToCaseStudyItem`) — the first one is the
 *   "featured" study (just a different badge; see `CaseStudyCard`). All
 *   cards are equal-width slides in an Embla carousel (1 per view on
 *   mobile, 2 on tablet, 3 on desktop+ — same setup as `CommonTrustedBy`'s
 *   logo wall), so any number of `contentDetail` entries works; reorder
 *   them in Contentful to change
 *   which one is featured
 * - every `testimonial` entry among `elements` becomes one slide in the
 *   testimonial carousel below the cards (arrows + dots only shown when
 *   there's more than one) — each testimonial's own `stats` field (up to
 *   3 `statistic` entries, via `statisticEntryToStatItem`) renders as
 *   highlight badges next to that testimonial's quote, since different
 *   testimonials can spotlight different results
 * - the composableElement's own `backgroundImage` field (links to a
 *   `dataImage` entry, same field HomeAboutUs/HomeAI/HomeProducts use) is
 *   an *optional* full-bleed section background — no placeholder, so the
 *   section just renders on its plain background until an editor sets one
 *
 * Every field above renders exactly what's in Contentful — an unset
 * eyebrow/heading/"view all" label simply renders nothing (no hardcoded
 * placeholder copy), an empty `contentDetail` roster renders no case
 * study cards, and an empty `testimonial` roster renders no testimonial
 * slider. Each card's own inline photo (`heroImage`) is blank until an
 * editor sets one — no placeholder photo.
 *
 * Animation is scoped to only the heading (GSAP split-text reveal, same
 * treatment as HomeServices/HomeProducts/HomeAI) — nothing else in this
 * section animates.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeCaseStudies({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const viewAllLink = elements.find(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const caseStudies = contentDetailEntries.length
    ? contentDetailEntries.map(contentDetailToCaseStudyItem)
    : DEFAULT_CASE_STUDIES;

  const testimonialEntries = elements.filter(
    (element): element is PlainEntry<TestimonialSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "testimonial"
  );
  const testimonials = testimonialEntries.length
    ? testimonialEntries.map(testimonialToItem)
    : DEFAULT_TESTIMONIALS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;
  const viewAllHref = viewAllLink ? resolveLinkHref(viewAllLink) : "/case-studies";
  const viewAllLabel = viewAllLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAboutUs's optional background uses). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one.
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
  // (including inside CaseStudyCard/TestimonialCarousel/TestimonialsModal)
  // falls back to this section's existing default (today's plain look).
  const theme = resolveTheme(entry.fields.themeColor);

  const [isTestimonialsModalOpen, setTestimonialsModalOpen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     HomeServices/HomeProducts/HomeAI). Nothing else in this section
     animates. Skipped entirely under prefers-reduced-motion.
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
     CASE STUDY CARDS — Embla Carousel, same setup as CommonTrustedBy's
     logo wall: loops, autoplays (paused on hover/interaction, skipped
     under reduced-motion), 1 card per view on mobile / 2 on tablet / 3 on
     desktop+ via each slide's own responsive flex-basis below.
  ========================================================= */
  const carouselPlugins = useMemo(
    () =>
      !prefersReducedMotion()
        ? [
            Autoplay({
              delay: 5000,
              stopOnMouseEnter: true,
              stopOnInteraction: false,
            }),
          ]
        : [],
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    carouselPlugins
  );

  const [, rerenderCarousel] = useReducer((tick: number) => tick + 1, 0);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    emblaApi.on("select", rerenderCarousel);
    emblaApi.on("reInit", rerenderCarousel);

    return () => {
      emblaApi.off("select", rerenderCarousel);
      emblaApi.off("reInit", rerenderCarousel);
    };
  }, [emblaApi]);

  const carouselSnaps = emblaApi?.scrollSnapList() ?? [];
  const carouselSelectedIndex = emblaApi?.selectedScrollSnap() ?? 0;

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl && theme?.sectionBg
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
          DECORATIVE BACKGROUND — same treatment as CommonTrustedBy/
          HomeProducts; a light scrim over the background image instead
          when there is one, so the cards stay readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-24 lg:py-28">
        {/* =================================================
            INTRO
        ================================================= */}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide z-2",
                theme?.eyebrowBg ?? "bg-emerald-50",
                theme?.eyebrowText ?? "text-emerald-700"
              )}
            >
              {eyebrow}
            </span>
          )}

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] z-2",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading && renderHighlightedHeading(heading, theme)}
          </DynamicHeading>

          <div
            className={cx(
              "rich-text max-w-xl text-[15.5px] leading-relaxed md:text-[17px] z-2",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>
        </div>

        {/* =================================================
            CASE STUDY CARDS — Embla carousel, 1 slide per view on
            mobile / 2 on tablet / 3 on desktop+ (each slide's flex-basis
            below), looping. Works for any number of case studies.
        ================================================= */}
        <div className="relative mt-16 md:mt-20 z-2">
          {/* `py-4 -my-4` gives the viewport's clip box a few extra
              pixels of headroom above/below without changing the
              carousel's own footprint in the page (the negative margin
              cancels the padding's effect on layout) — otherwise
              CaseStudyCard's hover scale-up got its top/bottom edges
              cut off right at this `overflow-hidden` boundary, which
              still has to stay in place (embla needs it to clip slides
              horizontally). */}
          <div className="overflow-hidden py-4 -my-4" ref={emblaRef}>
            <div
              className={cx(
                "-ml-6 flex",
                // Each breakpoint shows a fixed number of slides per view
                // (1 / 2 / 3 — see each slide's own flex-basis below). When
                // there are fewer case studies than that, the row doesn't
                // fill the track and sits left-aligned by default; center
                // it instead so a lone 1- or 2-card roster doesn't look
                // stranded against the left edge. A full (3+) roster is
                // unaffected — the row already fills the track, so
                // `justify-center` there is a no-op.
                caseStudies.length < 2 && "sm:justify-center",
                caseStudies.length < 3 && "lg:justify-center"
              )}
            >
              {caseStudies.map((study, index) => (
                <div
                  key={study.id}
                  className="flex-[0_0_100%] pl-6 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  <CaseStudyCard study={study} index={index} theme={theme} />
                </div>
              ))}
            </div>
          </div>

          {carouselSnaps.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                aria-label="Previous case study"
                className="absolute top-1/2 left-0 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50 md:flex"
              >
                <ChevronLeft size={18} aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                aria-label="Next case study"
                className="absolute top-1/2 right-0 z-20 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50 md:flex"
              >
                <ChevronRight size={18} aria-hidden />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2">
                {carouselSnaps.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    className={cx(
                      "h-2 rounded-full transition-all duration-300",
                      dotIndex === carouselSelectedIndex
                        ? cx("w-6", theme?.buttonBg ?? "bg-emerald-600")
                        : "w-2 bg-gray-200 hover:bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* =================================================
            TESTIMONIAL
        ================================================= */}
        <TestimonialCarousel testimonials={testimonials} theme={theme} />

        {testimonials.length > 1 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setTestimonialsModalOpen(true)}
              className={cx(
                "text-[13.5px] font-semibold hover:underline",
                theme?.accentText ?? "text-emerald-600"
              )}
            >
              View all testimonials
            </button>
          </div>
        )}

        {isTestimonialsModalOpen && (
          <TestimonialsModal
            testimonials={testimonials}
            onClose={() => setTestimonialsModalOpen(false)}
            theme={theme}
          />
        )}

        {/* =================================================
            "SEE ALL CASE STUDIES" LINK
        ================================================= */}
        {viewAllHref && viewAllLabel && (
          <div className="mt-10 text-center">
            <Link
              href={viewAllHref}
              className={cx(
              "inline-flex relative z-2 w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
              theme?.buttonBg ?? "bg-emerald-600",
              theme?.buttonText ?? "text-white",
              theme?.buttonHoverBg ?? "hover:bg-emerald-500"
            )}
            >
              {viewAllLabel}
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
