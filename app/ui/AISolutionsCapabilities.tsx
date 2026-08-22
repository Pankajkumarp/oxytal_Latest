"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  Clock,
  Database,
  FileText,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
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
  ServiceCardSkeleton,
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

interface Capability {
  title: string;
  description: string;
  iconUrl?: string;
}

/** Maps a resolved `serviceCard` entry to one `Capability` — reusing `serviceCard` (title/shortDescription/icon) instead of a dedicated content type, same pattern `HomeServices` uses. */
function serviceCardToCapability(
  entry: PlainEntry<ServiceCardSkeleton>
): Capability {
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

/** Cycled by card index as a fallback when a `serviceCard` entry has no `icon` image set — matches the 6 icons in Refrence/ai-solutions.html's own capability grid. */
const FALLBACK_ICONS: LucideIcon[] = [
  FileText,
  TrendingUp,
  LayoutGrid,
  Database,
  Sparkles,
  Clock,
];


/**
 * The `/ai-solutions` page's capability grid — a `composableElement`
 * section (`subType: "aiCapabilities"` — see `ComposableElementRenderer`),
 * ported from `Refrence/ai-solutions.html`'s `#capabilities` section:
 *
 * - the first `dataText` entry among `elements` supplies the section tag
 *   (`eyebrow`, e.g. "// capabilities") and heading (`heading`)
 * - every `serviceCard` entry among `elements` becomes one card (via
 *   `serviceCardToCapability`) — `title`/`shortDescription`, with a
 *   cycled fallback Lucide icon when a card has no `icon` image set. Add/
 *   remove/reorder `serviceCard` entries in Contentful to change the
 *   roster, nothing here needs to change
 *
 * `heading` renders only when the `dataText` entry actually has one set
 * (no invented heading copy); `eyebrow` still falls back to
 * "// capabilities" (a short structural section tag). The card grid
 * renders nothing until at least one `serviceCard` entry exists.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * section defaults to the reference mockup's own light navy-on-white
 * identity. The composableElement's own `backgroundImage` field is an
 * optional full-bleed section photo, same "photo wins" treatment every
 * sibling composableElement section uses.
 *
 * Animation: the heading gets the same GSAP split-text scroll-reveal
 * every other section's own heading uses, and the card grid fades + rises
 * into place with a stagger as it scrolls into view. Each card also gets
 * its own GSAP hover — see the CARD HOVER comment below. All of it is
 * skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsCapabilities({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const capabilityEntries = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map(serviceCardToCapability);
  const capabilities = capabilityEntries;

  const eyebrow = copy?.fields.eyebrow ?? "// capabilities";
  const heading = copy?.fields.heading;
  const intro: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const theme = resolveTheme(entry?.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     HEADING REVEAL — splits into words on scroll-in, same GSAP
     vocabulary every other section's own heading uses. Skipped under
     prefers-reduced-motion.
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
     CARD GRID REVEAL — fade + rise with a stagger as the grid scrolls
     into view. Skipped under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!gridRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(gridRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(gridRef.current!.children, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD HOVER — the card lifts with a soft shadow tinted in the
     section's own theme color (`patternColor`, falling back to the
     un-themed accent blue), while its icon badge pops with a slight
     rotate on a bouncy `back` ease — distinct from every sibling
     section's own hover treatment (lift+shadow only, ripple, or
     corner-glow+CTA). Skipped entirely under `prefers-reduced-motion`,
     same as every sibling section's own GSAP hover.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-capability-icon]");
    const hex = theme?.patternColor ?? "#2F5CFF";

    gsap.to(card, {
      y: -6,
      borderColor: hex,
      boxShadow: `0 20px 40px -24px ${hex}66`,
      duration: 0.4,
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
    const icon = card.querySelector<HTMLElement>("[data-capability-icon]");

    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      clearProps: "boxShadow,borderColor",
    });

    if (icon) {
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.4, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl && (theme?.sectionBg ?? "bg-white")
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
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-20">
        <div className="max-w-xl">
          {/* Same rounded-pill eyebrow badge every other composableElement
              section uses, not the reference mockup's own bare "// tag"
              mono-font label — kept consistent with the rest of the site. */}
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide z-2 relative",
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
                "mt-3.5 text-[26px] leading-[1.18] font-bold tracking-tight sm:text-[32px] md:text-[38px] z-2 relative",
                theme?.heading ?? "text-[#0B1730]"
              )}
            >
              {heading}
            </DynamicHeading>
          )}

          {intro && (
            <div
              className={cx(
                "rich-text mt-4 text-[15px] leading-relaxed z-2 relative",
                theme?.body ?? "text-[#4A5570]"
              )}
            >
              {intro}
            </div>
          )}
        </div>

        {capabilities.length > 0 && (
        <div
          ref={gridRef}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {capabilities.map((capability, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <div
                key={capability.title}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "rounded-2xl border p-7 z-2",
                  theme?.cardBorder ?? "border-gray-200",
                  theme?.cardBg ?? "bg-white"
                )}
              >
                <div
                  data-capability-icon
                  className={cx(
                    "mb-5 flex h-11 w-11 items-center justify-center rounded-xl",
                    theme?.eyebrowBg ?? "bg-[#F5F7FC]"
                  )}
                >
                  {capability.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={capability.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <FallbackIcon
                      size={22}
                      strokeWidth={1.8}
                      className={theme?.accentText ?? "text-[#2F5CFF]"}
                      aria-hidden
                    />
                  )}
                </div>

                <h3
                  className={cx(
                    "text-[17.5px] font-bold tracking-tight",
                    theme?.heading ?? "text-[#0B1730]"
                  )}
                >
                  {capability.title}
                </h3>

                <p
                  className={cx(
                    "mt-2.5 text-[14.5px] leading-relaxed",
                    theme?.body ?? "text-[#4A5570]"
                  )}
                >
                  {capability.description}
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
