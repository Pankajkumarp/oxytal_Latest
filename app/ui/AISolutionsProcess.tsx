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

interface Step {
  title: string;
  description: string;
}


/**
 * The `/ai-solutions` page's engagement process — a `composableElement`
 * section (`subType: "aiProcess"` — see `ComposableElementRenderer`),
 * ported from `Refrence/ai-solutions.html`'s `#process` dark panel:
 *
 * - the first `dataText` entry among `elements` supplies the section tag
 *   (`eyebrow`, e.g. "// engagement") and heading (`heading`)
 * - every `serviceCard` entry among `elements` becomes one step
 *   (`title`/`shortDescription`), numbered 01, 02, 03… by its position —
 *   same "reuse serviceCard" convention `AISolutionsCapabilities`/
 *   `AISolutionsDifferentiators` use. Add/remove/reorder `serviceCard`
 *   entries in Contentful to change the roster, nothing here needs to
 *   change
 *
 * `heading` renders only when the `dataText` entry actually has one set
 * (no invented heading copy); `eyebrow` still falls back to
 * "// engagement" (a short structural section tag). The step row
 * renders nothing until at least one `serviceCard` entry exists.
 *
 * Un-themed, this section defaults to a dark navy panel (the reference
 * mockup's own look) rather than the site's usual light default — an
 * explicit `themeColor` still overrides it, same convention
 * `ContactFaq`'s "yellow" default uses. The composableElement's own
 * `backgroundImage` field is an optional full-bleed section photo, same
 * "photo wins" treatment every sibling composableElement section uses.
 *
 * Animation: the heading gets the same GSAP split-text scroll-reveal
 * every other section's own heading uses; the step row fades + rises in
 * with a stagger as it scrolls into view. Each step card also gets its
 * own GSAP hover — see the CARD HOVER comment below.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsProcess({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const stepEntries = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map((stepEntry): Step => ({
      title: stepEntry.fields.title ?? "",
      description: stepEntry.fields.shortDescription ?? "",
    }));
  const steps = stepEntries;

  const eyebrow = copy?.fields.eyebrow ?? "// engagement";
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

  // Un-themed, this section defaults to a dark navy panel (the reference
  // mockup's own look) rather than the site's usual light default — an
  // explicit `themeColor` still wins when an editor sets one, same
  // convention `ContactFaq`'s "yellow" default uses.
  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("navy")!;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

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
    if (!rowRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(rowRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(rowRef.current!.children, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: rowRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, rowRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD HOVER — distinct from every sibling section's own hover
     treatment: the card lifts with a soft glow tinted in the section's
     own accent (`patternColor`, falling back to the un-themed cyan a
     "navy" theme uses), while the step number does a full 3D spin
     around its vertical axis — a "flipping to the next step" cue that
     fits the numbered-sequence motif, unlike the 2D rotate/pop or
     underline-reveal treatments the other `/ai-solutions` sections use.
     Skipped entirely under `prefers-reduced-motion`.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const number = card.querySelector<HTMLElement>("[data-step-number]");
    const hex = theme.patternColor;

    gsap.to(card, {
      y: -6,
      borderColor: hex,
      boxShadow: `0 24px 48px -20px ${hex}80`,
      duration: 0.4,
      ease: "power2.out",
    });

    if (number) {
      gsap.killTweensOf(number);
      gsap.fromTo(
        number,
        { rotationY: 0 },
        {
          rotationY: 360,
          transformPerspective: 400,
          duration: 0.7,
          ease: "power2.inOut",
        }
      );
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const number = card.querySelector<HTMLElement>("[data-step-number]");

    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      clearProps: "boxShadow,borderColor",
    });

    if (number) {
      gsap.killTweensOf(number);
      gsap.set(number, { rotationY: 0 });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-20 !pb-[30px]",
        !backgroundUrl && "bg-white"
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
      <div className="container mx-auto px-5 md:px-10">
        <div
          className={cx(
            "relative overflow-hidden rounded-3xl p-9 md:p-14",
            !backgroundUrl && theme.sectionBg
          )}
        >
                <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                  <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
                </div>

          <div className="relative max-w-xl">
            {/* Same rounded-pill eyebrow badge every other composableElement
                section uses, not the reference mockup's own bare "// tag"
                mono-font label — kept consistent with the rest of the site. */}
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide relative z-2",
                theme.eyebrowBg,
                theme.eyebrowText
              )}
            >
              {eyebrow}
            </span>

            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
                ref={headingRef}
                className={cx(
                  "mt-3.5 text-[26px] leading-[1.18] font-bold tracking-tight sm:text-[32px] md:text-[38px] relative z-2",
                  theme.heading
                )}
              >
                {heading}
              </DynamicHeading>
            )}

            {intro && (
              <div className={cx("rich-text mt-4 text-[15px] leading-relaxed", theme.body)}>
                {intro}
              </div>
            )}
          </div>

          {steps.length > 0 && (
          <div
            ref={rowRef}
            className="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {steps.map((step, index) => (
              <div key={step.title}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "relative p-5 z-2 rounded-2xl border",
                theme?.cardBg ?? "bg-white",
                theme?.cardBorder ?? "border-gray-200",
              )}
              >
                <div
                  data-step-number
                  className={cx("mb-4 inline-block font-mono text-[13px]", theme.accentText)}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <span className={cx("text-[17.5px] font-bold block", theme.heading)}>
                  {step.title}
                </span>

                <p className={cx("mt-2.5 text-[14px] leading-relaxed font-medium", theme.body)}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
