"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Globe } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
  OfficeSkeleton,
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

interface Region {
  id: string;
  country: string;
  role: string;
  description: string;
  flagUrl?: string;
}

/** Placeholder roster, used only when `elements` has no `office` entries yet — the original mockup's 3-region grid. */
const DEFAULT_REGIONS: Region[] = [];

/** Maps a resolved `office` entry (same content type `Footer`/`AboutHero` reuse) to one `Region` — `country` as the name, `city` doubling as the short role/tagline (there's no dedicated field for it), `description` as the longer paragraph, `flag` as an optional image. */
function officeToRegion(entry: PlainEntry<OfficeSkeleton>): Region {
  const flagEntry = entry.fields.flag;

  return {
    id: entry.sys.id,
    country: entry.fields.country,
    role: entry.fields.city ?? "",
    description: entry.fields.description ?? "",
    flagUrl: isEntry(flagEntry)
      ? getAssetUrl(
          (flagEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

/**
 * The About page's "Global Presence" section — a `composableElement`
 * section (`subType: "aboutGlobal"` — see `ComposableElementRenderer`),
 * split out of `AboutPage` the same way `AboutHero`/`AboutStats`/
 * `AboutStory`/`AboutServices`/`AboutApproach`/`AboutProducts`/
 * `AboutLeadership`/`AboutCulture` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text); a 2nd `dataText`
 *   entry (if present) supplies the shorter paragraph below the stat
 *   card, via its own `text` field; a 3rd supplies the stat card's own
 *   label (e.g. "Countries & Growing") via its `eyebrow` field
 * - every `office` entry among `elements` becomes one region card (via
 *   `officeToRegion`) — the *same* `office` entries `AboutHero`'s
 *   "Office Locations" list and `Footer`'s office list already use, so
 *   reuse those rather than creating duplicates; the "Countries &
 *   Growing" count and pill list are both derived from this same roster,
 *   so they can never drift out of sync with the cards below
 *
 * Falls back to `DEFAULT_REGIONS` and the original hardcoded heading/
 * copy when the corresponding entries aren't set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * plain white/blue look, so it renders the same as before this existed
 * until an editor sets a `themeColor`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling About section uses) is an
 * *optional* full-bleed section background — no placeholder fallback, so
 * the section just shows its themed background color until an editor
 * sets one. `ThemePattern`'s dotted backdrop only renders when there's
 * no background photo, same call every sibling section makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The region cards get their own scroll-
 * triggered load animation too — a fade + rise, staggered one card
 * after another as the grid scrolls into view — plus a GSAP hover: a
 * soft "ripple pulse" emanates outward from the flag/globe icon once
 * per hover, distinct from every sibling section's lift/tilt/spotlight
 * treatment. All are skipped under `prefers-reduced-motion` (cards keep
 * their existing plain CSS `hover:-translate-y-1 hover:shadow-lg` in
 * that case).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutGlobal({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const asideEntry = dataTextEntries[1];
  // A 3rd `dataText` entry (if present) supplies the "Countries &
  // Growing" stat label via its own `eyebrow` field — same "reuse a
  // secondary dataText" pattern AboutHero's "// Company Overview" / "//
  // Office Locations" labels use.
  const statLabelEntry = dataTextEntries[2];

  const officeRegions = elements
    .filter(
      (element): element is PlainEntry<OfficeSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "office"
    )
    .map(officeToRegion);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;
  const aside = asideEntry?.fields.text
    ? documentToReactComponents(asideEntry.fields.text)
    : null;
  const statLabel = statLabelEntry?.fields.eyebrow;

  const regions = officeRegions.length ? officeRegions : DEFAULT_REGIONS;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own plain white/blue look (today's
  // look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling About section uses). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling About
     section). Nothing else in this section animates. Skipped entirely
     under prefers-reduced-motion.
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
     CARD REVEAL — the region cards fade + rise into place with a
     stagger as the grid scrolls into view (same load treatment several
     sibling About sections use). Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     HOVER — a "ripple pulse" instead of a lift/tilt: a soft circle
     emanates outward from the flag/globe icon once per hover (scale 0 →
     2.4, fading out as it grows) — a one-shot splash rather than a
     toggled lift/tilt/spotlight state, distinct from every sibling
     section's hover treatment. Re-entering the card kills any tween in
     progress and restarts it cleanly. Skipped under
     prefers-reduced-motion — the card keeps its plain CSS
     `hover:-translate-y-1 hover:shadow-lg` in that case.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const ripple = card.querySelector<HTMLElement>("[data-region-ripple]");

    if (ripple) {
      gsap.killTweensOf(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 0.45 },
        { scale: 2.4, opacity: 0, duration: 0.7, ease: "power2.out" }
      );
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const ripple = card.querySelector<HTMLElement>("[data-region-ripple]");

    if (ripple) {
      gsap.killTweensOf(ripple);
      gsap.to(ripple, { scale: 0, opacity: 0, duration: 0.2, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="global"
      aria-labelledby="global-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container mx-auto px-5 md:px-10">
        <div className="max-w-2xl">
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-blue-50",
              theme?.eyebrowText ?? "text-blue-700"
            )}
          >
            {eyebrow}
          </span>
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            id="global-heading"
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
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div
              className={cx(
                "rounded-2xl relative p-10 text-center z-1",
                theme?.cardBg,
                theme?.cardBorder
              )}
            >
              <Globe aria-hidden size={50} className="mx-auto text-white" />
              <p
                className={cx(
                  "mt-2 text-[38px] font-extrabold",
                  theme?.heading ?? "text-gray-900"
                )}
              >
                {regions.length}
                <span className={theme?.accentText ?? "text-blue-600"}>+</span>
              </p>
              <p
                className={cx(
                  "text-[12px] font-semibold tracking-wide uppercase",
                  theme?.muted ?? "text-gray-500"
                )}
              >
                {statLabel}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {regions.map((region) => (
                  <span
                    key={region.id}
                    className={cx(
                      "rounded-full border bg-white px-3.5 py-1.5 text-[12.5px] font-semibold",
                      theme?.cardBorder ?? "border-blue-100",
                      theme?.accentText ?? "text-blue-600"
                    )}
                  >
                    {region.country}
                  </span>
                ))}
              </div>
            </div>
            <div
              className={cx(
                "rich-text mt-4 text-[13.5px] leading-relaxed",
                theme?.body ?? "text-gray-500"
              )}
            >
              {aside}
            </div>
          </div>

          <div ref={cardsRef} className="grid gap-5 sm:grid-cols-3 lg:col-span-8">
            {regions.map((region) => (
              <div
                key={region.id}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "rounded-2xl z-1 border p-7 hover:-translate-y-1 hover:shadow-lg",
                  theme?.cardBorder ?? "border-blue-100",
                  theme?.cardBg ?? "bg-gray-50"
                )}
              >
                <div className="relative inline-flex">
                  <span
                    data-region-ripple
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute inset-0 m-auto h-10 w-10 scale-0 rounded-full bg-current opacity-0",
                      theme?.accentText ?? "text-blue-600"
                    )}
                  />
                  {region.flagUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={region.flagUrl}
                      alt=""
                      aria-hidden
                      className="h-12 w-12  object-cover"
                    />
                  ) : (
                    <Globe
                      aria-hidden
                      size={28}
                      className={theme?.accentText ?? "text-blue-600"}
                    />
                  )}
                </div>
                <p
                  className={cx(
                    "mt-2 text-[17px] font-extrabold",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  {region.country}
                </p>
                {region.role && (
                  <p
                    className={cx(
                      "mt-1 text-[11px] font-bold tracking-wide uppercase",
                      theme?.accentText ?? "text-blue-600"
                    )}
                  >
                    {region.role}
                  </p>
                )}
                <p
                  className={cx(
                    "mt-2 text-[13.5px] leading-relaxed",
                    theme?.body ?? "text-gray-500"
                  )}
                >
                  {region.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
