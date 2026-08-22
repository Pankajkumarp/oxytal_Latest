"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ClipboardList,
  PhoneCall,
  Presentation,
  Rocket,
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

interface ProcessStep {
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by step index as a fallback when a `contentDetail` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [
  PhoneCall,
  ClipboardList,
  Presentation,
  Rocket,
];

/** Maps a resolved `contentDetail` entry to the plain `ProcessStep` shape this component renders. */
function contentDetailToProcessStep(
  entry: PlainEntry<ContentDetailSkeleton>
): ProcessStep {
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
 * The `/contact` page's "What Happens Next?" timeline — a
 * `composableElement` section (`subType: "contactProcess"` — see
 * `ComposableElementRenderer`):
 *
 * - a `dataText` entry among `elements` supplies the heading via its own
 *   `heading` field
 * - every `contentDetail` entry among `elements` becomes one numbered
 *   step (`title`/`shortDescription`/`icon`), numbered `01`, `02`, …
 *   by its position in the list
 *
 * Renders nothing for the heading or the step timeline when the
 * corresponding entries/fields aren't set in Contentful yet (each
 * step still gets a cycled Lucide icon when it has no `icon` image
 * of its own).
 *
 * Un-themed, this section keeps the mockup's own dark/amber look (a
 * `bg-gray-900` section with amber step markers/connecting line) rather
 * than the site's default emerald palette — `resolveTheme` still wins
 * when an editor sets a `themeColor`, same as every other
 * composableElement section.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling section uses) is an
 * *optional* full-bleed section photo — when set, it covers the whole
 * section with a dark tint over it (the current theme's own
 * `sectionBg` color at reduced opacity — `bg-gray-900` un-themed, so
 * switching `themeColor` also changes the tint, same "photo wins, tint
 * matches the theme" treatment `AboutStats` uses) instead of the
 * decorative amber blur blobs/dotted pattern, which only render when
 * there's no photo.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses, and its font size now matches the site's
 * standard section-heading scale (`text-[28px]…sm:text-[34px]…
 * md:text-[40px]`, e.g. `AboutGlobal`/`CommonTrustedBy`) instead of the
 * smaller size this section started with.
 *
 * Each step also gets its own GSAP hover — the icon circle scales up
 * and a soft ring pulses outward from it once per hover, distinct from
 * `ContactInfoCards`' icon-bounce/arrow-slide treatment — on top of the
 * scroll-triggered fade + rise every step already gets as the timeline
 * scrolls into view. Both are skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ContactProcess({ entry }: Props) {
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
    .map(contentDetailToProcessStep);

  const heading = copy?.fields.heading;
  const steps = contentDetailSteps;

  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling
     section). Skipped entirely under prefers-reduced-motion.
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
     STEP REVEAL — fade + rise with a stagger as the timeline
     scrolls into view. Skipped entirely under
     prefers-reduced-motion.
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
        y: 32,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, stepsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     STEP HOVER — the icon circle scales up slightly while a soft
     ring pulses outward from it once per hover (scale 0.8 → 1.6,
     fading out as it grows), reverting on mouse-leave. Re-entering a
     step kills any tween in progress first. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  const handleStepEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const step = event.currentTarget;
    const icon = step.querySelector<HTMLElement>("[data-step-icon]");
    const ring = step.querySelector<HTMLElement>("[data-step-ring]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1.1, duration: 0.4, ease: "back.out(2.5)" });
    }

    if (ring) {
      gsap.killTweensOf(ring);
      gsap.fromTo(
        ring,
        { scale: 0.8, opacity: 0.6 },
        { scale: 1.6, opacity: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  };

  const handleStepLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const step = event.currentTarget;
    const icon = step.querySelector<HTMLElement>("[data-step-icon]");
    const ring = step.querySelector<HTMLElement>("[data-step-ring]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1, duration: 0.3, ease: "power2.out" });
    }

    if (ring) {
      gsap.killTweensOf(ring);
      gsap.to(ring, { scale: 0.8, opacity: 0, duration: 0.2, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-20",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-gray-900")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {backgroundUrl ? (
          <div
            className={cx(
              "absolute inset-0 opacity-80",
              theme?.sectionBg ?? "bg-gray-900"
            )}
          />
        ) : (
          <>
            <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          </>
        )}
      </div>

      <div className="container mx-auto px-5 md:px-10">
        {heading && (
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "mx-auto max-w-2xl text-center text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>
        )}

        {steps.length > 0 && (
        <div
          ref={stepsRef}
          className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6"
        >
          <div
            aria-hidden
            className={cx(
              "absolute top-7 right-0 left-0 hidden border-t md:block",
              // Uses the theme's own border color (light themes like
              // "yellow" get a light border that reads against their
              // light section background; dark themes get a light-on-
              // dark one) instead of a hardcoded white/amber pair that
              // only worked for the un-themed dark default.
              theme?.cardBorder ?? "border-amber-500/30"
            )}
          />

          {steps.map((step, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
            const stepNumber = String(index + 1).padStart(2, "0");

            return (
              <div
                key={step.title}
                onMouseEnter={handleStepEnter}
                onMouseLeave={handleStepLeave}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative inline-flex">
                  <span
                    data-step-ring
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute inset-0 m-auto h-14 w-14 scale-0 rounded-full border-2 opacity-0",
                      theme?.cardBorder ?? "border-amber-500"
                    )}
                  />
                  <div
                    data-step-icon
                    className={cx(
                      "relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2",
                      theme?.sectionBg ?? "bg-gray-900",
                      theme?.accentText ?? "text-amber-500",
                      theme?.cardBorder ?? "border-amber-500"
                    )}
                  >
                    {step.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={step.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={22} aria-hidden />
                    )}
                    <span
                      className={cx(
                        "absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                        theme?.buttonBg ?? "bg-amber-500",
                        theme?.buttonText ?? "text-gray-900"
                      )}
                    >
                      {stepNumber}
                    </span>
                  </div>
                </div>
                <p
                  className={cx(
                    "mt-5 text-[15px] font-bold",
                    theme?.heading ?? "text-white"
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cx(
                    "mt-2 max-w-[220px] text-[13px] leading-relaxed",
                    theme?.body ?? "text-gray-400"
                  )}
                >
                  {step.description}
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
