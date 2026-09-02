"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowRight } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
  StatisticSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeCaseStudies use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/** Splits a plain-text heading on `*word*` markers and renders the marked segments in the theme's accent color — same lightweight convention `HomeCaseStudies` uses so an editor can emphasize specific words (e.g. "Results that *speak*. Impact that *scales*.") without needing rich text on `dataText.heading`. */
function renderHighlightedHeading(heading: string, theme?: SectionTheme): ReactNode {
  return heading.split(/(\*[^*]+\*)/g).map((part, index) => {
    const match = /^\*([^*]+)\*$/.exec(part);

    if (!match) {
      return part;
    }

    return (
      <span key={index} className={theme?.accentText ?? "text-blue-600"}>
        {match[1]}
      </span>
    );
  });
}

interface StatItem {
  label: string;
  value: string;
}

/** Maps a resolved `statistic` entry to the plain `StatItem` shape the hero stat strip renders. */
function statisticToStatItem(entry: PlainEntry<StatisticSkeleton>): StatItem {
  return { value: entry.fields.value ?? "", label: entry.fields.label ?? "" };
}

interface CaseStudyListItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  clientName?: string;
  ctaHref: string;
  ctaLabel: string;
}

/** Cycled by card index as a fallback when a `contentDetail` entry has no `heroImage` set — same placeholder convention `HomeCaseStudies` uses. */
const PLACEHOLDER_IMAGES = [
  "https://picsum.photos/seed/oxytal-case-listing-1/700/500",
  "https://picsum.photos/seed/oxytal-case-listing-2/700/500",
  "https://picsum.photos/seed/oxytal-case-listing-3/700/500",
  "https://picsum.photos/seed/oxytal-case-listing-4/700/500",
];

/** Cards shown before any "Load more" click. */
const INITIAL_VISIBLE_COUNT = 4;
/** Additional cards revealed per "Load more" click. */
const LOAD_MORE_COUNT = 4;

/** Tag pill colors, assigned to categories in order of first appearance (see `useCategoryColors` below) — same 4-color rotation the reference mockup uses (amber/blue/emerald/pink). */
const TAG_COLORS = [
  "bg-amber-50 text-amber-800",
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-pink-50 text-pink-700",
];

/** Maps a resolved `contentDetail` entry to one `CaseStudyListItem` — reusing `contentDetail` (title/category/shortDescription/heroImage/clientName/cta/slug) instead of a dedicated content type, same pattern `HomeCaseStudies`/`HomeProducts` use. */
function contentDetailToListItem(
  entry: PlainEntry<ContentDetailSkeleton>
): CaseStudyListItem {
  const heroImageEntry = entry.fields.heroImage;
  const imageUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
        (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
          .image
      )
    : undefined;

  const ctaLink = entry.fields.cta?.find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;
  const ctaHref =
    (ctaLink && resolveLinkHref(ctaLink)) ??
    (entry.fields.slug ? `/case-studies/${entry.fields.slug}` : "#");

  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    category: entry.fields.category,
    description: entry.fields.shortDescription,
    imageUrl,
    clientName: entry.fields.clientName,
    ctaHref,
    ctaLabel: ctaLink?.fields.label ?? "View case study",
  };
}

/**
 * One case-study card — number badge, category tag, inline photo, client
 * name, title, description, and a "View case study" link. `colorClass`
 * comes from `useCategoryColors` below, keyed by this card's category.
 *
 * The hover state (lift + photo zoom) is driven by GSAP rather than a CSS
 * `transition` — `gsap.to` on `mouseenter`/`mouseleave`, `overwrite: "auto"`
 * (GSAP 3's default) so a quick in/out doesn't queue up stacked tweens.
 * The shadow-on-hover stays a plain Tailwind class since box-shadow itself
 * doesn't need GSAP to look good. Skipped entirely under
 * `prefers-reduced-motion` — the card just stays put.
 */
function CaseStudyCard({
  study,
  index,
  colorClass,
  theme,
}: {
  study: CaseStudyListItem;
  index: number;
  colorClass: string;
  theme?: SectionTheme;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleEnter = () => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.to(cardRef.current, { y: -10, duration: 0.45, ease: "power3.out" });
    gsap.to(imageRef.current, { scale: 1.08, duration: 0.6, ease: "power2.out" });
  };

  const handleLeave = () => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.to(cardRef.current, { y: 0, duration: 0.4, ease: "power3.inOut" });
    gsap.to(imageRef.current, { scale: 1, duration: 0.5, ease: "power2.inOut" });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={cx(
        "group flex flex-col overflow-hidden rounded-2xl border p-6 hover:shadow-xl hover:shadow-slate-900/5",
        theme?.cardBorder ?? "border-slate-100",
        theme?.cardBg ?? "bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {study.category && (
          <span
            className={cx(
              "inline-block rounded-full px-3 py-1 text-[11.5px] font-bold tracking-wide",
              colorClass
            )}
          >
            {study.category}
          </span>
        )}
        <span className="text-[13px] font-extrabold text-slate-200">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="relative mt-4 aspect-[1672/941] overflow-hidden rounded-xl bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project */}
        <img
          ref={imageRef}
          src={study.imageUrl ?? PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
      </div>
      {study.clientName && (
        <p
          className={cx(
            "mt-6 text-[12px] font-bold tracking-wide uppercase",
            theme?.accentText ?? "text-blue-600"
          )}
        >
          {study.clientName}
        </p>
      )}

      <h3
        className={cx(
          "mt-1.5 text-[18px] leading-snug font-bold",
          theme?.heading ?? "text-slate-900"
        )}
      >
        {study.title}
      </h3>

      {study.description && (
        <p
          className={cx(
            "mt-2 flex-1 text-[15px] leading-[1.75]",
            theme?.body ?? "text-slate-500"
          )}
        >
          {study.description}
        </p>
      )}

      <Link
        href={study.ctaHref}
        className={cx(
          "group/link mt-5 inline-flex w-fit items-center gap-1.5 text-[13.5px] font-bold",
          theme?.accentText ?? "text-blue-600"
        )}
      >
        {study.ctaLabel}
        <ArrowRight
          size={14}
          className="transition-transform group-hover/link:translate-x-1"
          aria-hidden
        />
      </Link>
    </div>
  );
}

/**
 * The `/case-studies` listing page — a `composableElement` section
 * (`subType: "caseStudiesListing"` — see `ComposableElementRenderer`),
 * ported from `Refrence/case-studies-list.html`:
 *
 * - the first `dataText` entry among `elements` supplies the hero's
 *   eyebrow, heading (supports the `*word*` highlight-marker convention
 *   via `renderHighlightedHeading`, same as `HomeCaseStudies`'s own
 *   heading), and lead paragraph (`text`, rich text)
 * - every `statistic` entry among `elements` becomes one card in the
 *   hero's 4-up stat strip (`value`/`label`)
 * - every `contentDetail` entry among `elements` becomes one case-study
 *   card (via `contentDetailToListItem`) — its `category` field also
 *   drives the filter tabs above the grid (every distinct category found,
 *   in first-appearance order, plus an "All work" tab), and each
 *   category's tag color is assigned once and reused everywhere that
 *   category appears (`useCategoryColors`)
 * - the composableElement's own `backgroundImage` field (links to a
 *   `dataImage` entry, same field every other section uses) is an
 *   *optional* full-bleed photo behind the whole hero+grid area — a
 *   white scrim keeps the cards readable over it, same "photo wins, scrim
 *   fades it back" treatment `HomeCaseStudies` uses for its own optional
 *   background
 *
 * Renders nothing for the eyebrow/heading/description/stat-strip/grid
 * when the corresponding entries or fields aren't set yet — an empty
 * grid until an editor adds `contentDetail` entries, same call
 * `PageBody`'s `contentDetail` case defers on.
 *
 * Unlike most sibling sections, this one defaults to the reference
 * mockup's own light, white/navy/blue identity rather than this project's
 * usual dark-navy hero — `resolveTheme(entry.fields.themeColor)` still
 * overrides it the same way as everywhere else when an editor sets one.
 *
 * The hero heading gets the same GSAP split-text reveal every other
 * section's heading uses (no scroll trigger — it plays on load, same as
 * `AboutHero`/`ContactHero`/`ProductsHero`, since a hero is already in
 * view). The card grid fades + rises into place with a stagger as it
 * scrolls into view, same family of treatment `ContactStats` uses. Both
 * are skipped under `prefers-reduced-motion`. Filtering by category is a
 * plain client-side array filter — no separate animation on tab clicks.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function CaseStudiesListing({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const statEntries = elements.filter(
    (element): element is PlainEntry<StatisticSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "statistic"
  );
  const stats = statEntries.map(statisticToStatItem);

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const allStudies = contentDetailEntries.map(contentDetailToListItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;

  // Every distinct `category` across the case-study cards, in the order it
  // first appears, each mapped to one of `TAG_COLORS` (cycled) — used for
  // both the filter tabs and every card's own tag pill, so a category
  // always renders in the same color wherever it shows up.
  const categoryColors = useMemo(() => {
    const map = new Map<string, string>();
    let next = 0;
    for (const study of allStudies) {
      if (study.category && !map.has(study.category)) {
        map.set(study.category, TAG_COLORS[next % TAG_COLORS.length]);
        next += 1;
      }
    }
    return map;
  }, [allStudies]);

  const categories = Array.from(categoryColors.keys());

  const [activeFilter, setActiveFilter] = useState("all");
  const filteredStudies =
    activeFilter === "all"
      ? allStudies
      : allStudies.filter((study) => study.category === activeFilter);

  // How many cards of the active filter are currently shown — starts at
  // `INITIAL_VISIBLE_COUNT` and grows by `LOAD_MORE_COUNT` per "Load more"
  // click, resetting back to the initial count whenever the filter changes
  // (below) so switching tabs doesn't carry over a deeper page from the
  // previous filter.
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const visibleStudies = filteredStudies.slice(0, visibleCount);
  const hasMoreStudies = visibleCount < filteredStudies.length;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to this section's colors. `undefined` for an unset
  // or unrecognized value, in which case every themed class below falls
  // back to the reference mockup's own light white/navy/blue identity
  // (today's look, unchanged) — unlike most sibling sections, whose
  // fallback is a dark navy hero.
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL.
  // Optional here: no placeholder fallback, so it's simply absent until
  // an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the hero heading only, splitting into words on
     load (same GSAP split-text treatment as AboutHero/ContactHero/
     ProductsHero — no scroll trigger since a hero is already in view).
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
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     GRID REVEAL — the case-study cards fade + rise with a stagger as
     the grid scrolls into view. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!gridRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(gridRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(gridRef.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 90%",
          once: true,
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, [activeFilter]);

  /* =========================================================
     LOAD MORE SCROLL — after a "Load more" click adds cards past what
     was already on screen, nudge the page so the newly revealed row
     isn't left half-cut-off at the bottom of the viewport. Tracks the
     previous `visibleCount` in a ref so this only fires on an actual
     increase (a "Load more" click), not on mount or on a filter change
     (which resets `visibleCount` back down via `handleFilterChange`).
  ========================================================= */
  const previousVisibleCountRef = useRef(visibleCount);
  useEffect(() => {
    const previousVisibleCount = previousVisibleCountRef.current;
    previousVisibleCountRef.current = visibleCount;

    if (visibleCount <= previousVisibleCount || !gridRef.current) {
      return;
    }

    const firstNewCard = gridRef.current.children[previousVisibleCount] as
      | HTMLElement
      | undefined;

    firstNewCard?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }, [visibleCount]);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 pt-16 pb-20 md:px-10 md:pt-26 md:pb-28">
        {/* =================================================
            HERO
        ================================================= */}
        {eyebrow && (
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-blue-50",
              theme?.eyebrowText ?? "text-blue-700"
            )}
          >
            {eyebrow}
          </span>
        )}

        <div className="mt-6 flex flex-col gap-6 border-b border-slate-100 pb-11 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          {heading && (
            <h1
              ref={headingRef}
              className={cx(
                "max-w-2xl text-[32px] leading-[1.1] font-extrabold tracking-tight sm:text-[42px] md:text-[56px]",
                theme?.heading ?? "text-slate-900"
              )}
            >
              {renderHighlightedHeading(heading, theme)}
            </h1>
          )}

          {description && (
            <div
              className={cx(
                "rich-text max-w-xs pb-1 text-[15px] leading-relaxed font-medium",
                theme?.body ?? "text-slate-500"
              )}
            >
              {description}
            </div>
          )}
        </div>

        {/* =================================================
            STAT STRIP
        ================================================= */}
        {stats.length > 0 && (
          <div
            className={cx(
              "mt-11 grid grid-cols-2 divide-x divide-y overflow-hidden border rounded-2xl sm:grid-cols-4 sm:divide-y-0",
              theme?.cardBorder ?? "divide-slate-200",
              theme?.cardBg ?? "bg-slate-50"
            )}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-7">
                <div
                  className={cx(
                    "text-[28px] font-extrabold",
                    theme?.heading ?? "text-slate-900"
                  )}
                >
                  {stat.value}
                </div>
                <div
                  className={cx(
                    "mt-1 text-[13px] font-semibold",
                    theme?.body ?? "text-slate-500"
                  )}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =================================================
            FILTERS
        ================================================= */}
        {categories.length > 0 && (
          <div className="mt-16 flex flex-wrap gap-2.5 md:mt-20">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={cx(
                "rounded-full border px-4.5 py-2 text-[13.5px] font-semibold transition-colors",
                activeFilter === "all"
                  ? cx(theme?.buttonBg ?? "bg-blue-600", theme?.buttonText ?? "text-white", "border-transparent")
                  : cx(
                      theme?.cardBg ?? "bg-slate-50",
                      theme?.cardBorder ?? "border-slate-200",
                      theme?.body ?? "text-slate-500",
                      "hover:text-blue-600 hover:border-blue-600"
                    )
              )}
            >
              All work
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleFilterChange(category)}
                className={cx(
                  "rounded-full border px-4.5 py-2 text-[13.5px] font-semibold transition-colors",
                  activeFilter === category
                    ? cx(theme?.buttonBg ?? "bg-blue-600", theme?.buttonText ?? "text-white", "border-transparent")
                    : cx(
                        theme?.cardBg ?? "bg-slate-50",
                        theme?.cardBorder ?? "border-slate-200",
                        theme?.body ?? "text-slate-500",
                        "hover:text-blue-600 hover:border-blue-600"
                      )
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <p className={cx("mt-6 text-[14px] font-semibold", theme?.body ?? "text-slate-500")}>
          <span className={theme?.heading ?? "text-slate-900"}>{filteredStudies.length}</span>{" "}
          case {filteredStudies.length === 1 ? "study" : "studies"}
        </p>

        {/* =================================================
            GRID
        ================================================= */}
        {visibleStudies.length > 0 && (
          <div
            ref={gridRef}
            className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
          >
            {visibleStudies.map((study, index) => (
              <CaseStudyCard
                key={study.id}
                study={study}
                index={index}
                colorClass={
                  (study.category && categoryColors.get(study.category)) ??
                  TAG_COLORS[0]
                }
                theme={theme}
              />
            ))}
          </div>
        )}

        {/* =================================================
            LOAD MORE
        ================================================= */}
        {hasMoreStudies && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((count) => count + LOAD_MORE_COUNT)
              }
              className={cx(
                "inline-flex relative z-2 w-fit min-w-[185px] justify-center cursor-pointer items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                theme?.buttonBg ?? "bg-slate-50",
                theme?.buttonText ?? "border-slate-200",
                theme?.buttonHoverBg ?? "border-slate-200",
              )}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
