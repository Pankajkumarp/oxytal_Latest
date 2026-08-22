"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { Compass, Layers, Map as MapIcon, Rocket, type LucideIcon } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
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

interface Step {
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by step index as a fallback when a `contentDetail` entry has no `icon` image set — matches the mockup's own 4-icon set (discover/assess/roadmap/deliver). */
const FALLBACK_ICONS: LucideIcon[] = [Compass, Layers, MapIcon, Rocket];

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_STEPS: Step[] = [];

/** Maps a resolved `contentDetail` entry to one `Step`. */
function contentDetailToStep(entry: PlainEntry<ContentDetailSkeleton>): Step {
  const iconEntry = entry.fields.icon;

  return {
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
          (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

/**
 * The `/landing-page` "process strip" — a `composableElement` section
 * (`subType: "landingProcess"` — see `ComposableElementRenderer`), ported
 * from `Refrence/oxytal-landing-page.html`'s `.process-strip` (the 4-up
 * "1 DISCOVER / 2 ASSESS / 3 ROADMAP / 4 DELIVER" row directly under the
 * hero):
 *
 * - every `contentDetail` entry among `elements` becomes one step
 *   (`title`/`shortDescription`/`icon`), numbered by its position in the
 *   list
 *
 * Renders nothing when `elements` has no `contentDetail` entries — no
 * hardcoded placeholder roster (`DEFAULT_STEPS` is intentionally empty).
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`, defaulting to the
 * `dark` preset (the mockup's own navy strip) rather than the site's
 * usual light default. Each step's icon tile gets its own hover — a
 * color-cycling glow ring that rotates around it once — distinct from
 * `ContactProcess`'s ring-pulse and every other icon-tile hover in this
 * codebase. Skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingProcess({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const contentDetailSteps = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToStep);
  const steps = contentDetailSteps.length ? contentDetailSteps : DEFAULT_STEPS;

  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("dark")!;

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const stepsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     STEP REVEAL — fade + rise with a stagger as the strip scrolls
     into view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!stepsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(stepsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(stepsRef.current!.children, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 90%",
          once: true,
        },
      });
    }, stepsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     ICON HOVER — a conic-gradient glow ring spins once around the
     icon tile on hover (rotate 0 -> 360, fading in then out), rather
     than a static pulse — distinct from ContactProcess's ring-pulse
     treatment. Skipped under prefers-reduced-motion.
  ========================================================= */
  const handleEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const ring = event.currentTarget.querySelector<HTMLElement>("[data-glow-ring]");
    if (!ring) return;

    gsap.killTweensOf(ring);
    gsap.fromTo(
      ring,
      { rotate: 0, opacity: 0 },
      { rotate: 360, opacity: 1, duration: 0.9, ease: "power1.inOut" }
    );
  };

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const ring = event.currentTarget.querySelector<HTMLElement>("[data-glow-ring]");
    if (!ring) return;

    gsap.killTweensOf(ring);
    gsap.to(ring, { opacity: 0, duration: 0.35, ease: "power2.out" });
  };

  if (!steps.length) {
    return null;
  }

  return (
    <section
      className={cx(
        "relative overflow-hidden border-t",
        theme.cardBorder,
        backgroundUrl ? "bg-cover bg-center" : theme.sectionBg
      )}
      style={
        backgroundUrl
          ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
       <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div ref={stepsRef} className="container relative z-2 mx-auto grid gap-6 px-5 py-8 md:grid-cols-4 md:px-10">
        {steps.map((step, index) => {
          const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

          return (
            <div key={step.title} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <span
                  data-glow-ring
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-xl opacity-0"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${theme.patternColor}, transparent 60%)`,
                  }}
                />
                <span
                  className={cx(
                    "relative flex h-11 w-11 items-center justify-center rounded-xl text-lg",
                    theme.eyebrowBg,
                    theme.accentText
                  )}
                >
                  {step.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img src={step.iconUrl} alt="" aria-hidden className="h-5 w-5 object-contain" />
                  ) : (
                    <FallbackIcon size={20} aria-hidden />
                  )}
                </span>
              </div>
              <div>
                <h4 className={cx("text-[13px] font-bold tracking-wide uppercase", theme.heading)}>
                  {step.title}
                </h4>
                <p className={cx("mt-1 text-[13px] leading-snug", theme.body)}>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
