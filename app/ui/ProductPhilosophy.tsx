"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { HeartHandshake, Layers3, Zap, type LucideIcon } from "lucide-react";
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

interface Principle {
  id: string;
  num: string;
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by principle index as a fallback when a `contentDetail` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [HeartHandshake, Layers3, Zap];

/** Cycled by principle index for the icon circle's gradient — matches the reference's own per-principle color rotation. */
const GRADIENT_CYCLE = [
  "from-[#1450d4] to-[#2d7dfa]",
  "from-[#0a6688] to-[#00b4cc]",
  "from-[#1a8040] to-[#22b060]",
];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the reference's own 3-principle grid. */
const DEFAULT_PRINCIPLES: Principle[] = [];

/** Maps a resolved `contentDetail` entry (plus its array position) to one `Principle` — `title`/`shortDescription` as the name/description, `icon` (falls back to a cycled Lucide icon) as the glyph, and its position (e.g. "Principle 01") as the number label. */
function contentDetailToPrinciple(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): Principle {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  return {
    id: entry.sys.id,
    num: `Principle ${String(index + 1).padStart(2, "0")}`,
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
  };
}

/**
 * The `/products` page's "Three Principles That Guide Everything We
 * Build" section — a `composableElement` section (`subType:
 * "productPhilosophy"` — see `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-products.html`'s `.philosophy-section`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one principle
 *   card (via `contentDetailToPrinciple`) — `title`/`shortDescription`
 *   as the name/description, `icon` (falls back to a cycled Lucide icon)
 *   as the glyph, and its position (zero-padded, e.g. "Principle 01") as
 *   the number label; add/remove/reorder `contentDetail` entries in
 *   Contentful to change the roster, nothing here needs to change
 *
 * `DEFAULT_PRINCIPLES` is an empty roster, so no principle cards render
 * until `contentDetail` entries exist. `heading` renders only when the
 * `dataText` entry actually has one set; `eyebrow` still falls back to
 * "Product Philosophy" (a short structural section tag, not authored
 * marketing copy) when unset.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own plain white background. The composableElement's own `backgroundImage`
 * field is an optional full-bleed photo, same convention as every sibling
 * section; `ThemePattern`'s dotted backdrop only renders when there's no
 * photo.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The principle cards get a distinct load
 * treatment from every sibling grid — a fade + scale-up-from-0.85 (rather
 * than a slide), staggered one after another as the grid scrolls into
 * view. On hover each card zooms in slightly, its icon circle doing a
 * full flat spin and its "Principle NN" label's letter-spacing fanning
 * out in the section's accent color — see the CARD HOVER comment below
 * for why this is deliberately unlike every sibling section's own hover.
 * All skipped entirely under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductPhilosophy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailPrinciples = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map((detailEntry, index) => contentDetailToPrinciple(detailEntry, index));

  const eyebrow = copy?.fields.eyebrow ?? "Product Philosophy";
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const principles = contentDetailPrinciples.length
    ? contentDetailPrinciples
    : DEFAULT_PRINCIPLES;

  const theme = resolveTheme(entry?.fields.themeColor);

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
     scroll-in (same GSAP split-text treatment as every sibling section).
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
     CARD REVEAL — distinct from every sibling grid's slide-in: a fade +
     scale-up from 0.85 (rather than a directional slide), staggered one
     after another as the grid scrolls into view. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        scale: 0.85,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.6)",
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
     CARD HOVER — distinct from every sibling section's own hover
     (lift+shadow, ripple, corner-glow, letter-pop+bar): the whole card
     zooms in slightly (no lift, since these sit in a spaced grid rather
     than flush cells), the icon circle does a full flat spin rather than
     a partial rotate or 3D flip, and the "Principle NN" label's letter-
     spacing fans out while its color eases to the section's own accent
     (`theme.patternColor`, falling back to the un-themed cyan). The
     icon's rotation is left uncleared on leave (`+=360` accumulates), so
     repeated hovers keep spinning forward rather than snapping back.
     Skipped entirely under `prefers-reduced-motion`.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-principle-icon]");
    const label = card.querySelector<HTMLElement>("[data-principle-label]");
    const hex = theme?.patternColor ?? "#00d4ff";

    gsap.to(card, { scale: 1.03, duration: 0.4, ease: "power2.out" });

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { rotate: "+=360", duration: 0.6, ease: "power2.inOut" });
    }

    if (label) {
      gsap.to(label, {
        color: hex,
        letterSpacing: "0.28em",
        duration: 0.35,
        ease: "power2.out",
      });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const label = card.querySelector<HTMLElement>("[data-principle-label]");

    gsap.to(card, { scale: 1, duration: 0.35, ease: "power2.out" });

    if (label) {
      gsap.to(label, {
        duration: 0.3,
        ease: "power2.out",
        clearProps: "color,letterSpacing",
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-blue-50",
                theme?.eyebrowText ?? "text-blue-700"
              )}
            >
              {eyebrow}
            </span>
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
                ref={headingRef}
                className={cx(
                  "mt-4 text-[26px] leading-[1.15] font-extrabold tracking-tight sm:text-[32px] md:text-[38px]",
                  theme?.heading ?? "text-gray-900"
                )}
              >
                {heading}
              </DynamicHeading>
            )}
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

        {principles.length > 0 && (
          <div ref={cardsRef} className="mt-12 grid gap-5 md:grid-cols-3">
            {principles.map((principle, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
              const gradient = GRADIENT_CYCLE[index % GRADIENT_CYCLE.length];

              return (
                <div
                  key={principle.id}
                  onMouseEnter={handleCardEnter}
                  onMouseLeave={handleCardLeave}
                  className={cx(
                    "rounded-2xl border p-9 text-center",
                    theme?.cardBorder ?? "border-[#dce8ff]",
                    theme?.cardBg ?? "bg-[#f5f8ff]"
                  )}
                >
                  <p
                    data-principle-label
                    className="font-mono text-[11px] font-bold tracking-widest text-[#00d4ff] uppercase"
                  >
                    {principle.num}
                  </p>
                  <div
                    data-principle-icon
                    className={cx(
                      "mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg",
                      gradient
                    )}
                  >
                    {principle.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={principle.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={26} aria-hidden />
                    )}
                  </div>
                  <p className={cx("mt-5 text-[17px] font-bold", theme?.heading ?? "text-gray-900")}>
                    {principle.title}
                  </p>
                  <p className={cx("mt-2 text-[13.5px] leading-relaxed", theme?.body ?? "text-gray-500")}>
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
