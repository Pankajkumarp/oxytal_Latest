"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  Cloud,
  Code2,
  Compass,
  Palette,
  Plug,
  TrendingUp,
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

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set — same pattern HomeServices/HomeTalkToUs use. */
const FALLBACK_ICONS: LucideIcon[] = [
  Compass,
  Palette,
  Code2,
  Plug,
  TrendingUp,
  Cloud,
];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 6-card grid. */
const DEFAULT_SERVICES: ServiceItem[] = [];

/** Maps a resolved `contentDetail` entry to the plain `ServiceItem` shape this component renders — reusing `contentDetail` (title/shortDescription/icon) instead of a dedicated content type, same pattern as HomeServices/HomeTalkToUs. */
function contentDetailToServiceItem(
  entry: PlainEntry<ContentDetailSkeleton>
): ServiceItem {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
  };
}

/**
 * The About page's "What We Do" section — a `composableElement` section
 * (`subType: "aboutServices"` — see `ComposableElementRenderer`), split
 * out of `AboutPage` the same way `AboutHero`/`AboutStats`/`AboutStory`
 * were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one service
 *   card (via `contentDetailToServiceItem`) — `title`/`shortDescription`
 *   as the name/description, `icon` (falls back to a cycled Lucide icon,
 *   same pattern as HomeServices/HomeTalkToUs) as the glyph; add/remove/
 *   reorder `contentDetail` entries in Contentful to change the roster,
 *   nothing here needs to change
 *
 * Every field above renders exactly what's in Contentful: the eyebrow
 * is simply omitted when unset, and the card grid only renders the
 * `contentDetail` entries that actually exist — no invented placeholder
 * services.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * plain gray/white/blue look, so it renders the same as before this
 * existed until an editor sets a `themeColor`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field AboutHero/AboutStats/AboutStory use) is
 * an *optional* full-bleed section background — no placeholder fallback,
 * so the section just shows its themed background color until an editor
 * sets one. `ThemePattern`'s dotted backdrop only renders when there's
 * no background photo, same call `AboutStats`/`AboutStory` make.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The service cards get their own load
 * animation too — a left-to-right "wipe" reveal (`clip-path: inset()`
 * animating from fully clipped to fully visible, plus a fade), staggered
 * one card after another as the grid scrolls into view; a masking
 * technique none of the other About sections use, so it stays crisp at
 * any card size (no transform-based stretching/distortion). On hover,
 * four camera-viewfinder-style corner brackets snap into place at the
 * card's four corners with a bouncy pop ("focus brackets") — a framing/
 * lock-on effect distinct from every sibling section's lift/tilt/
 * spotlight/wash/outline-draw hover. Both are skipped under
 * `prefers-reduced-motion` (cards keep a plain CSS `hover:shadow-md` in
 * that case).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutServices({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailServices = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToServiceItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const services = contentDetailServices.length
    ? contentDetailServices
    : DEFAULT_SERVICES;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own plain gray/white/blue look
  // (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern AboutHero/AboutStats/AboutStory use). Optional here: no
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
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/AboutHero/AboutStory). Nothing else in this
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
     CARD REVEAL — a left-to-right "wipe": each card animates from
     fully clipped (`clip-path: inset(0 100% 0 0)`, i.e. hidden behind a
     mask on its right edge) to fully revealed, plus a fade, staggered
     one card after another as the grid scrolls into view. A masking
     technique — distinct from every sibling section's transform-based
     fade/rise/flip/slide/scatter entrance, and immune to the
     stretching/distortion a transform-based reveal can show at odd card
     sizes. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, {
        opacity: 1,
        clipPath: "inset(0 0% 0 0)",
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current!.children,
        { clipPath: "inset(0 100% 0 0)", opacity: 0 },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.4,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     HOVER — "focus brackets": four camera-viewfinder-style corner
     brackets snap into view at the card's four corners with a bouncy
     `back.out` pop, staggered a touch, then retract on mouse-leave. A
     framing/lock-on effect rather than any fill, tilt, or icon
     transform — distinct from every sibling section's hover treatment
     (including this card's own earlier wash/outline-draw attempts).
     Skipped under prefers-reduced-motion — the card keeps a plain CSS
     `hover:shadow-md` in that case.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const frame = card.querySelector<HTMLElement>("[data-service-frame]");

    if (frame) {
      gsap.to(frame.children, {
        opacity: 1,
        scale: 1,
        duration: 0.35,
        stagger: 0.05,
        ease: "back.out(2)",
      });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const frame = card.querySelector<HTMLElement>("[data-service-frame]");

    if (frame) {
      gsap.to(frame.children, { opacity: 0, scale: 0.5, duration: 0.25, ease: "power2.in" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      aria-labelledby="services-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-gray-50")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        {backgroundUrl ? (
          <div className={cx("absolute inset-0 opacity-90", theme?.sectionBg ?? "bg-gray-50")} />
        ) : (
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        )}
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
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
              id="services-heading"
              className={cx(
                "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] max-w-md",
                theme?.heading ?? "text-gray-900"
              )}
            >
              {heading}
            </DynamicHeading>
          </div>
          <div
            className={cx(
              "rich-text text-[15px] leading-relaxed lg:col-span-5 lg:col-start-8",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <div
                key={service.id}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "relative overflow-hidden rounded-2xl border p-6 transition-shadow duration-300 hover:shadow-md",
                  theme?.cardBorder ?? "border-blue-100",
                  theme?.cardBg ?? "bg-white"
                )}
              >
                <div
                  data-service-frame
                  aria-hidden
                  className="pointer-events-none absolute inset-3"
                >
                  <span className="absolute left-0 top-0 h-4 w-4 scale-50 border-t-2 border-l-2 border-[#2d7dfa] opacity-0" />
                  <span className="absolute right-0 top-0 h-4 w-4 scale-50 border-t-2 border-r-2 border-[#2d7dfa] opacity-0" />
                  <span className="absolute bottom-0 left-0 h-4 w-4 scale-50 border-b-2 border-l-2 border-[#2d7dfa] opacity-0" />
                  <span className="absolute right-0 bottom-0 h-4 w-4 scale-50 border-r-2 border-b-2 border-[#2d7dfa] opacity-0" />
                </div>
                <div className="relative flex gap-4">
                  <div
                    data-service-icon
                    className="flex h-12 w-12 shrink-0 items-center justify-center  text-white"
                  >
                    {service.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={service.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={20} aria-hidden />
                    )}
                  </div>
                  <div>
                    <h3
                      className={cx(
                        "text-[15px] font-bold",
                        theme?.heading ?? "text-gray-900"
                      )}
                    >
                      {service.title}
                    </h3>
                    <p
                      className={cx(
                        "mt-1.5 text-[13.5px] leading-relaxed",
                        theme?.body ?? "text-gray-500"
                      )}
                    >
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
