"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  Cloud,
  Cpu,
  Database,
  ShieldCheck,
  Plug,
  Code2,
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
  TechnologySkeleton,
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

interface TechPillar {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  pills: string[];
}

/** Cycled by pillar index as a fallback when a `contentDetail` entry has no `icon` image set — same pattern HomeServices/AboutApproach use. */
const FALLBACK_ICONS: LucideIcon[] = [Cloud, Code2, Plug, Database, ShieldCheck, Cpu];

/** Cycled by pillar index for the icon tile's gradient — matches the reference's own per-pillar color rotation. */
const GRADIENT_CYCLE = [
  "from-[#1450d4] to-[#2d7dfa]",
  "from-[#0a6688] to-[#00b4cc]",
  "from-[#1a8040] to-[#22b060]",
  "from-[#7a2a10] to-[#d97706]",
  "from-[#4a1a7a] to-[#8030c0]",
  "from-[#1a5a7a] to-[#2d9fcf]",
];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the reference's own 6-pillar grid. */
const DEFAULT_PILLARS: TechPillar[] = [];

/** Maps a resolved `contentDetail` entry to one `TechPillar` — `title`/`shortDescription` as the name/description, `icon` (falls back to a cycled Lucide icon) as the glyph, every `technology` entry in `technologies` as one pill tag (`name`). */
function contentDetailToTechPillar(
  entry: PlainEntry<ContentDetailSkeleton>
): TechPillar {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const pills = (entry.fields.technologies ?? [])
    .filter(isEntry)
    .map((tech) => (tech as unknown as PlainEntry<TechnologySkeleton>).fields.name);

  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
    pills,
  };
}

/** The reference's own dark navy gradient — used as the un-themed default background, same identity `AboutApproach` uses on its own section. */
const NAVY_GRADIENT = "linear-gradient(160deg, #050e2d, #0a2885 55%, #081a5a)";

/**
 * The `/products` page's "Enterprise-Grade Technology Foundations" section
 * — a `composableElement` section (`subType: "productTech"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-products.html`'s `.tech-section`, split the same way
 * `AboutApproach` was:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one tech pillar
 *   (via `contentDetailToTechPillar`) — `title`/`shortDescription` as the
 *   name/description, `icon` (falls back to a cycled Lucide icon) as the
 *   glyph, and every `technology` entry in its `technologies` array as
 *   one pill tag (`name`) underneath — same content type `Footer`'s own
 *   tech list could reuse; add/remove/reorder entries in Contentful to
 *   change the roster, nothing here needs to change
 *
 * Renders nothing for the eyebrow, heading, or the pillar grid when
 * the corresponding entries/fields aren't set in Contentful yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own dark navy gradient (`NAVY_GRADIENT`) with white/cyan text, matching
 * `AboutApproach`'s own un-themed default.
 *
 * The composableElement's own `backgroundImage` field is an optional
 * full-bleed photo — wins over both the gradient and the theme when set,
 * same convention `AboutApproach` uses; `ThemePattern`'s dotted backdrop
 * only renders when there's no photo.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The pillar cards fade + rise into place with a
 * stagger as the grid scrolls into view, and on hover each one lifts with
 * a soft accent-tinted glow while its icon tile pops with a bouncy
 * rotate — see the CARD HOVER comment below. All skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductTech({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailPillars = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToTechPillar);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const pillars = contentDetailPillars.length ? contentDetailPillars : DEFAULT_PILLARS;

  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const backgroundStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})` }
    : theme
      ? undefined
      : { background: NAVY_GRADIENT };

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
     CARD REVEAL — fade + rise with a stagger as the grid scrolls into
     view (same load treatment `AboutProducts`/`ContactStats` use).
     Skipped entirely under prefers-reduced-motion.
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
        y: 32,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
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
     CARD HOVER — the card lifts with a soft glow tinted in the section's
     own accent (`theme.patternColor`, falling back to the un-themed
     blue), while its icon tile pops with a slight rotate on a bouncy
     `back` ease — same "modern" GSAP hover vocabulary
     `AISolutionsCapabilities` uses for its own icon-badge cards. Skipped
     entirely under `prefers-reduced-motion`.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-pillar-icon]");
    const hex = theme?.patternColor ?? "#2F5CFF";

    gsap.to(card, {
      y: -8,
      boxShadow: `0 28px 56px -20px ${hex}80`,
      duration: 0.45,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: 1.12,
        rotate: 8,
        duration: 0.5,
        ease: "back.out(2.2)",
      });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-pillar-icon]");

    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      clearProps: "boxShadow",
    });

    if (icon) {
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.4, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="technology"
      aria-labelledby="tech-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
      )}
      style={backgroundStyle}
    >

        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="max-w-xl">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-white/10",
                theme?.eyebrowText ?? "text-[#00d4ff]"
              )}
            >
              {eyebrow}
            </span>
          )}
          {heading && (
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              id="tech-heading"
              className={cx(
                "mt-4 text-[26px] leading-[1.15] font-extrabold tracking-tight sm:text-[32px] md:text-[38px]",
                theme?.heading ?? "text-white"
              )}
            >
              {heading}
            </DynamicHeading>
          )}
          <div
            className={cx(
              "rich-text mt-4 text-[15px] leading-relaxed",
              theme?.body ?? "text-[#7b93c8]"
            )}
          >
            {description}
          </div>
        </div>

        {pillars.length > 0 && (
          <div ref={cardsRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
              const gradient = GRADIENT_CYCLE[index % GRADIENT_CYCLE.length];

              return (
                <div
                  key={pillar.id}
                  onMouseEnter={handleCardEnter}
                  onMouseLeave={handleCardLeave}
                  className={cx(
                    "rounded-2xl p-7 ring-1 ring-white/10 border",
                    theme?.cardBg ?? "bg-white/5 hover:bg-white/9",
                    theme?.cardBorder ?? ""
                  )}
                >
                  <div
                    data-pillar-icon
                    className={cx(
                      "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      gradient
                    )}
                  >
                    {pillar.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={pillar.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={22} aria-hidden />
                    )}
                  </div>
                  <p className={cx("mt-5 text-[17px] font-bold", theme?.heading ?? "text-white")}>
                    {pillar.title}
                  </p>
                  <p className={cx("mt-2 text-[13.5px] leading-relaxed", theme?.body ?? "text-[#7b93c8]")}>
                    {pillar.description}
                  </p>
                  {pillar.pills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {pillar.pills.map((pill) => (
                        <span
                          key={pill}
                          className={cx(
                            "inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors duration-200",
                            theme?.cardBorder ?? "bg-white/8 text-white/75 ring-white/10 hover:bg-[rgba(45,125,250,.2)] hover:text-white"
                          )}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
