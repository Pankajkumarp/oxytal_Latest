"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
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

type TimelineItem = { id: string; year: string; title: string; description: string };

/** Placeholder timeline, used only when `elements` has no `contentDetail` entries yet — the original mockup's 5-point history. */
const DEFAULT_TIMELINE: TimelineItem[] = [];

/** Maps a resolved `contentDetail` entry to one `TimelineItem` — `badge` as the year/era label, `title` as the item title, `shortDescription` as its copy. */
function contentDetailToTimelineItem(
  entry: PlainEntry<ContentDetailSkeleton>
): TimelineItem {
  return {
    id: entry.sys.id,
    year: entry.fields.badge ?? "",
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
  };
}

/**
 * The About page's "Our Story" section — a `composableElement` section
 * (`subType: "aboutStory"` — see `ComposableElementRenderer`), split out
 * of `AboutPage` the same way `AboutHero`/`AboutStats` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - a 2nd `dataText` entry (if present) supplies the pull-quote: its
 *   `heading` is the quote itself, its `eyebrow` the citation — same
 *   "reuse a secondary dataText" pattern `HomeAI`'s proof callout /
 *   `HomeTalkToUs`'s note use
 * - every `contentDetail` entry among `elements` becomes one timeline
 *   entry (via `contentDetailToTimelineItem`) — `badge` as the year/era
 *   label, `title` as the item title, `shortDescription` as its copy;
 *   add/remove/reorder `contentDetail` entries in Contentful to change
 *   the timeline, nothing here needs to change
 *
 * Every field above renders exactly what's in Contentful: the eyebrow,
 * pull-quote, and timeline are each simply omitted when their source
 * entry/field is unset or empty — no invented placeholder copy.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * plain white/navy-accent look, so it renders the same as before this
 * existed until an editor sets a `themeColor`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field HomeAI/HomeTalkToUs/AboutHero/AboutStats
 * use) is an *optional* full-bleed section background — no placeholder
 * fallback, so the section just shows its themed background color until
 * an editor sets one. `ThemePattern`'s dotted backdrop only renders when
 * there's no background photo, same call `AboutStats` makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. Three more spots get their own GSAP
 * treatment: the pull-quote fades + scales in as it scrolls into view;
 * each timeline entry (dot, year, title, description) fades + slides in
 * from the left, staggered one after another; and the timeline's own
 * connecting line grows downward in sync with scroll position (a
 * scrubbed animation, not a one-shot reveal — it tracks scroll instead
 * of firing once). All four are skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutStory({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const quoteEntry = dataTextEntries[1];

  const timelineItems = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToTimelineItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const quote =
    quoteEntry?.fields.heading ;
  const citation = quoteEntry?.fields.eyebrow;

  const timeline = timelineItems.length ? timelineItems : DEFAULT_TIMELINE;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own plain white/navy-accent look
  // (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAI/HomeTalkToUs/AboutHero/AboutStats use). Optional here:
  // no placeholder fallback, so it's simply absent until an editor sets
  // one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/HomeTalkToUs/AboutHero). Nothing else in this
     section animates. Skipped entirely under prefers-reduced-motion.
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
     QUOTE REVEAL — the pull-quote fades + scales in as it scrolls into
     view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!quoteRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(quoteRef.current, { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(quoteRef.current, {
        opacity: 0,
        scale: 0.94,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: quoteRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, quoteRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     TIMELINE REVEAL — each timeline entry (dot, year, title,
     description) fades + slides in from the left, staggered one after
     another as the list scrolls into view. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!timelineRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(timelineRef.current.children, { opacity: 1, x: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(timelineRef.current!.children, {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, timelineRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     TIMELINE LINE GROWTH — the vertical connecting line grows downward
     in sync with scroll position: a scrubbed animation (tied directly to
     scroll progress, not firing once) rather than a reveal, so the line
     visibly "catches up" to wherever you've scrolled within the
     timeline. Skipped entirely under prefers-reduced-motion (the line
     shows at its full height immediately in that case).
  ========================================================= */
  useLayoutEffect(() => {
    if (!lineRef.current || !timelineRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(lineRef.current, { scaleY: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top 80%",
            end: "bottom 60%",
            scrub: 0.6,
          },
        }
      );
    }, timelineRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="story"
      aria-labelledby="story-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >

          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container mx-auto grid gap-12 px-5 md:px-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-blue-50",
                theme?.eyebrowText ?? "text-blue-700"
              )}
            >
              {eyebrow}
            </span>
          )}

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            id="story-heading"
            className={cx(
              "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

          <div
            className={cx(
              "rich-text mt-4 text-[15px] leading-relaxed",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>

          {quote && (
            <blockquote
              ref={quoteRef}
              className={cx(
                "mt-6 rounded-r-xl border-l-4 px-6 py-5 text-[16px] leading-relaxed italic",
                theme?.cardBorder ?? "border-blue-600",
                theme?.cardBg ?? "bg-blue-50",
                theme?.heading ?? "text-gray-700"
              )}
            >
              {quote}
              {citation && (
                <cite
                  className={cx(
                    "mt-3 block text-[12px] font-bold tracking-wide uppercase not-italic",
                    theme?.accentText ?? "text-blue-600"
                  )}
                >
                  {citation}
                </cite>
              )}
            </blockquote>
          )}
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="relative">
            <span
              ref={lineRef}
              aria-hidden
              className={cx(
                "absolute inset-y-0 left-[-2px] w-0.5 origin-top scale-y-0 bg-current opacity-40",
                theme?.accentText ?? "text-blue-600"
              )}
            />
            <ol ref={timelineRef} className="flex flex-col gap-9 pl-8">
              {timeline.map((item) => (
                <li key={item.id} className="relative">
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-1 -left-[41px] h-4 w-4 rounded-full border-[3px] border-white bg-current ring-2 ring-current",
                      theme?.accentText ?? "text-blue-600"
                    )}
                  />
                  <p
                    className={cx(
                      "text-[12px] font-bold tracking-wide uppercase",
                      theme?.accentText ?? "text-cyan-600"
                    )}
                  >
                    {item.year}
                  </p>
                  <p
                    className={cx(
                      "mt-1 text-[15px] font-bold",
                      theme?.heading ?? "text-gray-900"
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cx(
                      "mt-1 text-[13.5px] leading-relaxed",
                      theme?.body ?? "text-gray-500"
                    )}
                  >
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
