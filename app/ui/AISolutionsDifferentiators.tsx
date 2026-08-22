"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
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

interface Differentiator {
  title: string;
  description: string;
}

/** The lettered badge (A, B, C, D…) is derived from a card's position, not any Contentful field — matches Refrence/ai-solutions.html's own `.diff-num` treatment. */
const LETTERS = "ABCDEFGH";


/**
 * The `/ai-solutions` page's "why us" grid — a `composableElement`
 * section (`subType: "aiDifferentiators"` — see
 * `ComposableElementRenderer`), ported from `Refrence/ai-solutions.html`'s
 * differentiators section:
 *
 * - the first `dataText` entry among `elements` supplies the section tag
 *   (`eyebrow`, e.g. "// why us") and heading (`heading`)
 * - every `serviceCard` entry among `elements` becomes one card
 *   (`title`/`shortDescription`), lettered A, B, C… by its position —
 *   same "reuse serviceCard" convention `AISolutionsCapabilities` uses.
 *   Add/remove/reorder `serviceCard` entries in Contentful to change the
 *   roster, nothing here needs to change
 *
 * `heading` renders only when the `dataText` entry actually has one set
 * (no invented heading copy); `eyebrow` still falls back to "// why us"
 * (a short structural section tag). The card grid renders nothing until
 * at least one `serviceCard` entry exists.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * section defaults to the reference mockup's own light navy-on-white
 * identity. The composableElement's own `backgroundImage` field is an
 * optional full-bleed section photo, same "photo wins" treatment every
 * sibling composableElement section uses.
 *
 * Animation: the heading gets the same GSAP split-text scroll-reveal
 * every other section's own heading uses; the card grid fades + rises in
 * with a stagger as it scrolls into view. Each card also gets its own
 * GSAP hover — see the CARD HOVER comment below.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsDifferentiators({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const cardEntries = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map((cardEntry): Differentiator => ({
      title: cardEntry.fields.title ?? "",
      description: cardEntry.fields.shortDescription ?? "",
    }));
  const differentiators = cardEntries;

  const eyebrow = copy?.fields.eyebrow ?? "// why us";
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
     CARD HOVER — distinct from every sibling section's own hover
     treatment (lift+shadow, ripple, corner-glow+CTA, icon-pop): these
     cards sit flush against each other in a seamless bordered grid
     (`gap-px`), so a lift would overlap the neighboring cell instead of
     reading as a card "rising". Instead the lettered badge pops with a
     slight counter-rotate, an accent rule grows in from the left along
     the cell's bottom edge, and the title's color eases to the section's
     own accent (`patternColor`, falling back to the un-themed teal).
     Skipped entirely under `prefers-reduced-motion`.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const letter = card.querySelector<HTMLElement>("[data-diff-letter]");
    const bar = card.querySelector<HTMLElement>("[data-diff-bar]");
    const title = card.querySelector<HTMLElement>("[data-diff-title]");
    const hex = theme?.patternColor ?? "#00C2B2";

    if (letter) {
      gsap.to(letter, {
        scale: 1.3,
        rotate: -8,
        duration: 0.5,
        ease: "back.out(2.4)",
      });
    }

    if (bar) {
      gsap.to(bar, { scaleX: 1, duration: 0.45, ease: "power2.out" });
    }

    if (title) {
      gsap.to(title, { color: hex, duration: 0.35, ease: "power2.out" });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const letter = card.querySelector<HTMLElement>("[data-diff-letter]");
    const bar = card.querySelector<HTMLElement>("[data-diff-bar]");
    const title = card.querySelector<HTMLElement>("[data-diff-title]");

    if (letter) {
      gsap.to(letter, { scale: 1, rotate: 0, duration: 0.4, ease: "power2.out" });
    }

    if (bar) {
      gsap.to(bar, { scaleX: 0, duration: 0.3, ease: "power2.out" });
    }

    if (title) {
      gsap.to(title, { duration: 0.3, ease: "power2.out", clearProps: "color" });
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
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide relative z-2",
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
                "mt-3.5 text-[26px] leading-[1.18] font-bold tracking-tight sm:text-[32px] md:text-[38px] relative z-2",
                theme?.heading ?? "text-[#0B1730]"
              )}
            >
              {heading}
            </DynamicHeading>
          )}

          {intro && (
            <div
              className={cx(
                "rich-text mt-4 text-[15px] leading-relaxed relative z-2",
                theme?.body ?? "text-[#4A5570]"
              )}
            >
              {intro}
            </div>
          )}
        </div>

        {differentiators.length > 0 && (
        <div
          ref={gridRef}
          className={cx(
            "mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4",
            theme?.cardBorder ?? "border-gray-200",
            theme?.sectionBg ?? "bg-gray-200"
          )}
        >
          {differentiators.map((item, index) => (
            <div
              key={item.title}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "relative z-2 overflow-hidden p-7",
                theme?.cardBg ?? "bg-white",
                theme?.cardBorder ?? "border-gray-200",
              )}
            >
              <div
                data-diff-letter
                className={cx(
                  "mb-4 inline-block font-mono text-xs",
                  theme?.accentText ?? "text-[#00C2B2]"
                )}
              >
                {LETTERS[index % LETTERS.length]}
              </div>

              <h3
                data-diff-title
                className={cx(
                  "text-[17.6px] font-bold tracking-tight",
                  theme?.heading ?? "text-[#0B1730]"
                )}
              >
                {item.title}
              </h3>

              <p
                className={cx(
                  "mt-2.5 text-[14px] leading-relaxed font-medium",
                  theme?.body ?? "text-[#4A5570]"
                )}
              >
                {item.description}
              </p>

              {/* Accent rule — hidden (scaleX 0) until `handleCardEnter`
                  grows it in from the left along the cell's bottom edge. */}
              <span
                aria-hidden
                data-diff-bar
                style={{ backgroundColor: theme?.patternColor ?? "#00C2B2" }}
                className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0"
              />
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
