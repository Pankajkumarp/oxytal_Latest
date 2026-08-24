"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
  TechnologySkeleton,
} from "../types/contentful";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export interface TrustedByItem {
  /** Company/client name. Used as the link's accessible label, and as plain-text fallback when `logo` is omitted. */
  name: string;
  /** Logo image URL, rendered at a fixed 200×80. Falls back to plain name text when omitted. */
  logo?: string;
  /** Unused by the current (logo-only) rendering — kept for callers that still pass it. */
  description?: string;
  /** Wraps the logo in a link to the client's site when set. */
  website?: string;
}

/**
 * Placeholder client roster, used only when the `composableElement`'s
 * `elements` has no `technology` entries yet (e.g. a freshly-created entry
 * in Contentful that hasn't been populated). Swap/add real clients by
 * adding `technology` entries in Contentful — nothing here needs to change.
 */
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

/** Maps a resolved `technology` entry (name/logo/website/category) to the plain `TrustedByItem` shape this component renders — reused here as the per-card data for the logo wall instead of a dedicated content type. `category` (e.g. "Fintech Enterprise") doubles as the card's descriptor tag, when set. */
function technologyToTrustedByItem(
  entry: PlainEntry<TechnologySkeleton>
): TrustedByItem {
  const logoEntry = entry.fields.logo;

  return {
    name: entry.fields.name,
    logo: isEntry(logoEntry)
      ? getAssetUrl(
        (logoEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
    description: entry.fields.category,
    website: entry.fields.website,
  };
}

/**
 * A "trusted by" logo-wall section, rendered from a `composableElement`
 * entry (`subType: "client"` — see `ComposableElementRenderer`): one
 * `dataText` entry among `elements` supplies the eyebrow/heading/description
 * copy, and every `technology` entry among `elements` becomes one carousel
 * card (via `technologyToTrustedByItem`) — add/remove `technology` entries
 * in Contentful to change the roster, nothing here needs to change. Falls
 * back to `DEFAULT_TRUSTED_BY_ITEMS` when `elements` has no `technology`
 * entries yet.
 *
 * The heading splits into words and reveals on scroll into view (same GSAP
 * split-text treatment as CommonVideo's content mode). The eyebrow and
 * description render normally, with no animation. Below that, each client
 * is just its logo at a fixed 200×80, linking out to `website` when set
 * (falls back to plain name text when `logo` is omitted) — no card chrome,
 * name label, or badge. Logos sit in an Embla Carousel: 1 per view on
 * mobile, 2 on tablet, 3 on desktop+ (via each slide's own responsive
 * width), looping. Autoplay is skipped under `prefers-reduced-motion`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field HomeAboutUs/HomeAI/HomeProducts use) is an
 * *optional* full-bleed section background — like HomeAboutUs, there's no
 * placeholder fallback, so the section just renders on its plain
 * background until an editor sets one.
 */
/** Suggested max-width presets for the slider/carousel itself (independent of the heading/intro above it, which stays on the site's default `container` width). */
export type CommonTrustedBySliderWidth = "narrow" | "default" | "wide" | "full";

const SLIDER_WIDTH_CLASSES: Record<CommonTrustedBySliderWidth, string> = {
  /** ~672px — tight, good when there are only a handful of logos. */
  narrow: "max-w-2xl",
  /** ~896px — a bit narrower than the section's own container; a middle ground. */
  default: "max-w-5xl",
  /** ~1152px — noticeably wider, good for a larger logo roster. */
  wide: "max-w-6xl",
  /** No cap — the slider spans the full section width (current/original behavior). */
  full: "max-w-none",
};

interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
  /** Caps the slider's own width and centers it, independent of the intro above. One of "narrow" (~672px), "default" (~896px), "wide" (~1152px), or "full" (no cap — spans the section, the default). */
  sliderWidth?: CommonTrustedBySliderWidth;
}
export default function CommonTrustedBy({
  entry,
  sliderWidth = "default",
}: Props) {
  const showArrows = false;
  const autoPlay = true;
  const autoPlayDelay = 4000;
  const className = "";

  const elements = entry.fields.elements ?? [];

  // One `dataText` entry among `elements` supplies the eyebrow/heading/description copy.
  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  // Every `technology` entry among `elements` becomes one carousel card.
  const technologyItems = elements
    .filter(
      (element): element is PlainEntry<TechnologySkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "technology"
    )
    .map(technologyToTrustedByItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading =
    copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;
  const items = technologyItems.length
    ? technologyItems
    : [];

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
  // falls back to this section's existing default (today's plain look).
  const theme = resolveTheme(entry.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* =========================================================
     REVEAL ANIMATION — heading split-text only. The description
     and card grid render normally with no animation/hidden state.
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
    // `heading` itself isn't read in this effect (SplitText reads the
    // rendered DOM text off `headingRef` directly) — the effect is meant to
    // run once on mount, not re-run reactively.
  }, []);

  /* =========================================================
     SLIDER — Embla Carousel. Loops, autoplays (paused on
     hover/interaction, skipped entirely under reduced-motion), 1
     slide per view on mobile / 2 on tablet / 3 on desktop+ via each
     slide's own responsive flex-basis below.

     `emblaApi`'s own state (selected index, snap list) isn't cached
     into React state — that would mean calling setState synchronously
     during this effect just to seed the initial value, which is the
     exact anti-pattern react-hooks/set-state-in-effect flags. Instead
     a plain re-render counter is bumped from within Embla's own event
     callbacks, and the actual values are read fresh from `emblaApi`
     directly during render — always current, no separate copy to
     keep in sync.
  ========================================================= */
  const plugins = useMemo(
    () =>
      autoPlay && !prefersReducedMotion()
        ? [
          Autoplay({
            delay: autoPlayDelay,
            stopOnMouseEnter: true,
            stopOnInteraction: false,
          }),
        ]
        : [],
    [autoPlay, autoPlayDelay]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    plugins
  );

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

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl && theme?.sectionBg,
        className
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
          DECORATIVE BACKGROUND — same treatment as CommonVideo's
          content mode, for a consistent premium-section feel; a light
          scrim over the background image instead when there is one, so
          the logos stay readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 py-8 md:px-10">
        {/* =================================================
            INTRO
        ================================================= */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
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

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "text-[28px] leading-[1] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

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
            SLIDER — 1 logo per view on mobile, 2 on tablet, 3 on
            desktop+ (each slide's flex-basis below). Each slide is just
            the logo image (fixed 200×80) linking out to the client's
            site — no card chrome, name, or badge.
        ================================================= */}
        <div
          className={cx(
            "relative mx-auto mt-1 z-2",
            SLIDER_WIDTH_CLASSES[sliderWidth]
          )}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-5 flex">
              {items.map((item) => {
                const LinkTag = item.website ? "a" : "div";

                return (
                  <div
                    key={item.name}
                    className="flex-[0_0_100%] pl-5 md:flex-[0_0_50%] lg:flex-[0_0_25%]"
                  >
                    <LinkTag
                      {...(item.website
                        ? {
                          href: item.website,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                        : {})}
                      aria-label={item.name}
                      className={cx(
                        "flex h-full items-center justify-center logo-card"
                      )}
                    >
                      {item.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                        <img
                          src={item.logo}
                          alt={item.name}
                          width={145}
                          height={80}
                          className="h-[auto] w-[145px] object-contain"
                        />
                      ) : (
                        <span
                          className={cx(
                            "text-[15px] font-semibold",
                            theme?.muted ?? "text-gray-500"
                          )}
                        >
                          {item.name}
                        </span>
                      )}
                    </LinkTag>
                  </div>
                );
              })}
            </div>
          </div>

          {scrollSnaps.length > 1 && (
            <>
              {showArrows && (
                <>
                  <button
                    type="button"
                    onClick={() => emblaApi?.scrollPrev()}
                    aria-label="Previous"
                    className="absolute top-1/2 left-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => emblaApi?.scrollNext()}
                    aria-label="Next"
                    className="absolute top-1/2 right-0 z-20 flex translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <div className="mt-0 flex items-center justify-center gap-2">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={cx(
                      "h-2 rounded-full transition-all duration-300",
                      index === selectedIndex
                        ? cx("w-6", theme?.buttonBg ?? "bg-emerald-600")
                        : "w-2 bg-gray-200 hover:bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
