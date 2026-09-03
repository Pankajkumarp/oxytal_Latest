"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, CheckCircle2, Cpu, Database, ShieldCheck } from "lucide-react";
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
  DataLinkSkeleton,
  DataTextSkeleton,
  ServiceCardSkeleton,
  StatisticSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution every other composableElement section uses. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface StatItem {
  value: string;
  label: string;
}

/** Placeholder roster, used only when `elements` has no `statistic` entries yet — ported from Refrence/ai-solutions.html's own stat strip. */
const DEFAULT_STATS: StatItem[] = [];

interface FlowStep {
  title: string;
  description?: string;
  /** Resolved image URL from the `serviceCard`'s `heroImage` field — same field/resolution `HomeServices` uses for its own card banners. Falls back to a tinted `FLOW_FALLBACK_ICONS` glyph when unset. */
  heroImageUrl?: string;
}

/** Cycled by slot index as a fallback when a slot's `serviceCard` has no `heroImage` set. */
const FLOW_FALLBACK_ICONS = [Database, Cpu, ShieldCheck, CheckCircle2];

/**
 * The `/ai-solutions` page's hero — a `composableElement` section
 * (`subType: "aiHero"` — see `ComposableElementRenderer`), ported from
 * `Refrence/ai-solutions.html`'s `.hero` section:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow
 *   (`eyebrow`), the `h1` (`heading`), and the lead paragraph below it
 *   (`text`, rich text)
 * - `dataLink` entries: the one with `type: "primary"` becomes the solid
 *   "Talk to our team" button, any other becomes the plain-text
 *   "See it in production" link
 * - every `statistic` entry among `elements` becomes one cell of the stat
 *   strip below the signal-flow diagram (`value` as the big number,
 *   `label` as its caption) — add/remove/reorder `statistic` entries in
 *   Contentful to change the roster
 *
 * `DEFAULT_STATS` is an empty roster, so the stat strip renders no cells
 * until `statistic` entries exist; `heading`/`description` render only
 * when the `dataText` entry actually has them set (no invented hero
 * copy). `eyebrow` still falls back to "AI SOLUTIONS" (a short
 * structural section tag, not authored marketing copy) when unset.
 *
 * The signal-flow row (raw input → model → rules & checks → action taken)
 * is a row of simple bordered boxes, each showing an image banner, a
 * title, and a short description, connected left-to-right by a thin
 * line — the content for each box comes from the `serviceCard` entries
 * among `elements`, positionally in order (`title` for the box's
 * heading, `shortDescription` for the body copy, `heroImage` for the
 * banner image, falling back to a tinted block with one of
 * `FLOW_FALLBACK_ICONS` when unset) — same "reuse serviceCard"
 * convention `AISolutionsProcess`/`AISolutionsCapabilities` use, and the
 * same `heroImage` field `HomeServices`' own cards use for their banner
 * (not `icon`, which is a plain text field in Contentful rather than an
 * image link, so it can't resolve to a URL). The row renders nothing
 * until at least one `serviceCard` entry exists. Add/reorder
 * `serviceCard` entries in Contentful (ahead of any `statistic` entries,
 * which map to the stat strip below instead) to change the row's
 * content.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * section defaults to the reference mockup's own light navy-on-white
 * identity rather than the site's usual emerald palette, so it renders
 * unchanged until an editor sets a `themeColor`. The composableElement's
 * own `backgroundImage` field is an optional full-bleed section photo —
 * when set, it covers the section with a light scrim so the copy stays
 * readable, same "photo wins" treatment every sibling composableElement
 * section uses.
 *
 * Animation: the `h1` gets the same GSAP split-text reveal every other
 * section's top heading uses (sliding/fading each word in as the page
 * loads, since the hero is above the fold on first paint rather than
 * scrolled into view); the eyebrow dot has its own always-on CSS pulse;
 * on hover, each signal-flow box lifts slightly with a soft shadow while
 * its image zooms in a bit more inside it; and each stat-strip cell grows
 * an accent-colored rule in along its bottom edge and pops its number
 * slightly on hover (a lift/shadow doesn't work there — those cells sit
 * flush against each other sharing borders, same constraint
 * `AISolutionsDifferentiators`' own flush grid has). All of this is plain
 * CSS `hover`/`group-hover` transitions, not GSAP, since there's no
 * per-item ref to animate against (every one of these is plain inline
 * JSX rather than its own component, unlike e.g. `HomeServices`' GSAP-
 * driven card hover).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsHero({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLink = linkEntries.find((link) => link.fields.type !== "primary");

  const statEntries = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map((stat) => ({ value: stat.fields.value, label: stat.fields.label }));
  const stats = statEntries.length ? statEntries : DEFAULT_STATS;

  const flowStepEntries = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map((stepEntry): FlowStep => {
      const heroImageEntry = stepEntry.fields.heroImage;

      return {
        title: stepEntry.fields.title ?? "",
        description: stepEntry.fields.shortDescription,
        heroImageUrl: isEntry(heroImageEntry)
          ? getAssetUrl(
              (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>)
                .fields.image
            )
          : undefined,
      };
    });
  const flowSteps: FlowStep[] = flowStepEntries;

  const eyebrow = copy?.fields.eyebrow ?? "AI SOLUTIONS";
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const primaryHref = (primaryLink && resolveLinkHref(primaryLink)) ?? "/contact-us";
  const primaryLabel = primaryLink?.fields.label;
  const secondaryHref = (secondaryLink && resolveLinkHref(secondaryLink)) ?? "#work";
  const secondaryLabel = secondaryLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling composableElement section uses).
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "navy" — see
  // app/lib/theme.ts) to this section's text/button/card colors.
  // `undefined` for an unset or unrecognized value, in which case every
  // themed class below falls back to the reference mockup's own light
  // navy-on-white identity (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* =========================================================
     TOP HEADING REVEAL — the h1 splits into words and rises in as soon
     as it mounts (not on scroll — the hero is already in view on first
     paint), same GSAP split-text vocabulary every other section's own
     heading uses. Skipped entirely under prefers-reduced-motion.
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
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

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

      <div className="container mx-auto px-5 pt-14 pb-16 md:px-10 md:pt-20 md:pb-24">
        {/* Same rounded-pill eyebrow badge every other composableElement
            section uses (AboutHero, HomeAI, ContactFaq, …), not the
            reference mockup's own bordered/mono-font treatment — kept
            consistent with the rest of the site rather than this one
            page's source mockup. */}
        <span
          className={cx(
            "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide relative z-2",
            theme?.eyebrowBg ?? "bg-blue-50",
            theme?.eyebrowText ?? "text-blue-700"
          )}
        >
          {/* Fixed cyan regardless of theme — a small decorative pulse,
              same "flourish stays fixed" convention every other
              section's own decorative accents use (see app/lib/theme.ts). */}
          <span
            aria-hidden
            className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-[#00C2B2]"
          />
          {eyebrow}
        </span>

        {heading && (
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "mt-6 max-w-3xl text-[28px] leading-[1.2] font-bold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-[#0B1730]"
            )}
          >
            {heading}
          </DynamicHeading>
        )}

        {description && (
          <div
            className={cx(
              "rich-text mt-6 max-w-xl text-[15px] leading-relaxed",
              theme?.body ?? "text-[#4A5570]"
            )}
          >
            {description}
          </div>
        )}

        {(primaryLabel || secondaryLabel) && (
          <div className="mt-9 flex flex-wrap items-center gap-6">
            {/* Same rounded-full pill button (shadow + hover-lift) every
                other composableElement section's primary CTA uses
                (AboutHero, HomeAI, HomeCaseStudies, …), not the reference
                mockup's own sharp-cornered button. */}
            {primaryLabel && (
              <Link
                href={primaryHref}
                className={cx(
                  "inline-flex w-fit relative z-2 items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme?.buttonBg ?? "bg-[#2F5CFF]",
                  theme?.buttonText ?? "text-white",
                  theme?.buttonHoverBg ?? "hover:bg-[#1E3FCC]"
                )}
              >
                {primaryLabel}
                <ArrowRight size={15} aria-hidden />
              </Link>
            )}
            {secondaryLabel && (
              <Link
                href={secondaryHref}
                className={cx(
                  "text-[14.5px] font-semibold transition-colors relative z-2",
                  theme?.body ?? "text-[#4A5570]",
                  theme ? "hover:opacity-70" : "hover:text-[#0B1730]"
                )}
              >
                {secondaryLabel} →
              </Link>
            )}
          </div>
        )}

        {/* =================================================
            SIGNAL-FLOW ROW — a simple box per step (icon, title,
            description), connected left-to-right by a thin line. See
            `flowSteps`/`FLOW_FALLBACK_ICONS` above for where the content
            and fallback icons come from. Renders nothing until at least
            one `serviceCard` entry exists.
        ================================================= */}
        {flowSteps.length > 0 && (
        <div className="relative z-2 mt-14 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-0">
          {flowSteps.flatMap((step, index) => {
            const FallbackIcon = FLOW_FALLBACK_ICONS[index % FLOW_FALLBACK_ICONS.length];

            const box = (
              <div
                key={`box-${index}`}
                className={cx(
                  "group flex-1 overflow-hidden rounded-2xl border text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg",
                  theme?.cardBorder ?? "border-gray-200",
                  theme?.cardBg ?? "bg-[#F5F7FC]"
                )}
              >
                {/* Hero image banner — the `serviceCard`'s own `heroImage`
                    (same field `HomeServices` cards use for their banner),
                    falling back to a tinted block with a fixed Lucide
                    glyph when unset. The outer frame clips to a fixed
                    square so the zoom-on-hover below stays contained
                    inside it, instead of bleeding into the title/
                    description underneath. */}
                <div className="mx-auto aspect-[1254/1254] w-[225px] overflow-hidden">
                  <div
                    className={cx(
                      "flex h-full w-full items-center justify-center bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110",
                      !step.heroImageUrl && (theme?.eyebrowBg ?? "bg-white")
                    )}
                    style={
                      step.heroImageUrl
                        ? { backgroundImage: `url(${step.heroImageUrl})` }
                        : undefined
                    }
                  >
                    {!step.heroImageUrl && (
                      <FallbackIcon
                        size={30}
                        strokeWidth={1.8}
                        className={theme?.accentText ?? "text-[#2F5CFF]"}
                        aria-hidden
                      />
                    )}
                  </div>
                </div>

                <div className="p-6 pt-2">
                  <span
                    className={cx(
                      "text-[15px] font-bold block",
                      theme?.heading ?? "text-[#0B1730]"
                    )}
                  >
                    {step.title}
                  </span>

                  {step.description && (
                    <p
                      className={cx(
                        "mt-2 text-[13px] leading-relaxed",
                        theme?.body ?? "text-[#4A5570]"
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );

            if (index === flowSteps.length - 1) {
              return [box];
            }

            // The connecting line between this box and the next — only
            // shown once the row lays out side-by-side (`lg:`); the
            // stacked mobile layout has no gap for a line to fill.
            const line = (
              <div
                key={`line-${index}`}
                aria-hidden
                className="hidden shrink-0 items-center justify-center lg:flex lg:w-10"
              >
                <span
                  className="h-px w-full"
                  style={{ backgroundColor: theme?.patternColor ?? "#2F5CFF" }}
                />
              </div>
            );

            return [box, line];
          })}
        </div>
        )}

        {/* =================================================
            STAT STRIP
        ================================================= */}
        <div
          className={cx(
            "mt-16 grid grid-cols-2 border-t border-b sm:grid-cols-4",
            theme?.cardBorder ?? "border-gray-200"
          )}
        >
          {stats.map((stat, index) => {
            // Right border: on mobile's 2-col grid, the left column
            // (even index) gets one, the right column doesn't; on
            // desktop's 4-col row, every cell but the last one does.
            const isRightColMobile = index % 2 === 1;
            const isLastOverall = index === stats.length - 1;
            // Bottom border: only mobile's non-last row needs one (the
            // desktop row never does) — with an odd count, the final
            // single cell counts as its own last row.
            const isLastRowMobile =
              index >= stats.length - (stats.length % 2 === 0 ? 2 : 1);

            return (
              <div
                key={stat.label}
                className={cx(
                  "group relative z-2 overflow-hidden px-6 py-7",
                  theme?.cardBorder ?? "border-gray-200",
                  theme?.cardBg ?? "bg-[#F5F7FC]",
                  !isRightColMobile && "border-r",
                  !isLastRowMobile && "border-b sm:border-b-0",
                  isLastOverall ? "sm:border-r-0" : "sm:border-r"
                )}
              >
                <div
                  className={cx(
                    "font-sans text-[28px] font-bold transition-transform duration-300 ease-out group-hover:scale-105",
                    theme?.heading ?? "text-[#0B1730]"
                  )}
                >
                  {stat.value}
                </div>
                <div
                  className={cx(
                    "mt-1.5 text-[12.5px] leading-tight font-semibold",
                    theme?.body ?? "text-[#4A5570]"
                  )}
                >
                  {stat.label}
                </div>

                {/* Accent rule — hidden (scaleX 0) until hover grows it in
                    from the left along the cell's bottom edge, same
                    "flush-grid cell" hover treatment `AISolutionsDifferentiators`
                    uses (a lift/shadow doesn't work here since these cells
                    sit flush against each other, borders shared). */}
                <span
                  aria-hidden
                  style={{ backgroundColor: theme?.patternColor ?? "#2F5CFF" }}
                  className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
