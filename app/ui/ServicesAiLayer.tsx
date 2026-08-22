"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
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

interface LayerItem {
  heading: string;
  description: string;
}

/**
 * The "AI and agentic engineering" section — a `composableElement` section
 * (`subType: "servicesAiLayer"` — see `ComposableElementRenderer`) that's
 * addable/orderable independently of the services panels on the
 * `/services` page:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading/lead copy
 * - every `contentDetail` entry among `elements` becomes one grid item
 *   (`title` as the item heading, `shortDescription` as its copy) —
 *   add/remove `contentDetail` entries in Contentful to change the
 *   roster, nothing here needs to change
 *
 * Renders no grid items (just the intro) when `elements` has no
 * `contentDetail` entries yet.
 *
 * Rebuilt on the same Tailwind + `theme.ts` foundation every other
 * composableElement section uses (`resolveTheme(entry.fields.themeColor)`
 * — see `HomeAI`/`HomeServices` for the same pattern) instead of the
 * bespoke dark CSS Module this started as, so it now picks up the site's
 * theme presets and matches the eyebrow/heading font sizes used
 * everywhere else. The heading also gets the same GSAP split-text
 * scroll-reveal every other section's heading uses.
 *
 * The grid items get their own animation too: a scroll-triggered fade +
 * rise, staggered one card after another, as the grid scrolls into view;
 * plus a GSAP hover — the card lifts slightly while an accent bar grows
 * downward along its left edge. Both are skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ServicesAiLayer({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailItems = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map((detailEntry): LayerItem => ({
      heading: detailEntry.fields.title ?? "",
      description: detailEntry.fields.shortDescription ?? "",
    }));

  const items = contentDetailItems;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAI/HomeAboutUs use). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to its text/border/card colors. `undefined` for an
  // unset or unrecognized value, in which case every themed class below
  // falls back to this section's own default (plain emerald/gray look,
  // same as HomeAI/HomeServices when no theme is set).
  const theme = resolveTheme(entry?.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/HomeProducts/CommonTrustedBy). Nothing else in
     this section animates. Skipped entirely under prefers-reduced-motion.

     `autoSplit: true` re-runs `onSplit` on its own (e.g. a resize, or a
     late-loading font reflowing the heading) — including after this
     effect has already been cleaned up, since that re-split is async
     and outside `gsap.context`'s synchronous tracking. Without the
     `cancelled` guard and explicit kill below, such a re-split can
     create a *new* ScrollTrigger tied to a trigger element that's
     already gone, which later crashes on refresh with "Cannot read
     properties of undefined (reading 'end')" — this is what threw
     that error here.
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
    let revealTween: gsap.core.Tween | undefined;
    let cancelled = false;

    const ctx = gsap.context(() => {
      split = SplitText.create(headingRef.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) => {
          if (cancelled || !sectionRef.current) {
            return;
          }

          // Kill the previous split's reveal (and its ScrollTrigger)
          // before replacing it, so a re-split never leaves an orphaned
          // ScrollTrigger pointing at words that no longer exist.
          revealTween?.scrollTrigger?.kill();
          revealTween?.kill();

          revealTween = gsap.from(self.words, {
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
          });

          return revealTween;
        },
      });
    }, sectionRef);

    return () => {
      cancelled = true;
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     CARD REVEAL — the grid items fade + rise into place with a stagger
     as the grid scrolls into view (same load treatment several About
     sections use). Skipped entirely under prefers-reduced-motion.
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
     HOVER — the card lifts slightly while an accent bar grows downward
     along its left edge (scaleY 0 → 1). GSAP rather than CSS because the
     card and bar animate on two different eases from one trigger.
     Skipped under prefers-reduced-motion.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const bar = card.querySelector<HTMLElement>("[data-ai-bar]");

    gsap.to(card, { y: -6, duration: 0.3, ease: "power2.out" });
    if (bar) {
      gsap.to(bar, { scaleY: 1, duration: 0.35, ease: "power2.out" });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const bar = card.querySelector<HTMLElement>("[data-ai-bar]");

    gsap.to(card, { y: 0, duration: 0.35, ease: "power2.out" });
    if (bar) {
      gsap.to(bar, { scaleY: 0, duration: 0.3, ease: "power2.out" });
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
          DECORATIVE BACKGROUND — same treatment as
          HomeAI/HomeServices, for a consistent look; a light scrim over
          the background image instead when there is one, so the copy
          stays readable.
      ================================================= */}
              <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {backgroundUrl ? (
          <div className="absolute inset-0 bg-white/90" />
        ) : (
          <>
            <div className="absolute inset-x-0 top-1/2 h-[70%] -translate-y-1/2 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,theme(colors.emerald.100),transparent)] opacity-70" />
            <div className="absolute top-1/4 -left-16 hidden h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl animate-float-slow sm:block" />
            <div className="absolute -right-10 bottom-1/4 hidden h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl animate-float-slower md:block" />
          </>
        )}
      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-24 lg:py-28">
        {/* =================================================
            INTRO — same eyebrow/heading/description sizing every other
            composableElement section uses, left-aligned rather than
            centered.
        ================================================= */}
        <div className="flex max-w-2xl flex-col items-start gap-5 text-left">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-emerald-50",
                theme?.eyebrowText ?? "text-emerald-700"
              )}
            >
              {eyebrow}
            </span>
          )}

          {heading && (
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              className={cx(
                "text-[28px] leading-[1.1] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
                theme?.heading ?? "text-gray-900"
              )}
            >
              {heading}
            </DynamicHeading>
          )}

          {description && (
            <div
              className={cx(
                "rich-text max-w-xl text-[15.5px] leading-relaxed md:text-[17px]",
                theme?.body ?? "text-gray-500"
              )}
            >
              {description}
            </div>
          )}
        </div>

        {/* =================================================
            GRID — one bordered card per item.
        ================================================= */}
        {items.length > 0 && (
        <div
          ref={cardsRef}
          className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3"
        >
          {items.map((item) => (
            <div
              key={item.heading}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "relative overflow-hidden rounded-2xl border p-7 z-1",
                theme?.cardBorder ?? "border-gray-100",
                theme?.cardBg ?? "bg-white"
              )}
            >
              <span
                data-ai-bar
                aria-hidden
                className={cx(
                  "absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-current",
                  theme?.accentText ?? "text-emerald-500"
                )}
              />
              <h3
                className={cx(
                  "text-[16px] font-bold",
                  theme?.heading ?? "text-gray-900"
                )}
              >
                {item.heading}
              </h3>
              <p
                className={cx(
                  "mt-2 text-[14px] leading-relaxed",
                  theme?.body ?? "text-gray-500"
                )}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
