"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Landmark, HeartPulse, ShoppingCart, Factory, Building2, Truck, type LucideIcon } from "lucide-react";
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
  StatisticSkeleton,
} from "../types/contentful";

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

interface Tile {
  label: string;
  iconUrl?: string;
}

/** Cycled by tile index as a fallback when a `statistic` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [Landmark, HeartPulse, ShoppingCart, Factory, Building2, Truck];

/** Tile hover glow/shadow color when no `themeColor` is set — matches this file's other `text-blue-600`-style fallbacks. */
const FALLBACK_ACCENT = "#2563eb";

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_TILES: Tile[] = [];

/** Maps a resolved `statistic` entry to one industry tile — `label` as the industry name, `icon` optional, `value` unused. */
function statisticToTile(entry: PlainEntry<StatisticSkeleton>): Tile {
  const iconEntry = entry.fields.icon;

  return {
    label: entry.fields.label,
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
          (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

/**
 * The `/landing-page` "Industries we serve" grid — a `composableElement`
 * section (`subType: "landingIndustries"` — see `ComposableElementRenderer`),
 * ported from `Refrence/oxytal-landing-page.html`'s `.industries-grid`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading (left) and support paragraph (right, `text` rich text)
 * - every `statistic` entry among `elements` becomes one tile
 *   (`label`/`icon`)
 *
 * Renders nothing when `elements` has no `statistic` entries — no
 * hardcoded placeholder roster.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`. Tiles fade + rise
 * + scale in with a stagger as the grid scrolls into view (once). On
 * hover each tile lifts with a soft theme-tinted shadow while its icon
 * pops with a springy scale + counter-rotate (`back.out`) over a
 * blurred glow that blooms in behind it — the same lift/spring
 * vocabulary `LandingCards` uses, plus the glow to suit this grid's
 * smaller icon-only tiles. The border's own color-shift to the theme
 * accent is plain CSS, so it still applies under `prefers-reduced-motion`
 * even though the lift/spring/glow are skipped there.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingIndustries({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const statisticTiles = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map(statisticToTile);
  const tiles = statisticTiles.length ? statisticTiles : DEFAULT_TILES;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const support: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const tilesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!tilesRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(tilesRef.current.children, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(tilesRef.current!.children, {
        y: 22,
        opacity: 0,
        scale: 0.94,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: tilesRef.current, start: "top 88%", once: true },
      });
    }, tilesRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     TILE HOVER — the tile lifts with a theme-tinted shadow while its
     icon pops with a springy scale + counter-rotate over a blurred
     glow that blooms in behind it. Skipped under
     prefers-reduced-motion (the CSS border color-shift still applies).
  ========================================================= */
  const handleTileEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const card = event.currentTarget;
    const accent = theme?.patternColor ?? FALLBACK_ACCENT;

    gsap.to(card, {
      y: -6,
      scale: 1.035,
      boxShadow: `0 18px 34px -18px ${accent}80`,
      duration: 0.4,
      ease: "power2.out",
    });

    const icon = card.querySelector<HTMLElement>("[data-tile-icon]");
    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1.18, rotate: -8, duration: 0.5, ease: "back.out(2.6)" });
    }

    const glow = card.querySelector<HTMLElement>("[data-tile-glow]");
    if (glow) {
      gsap.killTweensOf(glow);
      gsap.to(glow, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" });
    }
  };

  const handleTileLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const card = event.currentTarget;
    gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out", clearProps: "boxShadow" });

    const icon = card.querySelector<HTMLElement>("[data-tile-icon]");
    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.4, ease: "power2.out" });
    }

    const glow = card.querySelector<HTMLElement>("[data-tile-glow]");
    if (glow) {
      gsap.killTweensOf(glow);
      gsap.to(glow, { opacity: 0, scale: 0.7, duration: 0.35, ease: "power2.out" });
    }
  };

  if (!eyebrow && !heading && !support && !tiles.length) {
    return null;
  }

  return (
    <section className={cx("relative overflow-hidden py-16 md:py-20", backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white"))} style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
            </div>
      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div>
            {eyebrow && (
              <span className={cx("inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", theme?.eyebrowBg ?? "bg-blue-50", theme?.eyebrowText ?? "text-blue-700")}>
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")} className={cx("mt-3.5 max-w-lg text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}>
                {heading}
              </DynamicHeading>
            )}
          </div>
          {support && (
            <div className={cx("rich-text max-w-md text-[15px] leading-relaxed", theme?.body ?? "text-gray-500")}>{support}</div>
          )}
        </div>

        {tiles.length > 0 && (
          <div ref={tilesRef} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((tile, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <div
                  key={tile.label}
                  onMouseEnter={handleTileEnter}
                  onMouseLeave={handleTileLeave}
                  className={cx(
                    "relative flex flex-col items-center gap-2.5 overflow-hidden rounded-xl border p-5 text-center text-[13.5px] font-bold transition-colors duration-300",
                    theme?.cardBorder ?? "border-gray-100 hover:border-blue-300",
                    theme?.cardBg ?? "bg-white",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  <span className="relative flex h-9 w-9 items-center justify-center">
                    <span
                      data-tile-glow
                      aria-hidden
                      className="absolute -inset-3 scale-75 rounded-full opacity-0 blur-lg"
                      style={{ backgroundColor: theme?.patternColor ?? FALLBACK_ACCENT }}
                    />
                    <span
                      data-tile-icon
                      className={cx("relative flex h-9 w-9 items-center justify-center", theme?.accentText ?? "text-blue-600")}
                    >
                      {tile.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                        <img src={tile.iconUrl} alt="" aria-hidden className="h-6 w-6 object-contain" />
                      ) : (
                        <FallbackIcon size={24} aria-hidden />
                      )}
                    </span>
                  </span>
                  {tile.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
