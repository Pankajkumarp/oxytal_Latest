"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Search, SlidersHorizontal, Map as MapIcon, Rocket, type LucideIcon } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
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

interface TimelineStep {
  title: string;
  description: string;
  duration?: string;
  iconUrl?: string;
}

/** Cycled by step index as a fallback when a `contentDetail` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [Search, SlidersHorizontal, MapIcon, Rocket];

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_STEPS: TimelineStep[] = [];

/** Maps a resolved `contentDetail` entry to one timeline step — `title`/`shortDescription`/`icon`, `badge` reused as the duration text (e.g. "Week 1–2") rather than adding a dedicated field to a type this many other sections already share. */
function contentDetailToStep(entry: PlainEntry<ContentDetailSkeleton>): TimelineStep {
  const iconEntry = entry.fields.icon;

  return {
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    duration: entry.fields.badge,
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/**
 * The `/landing-page` "Engagement Timeline" dark panel — a
 * `composableElement` section (`subType: "landingTimeline"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-landing-page.html`'s `.deliver-box`:
 *
 * - the first `dataText` entry among `elements` supplies the left
 *   column's eyebrow/heading/description (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one numbered
 *   step (`title`/`shortDescription`/`icon`), with `badge` reused as its
 *   duration pill (e.g. "Week 1–2") — renders nothing when unset
 *
 * Renders nothing when there's no heading/description and no steps — no
 * hardcoded placeholder content.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`, defaulting to the
 * `dark` preset (the mockup's own navy panel). Steps fade + rise in with
 * a stagger as the panel scrolls into view; each step's icon tile gets a
 * hover that flips it (rotateY 0 -> 180) while swapping to a filled
 * accent background — a distinct flavor from `LandingProcess`'s spinning
 * glow ring and every other icon-tile hover in this codebase. Skipped
 * under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingTimeline({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailSteps = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToStep);
  const steps = contentDetailSteps.length ? contentDetailSteps : DEFAULT_STEPS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("dark")!;

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  const stepsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!stepsRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(stepsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(stepsRef.current!.children, {
        y: 26,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: stepsRef.current, start: "top 85%", once: true },
      });
    }, stepsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     ICON FLIP — the icon tile flips on its Y axis (rotateY 0 -> 180)
     while swapping from an outline to a filled accent background,
     reverting on leave. Skipped under prefers-reduced-motion.
  ========================================================= */
  const handleEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const icon = event.currentTarget.querySelector<HTMLElement>("[data-step-icon]");
    if (!icon) return;

    gsap.killTweensOf(icon);
    gsap.to(icon, { rotateY: 180, transformPerspective: 400, duration: 0.5, ease: "power2.inOut" });
  };

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const icon = event.currentTarget.querySelector<HTMLElement>("[data-step-icon]");
    if (!icon) return;

    gsap.killTweensOf(icon);
    gsap.to(icon, { rotateY: 0, duration: 0.5, ease: "power2.inOut" });
  };

  if (!eyebrow && !heading && !description && !steps.length) {
    return null;
  }

  return (
    <section className={cx("relative overflow-hidden py-16 md:py-20", backgroundUrl ? "bg-cover bg-center" : "bg-transparent")} style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>

      <div className="container relative mx-auto px-5 md:px-10">
        <div className={cx("grid gap-10 relative rounded-3xl p-8 md:grid-cols-[0.9fr_1.4fr] md:items-center md:p-12", theme.sectionBg)}>
          <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        </div>
          <div className="relative z-2">
            {eyebrow && (
              <span className={cx("inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase", theme.eyebrowBg, theme.eyebrowText, theme.cardBorder)}>
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h3")} className={cx("mt-3.5 max-w-lg text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}>
                {heading}
              </DynamicHeading>
            )}
            {description && (
              <div className={cx("rich-text mt-3 max-w-xs text-[14.5px] leading-relaxed", theme.body)}>{description}</div>
            )}
          </div>

          {steps.length > 0 && (
            <div ref={stepsRef} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-2">
              {steps.map((step, index) => {
                const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

                return (
                  <div key={step.title} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                    <span
                      data-step-icon
                      className={cx("flex h-11 w-11 items-center justify-center rounded-xl border", theme.eyebrowBg, theme.accentText, theme.cardBorder)}
                    >
                      {step.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                        <img src={step.iconUrl} alt="" aria-hidden className="h-5 w-5 object-contain" />
                      ) : (
                        <FallbackIcon size={20} aria-hidden />
                      )}
                    </span>
                    <h4 className={cx("mt-3.5 text-[13px] font-bold", theme.heading)}>
                      {String(index + 1).padStart(2, "0")} {step.title}
                    </h4>
                    <p className={cx("mt-1.5 text-[13px] leading-relaxed", theme.body)}>{step.description}</p>
                    {step.duration && (
                      <span className={cx("mt-2 inline-block rounded-full px-2.5 py-1 text-[11.5px] font-bold", theme.eyebrowBg, theme.accentText)}>
                        {step.duration}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
