"use client";

import { ReactNode, useEffect, useMemo, useReducer } from "react";
import gsap from "gsap";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Entry, EntrySkeletonType } from "contentful";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
  TestimonialSkeleton,
} from "../types/contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

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

interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorPhotoUrl?: string;
}

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_TESTIMONIALS: Testimonial[] = [];

/** Maps a resolved `testimonial` entry to the plain shape this component renders. */
function testimonialToItem(entry: PlainEntry<TestimonialSkeleton>): Testimonial {
  const photoEntry = entry.fields.authorPhoto;

  return {
    id: entry.sys.id,
    quote: entry.fields.quote ?? "",
    authorName: entry.fields.authorName ?? "",
    authorTitle: entry.fields.authorTitle,
    authorPhotoUrl: isEntry(photoEntry)
      ? getAssetUrl(
          (photoEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

/** Derives 1–2 initials from a name (e.g. "Rachel Mullins" → "RM") — used as the avatar fallback when a testimonial has no `authorPhoto` set. */
function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* =========================================================
   CARD HOVER — the card lifts with a soft shadow while a large
   quote-mark glyph behind the stars scales up + rotates slightly,
   reverting on leave. Module-level (not a closure) since neither
   handler depends on anything but the hovered card itself — shared by
   every `TestimonialCard`, whether rendered in the static grid/centered
   layout or as a carousel slide. Skipped under prefers-reduced-motion.
========================================================= */
function handleCardEnter(event: React.MouseEvent<HTMLDivElement>) {
  if (prefersReducedMotion()) return;

  gsap.to(event.currentTarget, { y: -6, boxShadow: "0 18px 36px -18px rgba(16,24,40,0.16)", duration: 0.35, ease: "power2.out" });

  const mark = event.currentTarget.querySelector<HTMLElement>("[data-quote-mark]");
  if (mark) {
    gsap.killTweensOf(mark);
    gsap.to(mark, { scale: 1.25, rotate: -8, opacity: 0.5, duration: 0.4, ease: "power2.out" });
  }
}

function handleCardLeave(event: React.MouseEvent<HTMLDivElement>) {
  if (prefersReducedMotion()) return;

  gsap.to(event.currentTarget, { y: 0, duration: 0.4, ease: "power2.out", clearProps: "boxShadow" });

  const mark = event.currentTarget.querySelector<HTMLElement>("[data-quote-mark]");
  if (mark) {
    gsap.killTweensOf(mark);
    gsap.to(mark, { scale: 1, rotate: 0, opacity: 0.15, duration: 0.4, ease: "power2.out" });
  }
}

/** One testimonial card — rendered as every carousel slide (see `LandingTestimonials`'s own doc comment). */
function TestimonialCard({ testimonial, theme }: { testimonial: Testimonial; theme?: SectionTheme }) {
  return (
    <div
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      className={cx(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border p-7",
        theme?.cardBorder ?? "border-gray-100",
        theme?.cardBg ?? "bg-white shadow-sm"
      )}
    >
      <span
        data-quote-mark
        aria-hidden
        className={cx(
          "pointer-events-none absolute -top-2 -right-1 text-[80px] font-serif leading-none opacity-15",
          theme?.accentText ?? "text-blue-500"
        )}
      >
        &rdquo;
      </span>

      <div className="relative z-1 flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={14} className="fill-amber-400 text-amber-400" />
        ))}
      </div>

      <p className={cx("relative z-1 mt-3.5 flex-1 text-[14.5px] leading-relaxed", theme?.body ?? "text-gray-700")}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="relative z-1 mt-5 flex items-center gap-3">
        {testimonial.authorPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
          <img src={testimonial.authorPhotoUrl} alt="" aria-hidden className="h-10.5 w-10.5 rounded-full object-cover" />
        ) : (
          <div
            className={cx(
              "flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
              theme?.eyebrowBg ?? "bg-blue-50",
              theme?.accentText ?? "text-blue-600"
            )}
          >
            {initialsFromName(testimonial.authorName)}
          </div>
        )}
        <div>
          <strong className={cx("block text-[14px] font-bold", theme?.heading ?? "text-gray-900")}>{testimonial.authorName}</strong>
          {testimonial.authorTitle && (
            <span className={cx("text-[12.5px]", theme?.muted ?? "text-gray-500")}>{testimonial.authorTitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The `/landing-page` "What clients say" grid — a `composableElement`
 * section (`subType: "landingTestimonials"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-landing-page.html`'s `.testimonial-grid`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading
 * - every `testimonial` entry among `elements` becomes one card
 *   (`quote`/`authorName`/`authorTitle`/`authorPhoto`) — same content
 *   type `HomeCaseStudies` reuses; add/remove/reorder `testimonial`
 *   entries in Contentful to change the roster
 *
 * Renders nothing when `elements` has no `testimonial` entries — no
 * hardcoded placeholder roster. The 5-star row above each quote is
 * fixed decorative chrome, not Contentful data (every quote here already
 * implies a 5-star review — there's no separate "rating" field to source
 * a different count from).
 *
 * Always renders as a swipeable, looping Embla carousel — 1 slide per
 * view on mobile, 2 on tablet, 3 on desktop+ (same multi-per-view
 * pattern `HomeServices`' carousel uses), with autoplay, arrow buttons,
 * and dot indicators (arrows/dots only appear once there's more than
 * one slide to move to). No separate static-grid layout for a small
 * count — the carousel is the one layout regardless of how many
 * `testimonial` entries there are.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`. Every card lifts
 * on hover while its quote mark scales up and rotates slightly
 * (`TestimonialCard`/`handleCardEnter`/`handleCardLeave`) — distinct
 * from `HomeCaseStudies`' card-plus-photo-zoom treatment (no photo here
 * to zoom). All skipped under `prefers-reduced-motion`, autoplay
 * included — via `Autoplay` simply not being added to the carousel's
 * plugin list when motion is disallowed.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingTestimonials({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const testimonialEntries = elements
    .filter(
      (element): element is PlainEntry<TestimonialSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "testimonial"
    )
    .map(testimonialToItem);
  const testimonials = testimonialEntries.length ? testimonialEntries : DEFAULT_TESTIMONIALS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const discrption: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;
  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  /* =========================================================
     CAROUSEL — same multi-per-view Embla setup `HomeServices`' carousel
     uses (1 slide per view on mobile / 2 tablet / 3 desktop+, looping,
     autoplay unless prefers-reduced-motion — `Autoplay` simply isn't
     added to the plugin list in that case, rather than trying to pause
     a running instance).
  ========================================================= */
  const carouselPlugins = useMemo(
    () =>
      !prefersReducedMotion()
        ? [Autoplay({ delay: 6000, stopOnMouseEnter: true, stopOnInteraction: false })]
        : [],
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, carouselPlugins);
  const [, rerenderCarousel] = useReducer((tick: number) => tick + 1, 0);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", rerenderCarousel);
    emblaApi.on("reInit", rerenderCarousel);

    return () => {
      emblaApi.off("select", rerenderCarousel);
      emblaApi.off("reInit", rerenderCarousel);
    };
  }, [emblaApi]);

  const carouselSnaps = emblaApi?.scrollSnapList() ?? [];
  const carouselSelectedIndex = emblaApi?.selectedScrollSnap() ?? 0;

  if (!eyebrow && !heading && !testimonials.length) {
    return null;
  }

  return (
    <section className={cx("relative overflow-hidden py-16 md:py-20", backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white"))} style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
              </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        {(eyebrow || heading) && (
          <div className="mx-auto max-w-2xl text-center">
            {eyebrow && (
              <span className={cx("inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", theme?.eyebrowBg ?? "bg-blue-50", theme?.eyebrowText ?? "text-blue-700")}>
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")} className={cx("mt-3.5 text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}>
                {heading}
              </DynamicHeading>
            )}
            {discrption && (
            <div className={cx("rich-text mt-3 text-[15px] leading-relaxed", theme?.body ?? "text-gray-500")}>{discrption}</div>
          )}
          </div>
        )}

        {testimonials.length > 0 && (
          /* =================================================
             CAROUSEL — 1 slide per view on mobile, 2 on tablet, 3 on
             desktop+, looping + autoplay. The `-ml-6`/`pl-6` pair is
             the standard Embla gap trick (a one-sided margin/padding
             split so slide edges still touch for dragging —
             `HomeServices`' carousel uses the same setup).
          ================================================= */
          <div className="relative mt-11">
            <div className="-my-8 overflow-hidden py-8" ref={emblaRef}>
              <div className="-ml-6 flex">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="flex-[0_0_100%] pl-6 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
                    <TestimonialCard testimonial={testimonial} theme={theme} />
                  </div>
                ))}
              </div>
            </div>

            {carouselSnaps.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  aria-label="Previous testimonial"
                  className={cx(
                    "absolute top-1/2 left-0 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border p-2.5 shadow-lg transition-colors md:flex",
                    theme?.cardBorder ?? "border-gray-100",
                    theme?.cardBg ?? "bg-white",
                    theme?.accentText ?? "text-blue-700"
                  )}
                >
                  <ChevronLeft size={18} aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  aria-label="Next testimonial"
                  className={cx(
                    "absolute top-1/2 right-0 z-20 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border p-2.5 shadow-lg transition-colors md:flex",
                    theme?.cardBorder ?? "border-gray-100",
                    theme?.cardBg ?? "bg-white",
                    theme?.accentText ?? "text-blue-700"
                  )}
                >
                  <ChevronRight size={18} aria-hidden />
                </button>

                <div className="mt-8 flex items-center justify-center gap-2">
                  {carouselSnaps.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      onClick={() => emblaApi?.scrollTo(dotIndex)}
                      aria-label={`Go to testimonial ${dotIndex + 1}`}
                      className={cx(
                        "h-2 rounded-full transition-all duration-300",
                        dotIndex === carouselSelectedIndex
                          ? cx("w-6", theme?.buttonBg ?? "bg-blue-600")
                          : "w-2 bg-gray-200 hover:bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
