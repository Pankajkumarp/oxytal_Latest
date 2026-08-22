"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Rocket, Users, type LucideIcon } from "lucide-react";
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

interface MissionVisionCard {
  id: string;
  label: string;
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by card position as a fallback when a `contentDetail` entry has no `icon` image set — Mission first, Vision second. */
const FALLBACK_ICONS: LucideIcon[] = [Rocket, Users];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 2-card Mission/Vision pair. */
const DEFAULT_CARDS: MissionVisionCard[] = [];

/** Maps a resolved `contentDetail` entry to one `MissionVisionCard` — `badge` as the small label ("Our Mission"/"Our Vision"), `title` as the bold headline, `shortDescription` as the body copy, `icon` (falls back to a cycled Lucide icon) as the glyph. */
function contentDetailToCard(
  entry: PlainEntry<ContentDetailSkeleton>
): MissionVisionCard {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  return {
    id: entry.sys.id,
    label: entry.fields.badge ?? "",
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
  };
}

/**
 * The About page's "Mission & Vision" section — a `composableElement`
 * section (`subType: "aboutMissionVision"` — see
 * `ComposableElementRenderer`), split out of `AboutPage` the same way
 * `AboutHero`/`AboutStats`/`AboutStory`/`AboutServices`/`AboutApproach`/
 * `AboutProducts`/`AboutLeadership`/`AboutCulture`/`AboutGlobal` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow and
 *   heading
 * - every `contentDetail` entry among `elements` becomes one card (via
 *   `contentDetailToCard`) — `badge` as the small label, `title` as the
 *   bold headline, `shortDescription` as the body copy, `icon` (falls
 *   back to a cycled Lucide icon) as the glyph; add/remove/reorder
 *   `contentDetail` entries in Contentful to change the roster — the
 *   mockup has exactly two (Mission, Vision), but nothing here assumes
 *   that count
 *
 * Falls back to `DEFAULT_CARDS` and the original hardcoded heading/copy
 * when the corresponding entries aren't set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * plain gray/white/blue look, so it renders the same as before this
 * existed until an editor sets a `themeColor`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling About section uses) is an
 * *optional* full-bleed section background — no placeholder fallback, so
 * the section just shows its themed background color until an editor
 * sets one. `ThemePattern`'s dotted backdrop only renders when there's
 * no background photo, same call every sibling section makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The Mission/Vision cards get their own
 * scroll-triggered load animation too — a fade + rise, staggered one
 * card after another as the grid scrolls into view (no hover animation
 * here, load only). Both are skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutMissionVision({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailCards = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToCard);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;

  const cards = contentDetailCards.length ? contentDetailCards : DEFAULT_CARDS;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own plain gray/white/blue look
  // (today's look, unchanged).
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
     CARD REVEAL — the Mission/Vision cards fade + rise into place with
     a stagger as the grid scrolls into view (same load treatment
     several sibling About sections use). No hover animation here — load
     only. Skipped entirely under prefers-reduced-motion.
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
        duration: 1,
        ease: "power3.out",
        stagger: 0.7,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="mv-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-gray-50")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">

          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 md:px-10">
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
          id="mv-heading"
          className={cx(
            "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
            theme?.heading ?? "text-gray-900"
          )}
        >
          {heading}
        </DynamicHeading>

        <div ref={cardsRef} className="mt-12 grid gap-6 lg:grid-cols-2">
          {cards.map((card, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <div
                key={card.id}
                className={cx(
                  "rounded-2xl border p-9 z-2",
                  theme?.cardBorder ?? "border-blue-100",
                  theme?.cardBg ?? "bg-white"
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1450d4] to-[#2d7dfa] text-white">
                  {card.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={card.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <FallbackIcon size={22} aria-hidden />
                  )}
                </div>
                <p
                  className={cx(
                    "mt-5 text-[11px] font-bold tracking-wide uppercase",
                    theme?.accentText ?? "text-blue-600"
                  )}
                >
                  {card.label}
                </p>
                <p
                  className={cx(
                    "mt-2 text-[19px] font-extrabold",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  {card.title}
                </p>
                <p
                  className={cx(
                    "mt-3 text-[14px] leading-relaxed",
                    theme?.body ?? "text-gray-500"
                  )}
                >
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
