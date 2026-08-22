"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  TestimonialSkeleton,
} from "../types/contentful";
import ThemePattern from "./ThemePattern";

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

/** First-and-last-initial fallback avatar (e.g. "Managing Partner" → "MP") shown when a `testimonial` entry has no `authorPhoto` set. */
function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "";
  }

  return (words[0][0] + (words[words.length - 1][0] ?? "")).toUpperCase();
}

/**
 * The `/ai-solutions` page's quote spotlight — a `composableElement`
 * section (`subType: "aiSpotlight"` — see `ComposableElementRenderer`),
 * ported from `Refrence/ai-solutions.html`'s `.spotlight` card:
 *
 * - the first `testimonial` entry among `elements` supplies the quote
 *   (`quote`), the attribution (`authorName`/`authorTitle`), and the
 *   avatar (`authorPhoto`, falling back to initials from `authorName`)
 *   — reuses `testimonial` (the same content type `HomeCaseStudies`
 *   uses for its own quote) instead of a dedicated content type
 *
 * Renders nothing at all when there's no `quote` to show — an
 * attribution with no quote wouldn't make sense as a spotlight card.
 *
 * Un-themed, this section defaults to the reference mockup's own dark
 * navy gradient card — an explicit `themeColor` still overrides it, same
 * convention `AISolutionsProcess`'s dark default uses. The
 * composableElement's own `backgroundImage` field is an optional
 * full-bleed section photo layered under the same gradient tint.
 *
 * Animation: the quote card fades + rises in as it scrolls into view —
 * this section has no heading, so there's no split-text reveal here.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsSpotlight({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const testimonialEntry = elements.find(
    (element): element is PlainEntry<TestimonialSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "testimonial"
  );

  const quote = testimonialEntry?.fields.quote;
  const authorName = testimonialEntry?.fields.authorName;
  const authorTitle = testimonialEntry?.fields.authorTitle;

  const authorPhotoEntry = testimonialEntry?.fields.authorPhoto;
  const authorPhotoUrl = isEntry(authorPhotoEntry)
    ? getAssetUrl(
      (authorPhotoEntry as unknown as PlainEntry<DataImageSkeleton>).fields
        .image
    )
    : undefined;

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  // Un-themed, this section defaults to a dark navy gradient (the
  // reference mockup's own look) rather than the site's usual light
  // default — an explicit `themeColor` still wins when an editor sets
  // one, same convention `AISolutionsProcess`'s dark default uses.
  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("navy")!;

  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!cardRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardRef.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  // No quote to spotlight — an attribution with no quote wouldn't make
  // sense as a card, so render nothing at all rather than an empty shell.
  if (!quote) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20 !pt-[30px]">
      <div className="container mx-auto px-5 md:px-10">
        <div
          ref={cardRef}
          className={cx(
            "relative overflow-hidden rounded-3xl p-10 md:p-16",
            !backgroundUrl && theme.sectionBg
          )}
          style={
            backgroundUrl
              ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
              : undefined
          }
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
            <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
          </div>

          <p
            className={cx(
              "relative z-2 max-w-3xl text-[22px] leading-[1.35] font-semibold tracking-tight sm:text-[28px] md:text-[34px]",
              theme.heading
            )}
          >
            &ldquo;{quote}&rdquo;
          </p>

          {(authorName || authorTitle || authorPhotoUrl) && (
            <div className="relative z-2 mt-7 flex items-center gap-3.5">
              <div className={cx("flex h-11 w-11 items-center justify-center overflow-hidden rounded-full", theme.eyebrowBg)}>
                {authorPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                  <img
                    src={authorPhotoUrl}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                ) : (
                  authorName && (
                    <span className={cx("text-[15px] font-bold", theme.accentText)}>
                      {initialsFrom(authorName)}
                    </span>
                  )
                )}
              </div>

              <div>
                {authorName && (
                  <div className={cx("text-[14.5px] font-bold z-2 relative", theme.heading)}>
                    {authorName}
                  </div>
                )}
                {authorTitle && (
                  <div className={cx("text-[13px] z-2 relative", theme.muted)}>{authorTitle}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
