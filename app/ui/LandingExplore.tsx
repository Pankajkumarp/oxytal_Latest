"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { Bot, Palette, Code2, Cloud, Network, type LucideIcon } from "lucide-react";
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
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

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

interface Pill {
  label: string;
  iconUrl?: string;
}

/** Cycled by pill index as a fallback when a `statistic` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [Bot, Palette, Code2, Cloud, Network];

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_PILLS: Pill[] = [];

/** Maps a resolved `statistic` entry to one pill — `label` as the solution name, `icon` optional, `value` unused. */
function statisticToPill(entry: PlainEntry<StatisticSkeleton>): Pill {
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
 * The `/landing-page` "Explore our solutions" pill row — a
 * `composableElement` section (`subType: "landingExplore"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-landing-page.html`'s `.pill-grid`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading
 * - every `statistic` entry among `elements` becomes one pill
 *   (`label`/`icon`)
 *
 * Renders nothing when `elements` has no `statistic` entries — no
 * hardcoded placeholder roster.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`. Pills fade + rise
 * in with a stagger as the row scrolls into view; each pill's own hover
 * lifts it slightly while its icon dot swaps to the theme's solid accent
 * fill (from an outline tint) — a lighter-weight treatment than
 * `LandingIndustries`' scale/border hover, since pills already read as
 * small, secondary chips rather than cards. Skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingExplore({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const statisticPills = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map(statisticToPill);
  const pills = statisticPills.length ? statisticPills : DEFAULT_PILLS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
    const discrption: ReactNode = copy?.fields.text
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

  const pillsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!pillsRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(pillsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(pillsRef.current!.children, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: pillsRef.current, start: "top 90%", once: true },
      });
    }, pillsRef);

    return () => ctx.revert();
  }, []);

  const handleEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    gsap.to(event.currentTarget, { y: -3, duration: 0.25, ease: "power2.out" });

    const dot = event.currentTarget.querySelector<HTMLElement>("[data-pill-dot]");
    if (dot) gsap.to(dot, { scale: 1.1, duration: 0.25, ease: "power2.out" });
  };

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    gsap.to(event.currentTarget, { y: 0, duration: 0.25, ease: "power2.out" });

    const dot = event.currentTarget.querySelector<HTMLElement>("[data-pill-dot]");
    if (dot) gsap.to(dot, { scale: 1, duration: 0.25, ease: "power2.out" });
  };

  if (!eyebrow && !heading && !pills.length) {
    return null;
  }

  return (
    <section className={cx("relative overflow-hidden py-16 md:py-20", backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white"))} style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                      <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
                    </div>

      <div className="container relative z-2 mx-auto">
        {(eyebrow || heading) && (
          <div className="max-w-lg text-left">
            {eyebrow && (
              <span className={cx("inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", theme?.eyebrowBg ?? "bg-blue-50", theme?.eyebrowText ?? "text-blue-700")}>
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")} className={cx("mt-3.5 text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}>
                {heading}
              </DynamicHeading>
            )}
            
          </div>
        )}
        {discrption && (
            <div className={cx("rich-text mt-3 text-[15px] leading-relaxed", theme?.body ?? "text-gray-500")}>{discrption}</div>
          )}

        {pills.length > 0 && (
          <div ref={pillsRef} className="mt-9 flex flex-wrap gap-3.5">
            {pills.map((pill, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <div
                  key={pill.label}
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                  className={cx("flex items-center gap-2.5 rounded-full border px-5 py-3 text-[14px] font-bold shadow-sm", theme?.cardBorder ?? "border-gray-100", theme?.cardBg ?? "bg-white", theme?.heading ?? "text-gray-900")}
                >
                  <span data-pill-dot className={cx("flex h-6.5 w-6.5 items-center justify-center rounded-lg", theme?.eyebrowBg ?? "bg-blue-50", theme?.accentText ?? "text-blue-600")}>
                    {pill.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img src={pill.iconUrl} alt="" aria-hidden className="h-3.5 w-3.5 object-contain" />
                    ) : (
                      <FallbackIcon size={13} aria-hidden />
                    )}
                  </span>
                  {pill.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
