"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Cloud, HeartHandshake, Target, Zap, type LucideIcon } from "lucide-react";
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

interface ApproachItem {
  id: string;
  num: string;
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set — same pattern HomeServices/AboutServices use. */
const FALLBACK_ICONS: LucideIcon[] = [Target, HeartHandshake, Cloud, Zap];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 4-card grid. */
const DEFAULT_APPROACH: ApproachItem[] = [];

/** Maps a resolved `contentDetail` entry (plus its array position) to one `ApproachItem` — `title`/`shortDescription` as the name/description, `icon` (falls back to a cycled Lucide icon) as the glyph, the array position (zero-padded) as the step number. */
function contentDetailToApproachItem(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): ApproachItem {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  return {
    id: entry.sys.id,
    num: String(index + 1).padStart(2, "0"),
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
  };
}

/** The mockup's own dark navy gradient — used as the un-themed default background, same identity `AboutHero` uses on its own section. */
const NAVY_GRADIENT = "linear-gradient(160deg, #050e2d, #0a2885 55%, #081a5a)";

/**
 * The About page's "Approach" section — a `composableElement` section
 * (`subType: "aboutApproach"` — see `ComposableElementRenderer`), split
 * out of `AboutPage` the same way `AboutHero`/`AboutStats`/`AboutStory`/
 * `AboutServices` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one step card
 *   (via `contentDetailToApproachItem`) — `title`/`shortDescription` as
 *   the name/description, `icon` (falls back to a cycled Lucide icon) as
 *   the glyph, and its position in `elements` (zero-padded, e.g. "01")
 *   as the step number; add/remove/reorder `contentDetail` entries in
 *   Contentful to change the roster, nothing here needs to change
 *
 * Every field above renders exactly what's in Contentful: the eyebrow
 * is simply omitted when unset, and the step grid only renders the
 * `contentDetail` entries that actually exist — no invented placeholder
 * steps.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * dark navy gradient (`NAVY_GRADIENT`) with white/cyan text, so it
 * renders the same as before this existed until an editor sets a
 * `themeColor` (which then replaces the gradient with a flat
 * `theme.sectionBg`).
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field AboutHero/AboutStats/AboutStory/
 * AboutServices use) is an *optional* full-bleed section background —
 * wins over both the gradient and the theme when set. `ThemePattern`'s
 * dotted backdrop only renders when there's no background photo, same
 * call `AboutStats`/`AboutStory`/`AboutServices` make.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The step cards get their own scroll-triggered
 * load animation too — distinct from every sibling section's fade+rise
 * or flip: cards alternate their entrance direction by position, odd
 * ones sliding in from the left and even ones from the right (plus a
 * scale-up from 0.9 and a fade), staggered one after another, giving the
 * grid a "staircase" feel that fits the numbered-steps framing. Cards
 * also get their own GSAP hover, distinct from every sibling section's
 * lift/tilt/pulse/flip treatments: a soft radial "spotlight" follows the
 * cursor around inside the card, and the icon gives a quick elastic
 * "pop" (`handleCardEnter`/`handleCardMove`/`handleCardLeave`). Both are
 * skipped under `prefers-reduced-motion` (cards keep their plain CSS
 * `hover:bg-white/10` swap in that case).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutApproach({ entry }: Props) {
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
    .map((detailEntry, index) => contentDetailToApproachItem(detailEntry, index));

  const eyebrow = copy?.fields.eyebrow ;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const steps = contentDetailSteps.length ? contentDetailSteps : DEFAULT_APPROACH;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own dark navy gradient + white/cyan
  // text (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern AboutHero/AboutStats/AboutStory/AboutServices use). Optional
  // here: no placeholder fallback, so it's simply absent until an editor
  // sets one — wins over both the gradient and the theme when set.
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
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/AboutHero/AboutStory/AboutServices). Nothing
     else in this section animates. Skipped entirely under
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
     CARD REVEAL — distinct from every sibling section's fade+rise or
     flip: cards alternate their entrance direction by position (odd
     from the left, even from the right) with a scale-up from 0.9 and a
     fade, staggered one at a time as the grid scrolls into view.
     Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, x: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(cardsRef.current!.children);

      cards.forEach((card, index) => {
        gsap.from(card, {
          x: index % 2 === 0 ? -70 : 70,
          scale: 0.9,
          opacity: 0,
          duration: 0.8,
          delay: index * 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     HOVER — distinct from every sibling section's lift/tilt/pulse/flip
     treatments: a soft radial "spotlight" follows the cursor around
     inside the card (a flashlight-over-a-dark-card feel), while the icon
     gives a quick elastic "pop". GSAP rather than CSS because the
     spotlight position updates continuously from `onMouseMove` (a CSS
     transition can't track a moving point) and the icon's elastic
     overshoot isn't expressible as a single CSS easing. Skipped under
     prefers-reduced-motion — the card keeps its plain CSS
     `hover:bg-white/10` swap in that case.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-approach-icon]");
    const spotlight = card.querySelector<HTMLElement>("[data-approach-spotlight]");

    if (icon) {
      gsap.to(icon, { scale: 1.18, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    }
    if (spotlight) {
      gsap.to(spotlight, { opacity: 1, duration: 0.35, ease: "power2.out" });
    }
  };

  const handleCardMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const spotlight = card.querySelector<HTMLElement>("[data-approach-spotlight]");
    if (!spotlight) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    spotlight.style.background = `radial-gradient(220px circle at ${x}px ${y}px, rgb(196 187 236 / 36%), transparent 65%)`;
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-approach-icon]");
    const spotlight = card.querySelector<HTMLElement>("[data-approach-spotlight]");

    if (icon) {
      gsap.to(icon, { scale: 1, duration: 0.4, ease: "power2.out" });
    }
    if (spotlight) {
      gsap.to(spotlight, { opacity: 0, duration: 0.4, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="approach"
      aria-labelledby="approach-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
      )}
      style={backgroundStyle}
    >

          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container relative mx-auto px-5 md:px-10">
        <div className="max-w-xl">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-white/10",
                theme?.eyebrowText ?? "text-cyan-300"
              )}
            >
              {eyebrow}
            </span>
          )}
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            id="approach-heading"
            className={cx(
              "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>
          <div
            className={cx(
              "rich-text mt-4 text-[15px] leading-relaxed",
              theme?.body ?? "text-blue-200/75"
            )}
          >
            {description}
          </div>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <div
                key={step.id}
                onMouseEnter={handleCardEnter}
                onMouseMove={handleCardMove}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "relative overflow-hidden rounded-2xl p-7 border ring-1 ring-white/10  z-1",
                  theme?.cardBg ?? "bg-white/5",
                  theme?.cardBorder ?? "border-blue-600",
                )}
              >
                <span
                  data-approach-spotlight
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0"
                />
                <p
                  className={cx(
                    "font-mono text-[11px] font-bold tracking-widest uppercase",
                    theme?.accentText ?? "text-cyan-300"
                  )}
                >
                  {step.num}
                </p>
                <div
                  data-approach-icon
                  className="mt-4 flex h-12 w-12 items-center justify-center text-white"
                >
                  {step.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={step.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-15 w-15 object-contain"
                    />
                  ) : (
                    <FallbackIcon size={20} aria-hidden />
                  )}
                </div>
                <h3
                  className={cx(
                    "mt-4 text-[15px] font-bold",
                    theme?.heading ?? "text-white"
                  )}
                >
                  {step.title}
                </h3>
                <p
                  className={cx(
                    "mt-1.5 text-[13.5px] leading-relaxed",
                    theme?.body ?? "text-blue-200/70"
                  )}
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
