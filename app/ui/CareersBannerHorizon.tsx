"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight } from "lucide-react";
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

/** Placeholder roster, used only when `elements` has no `statistic` entries yet — same "empty until an editor adds entries" convention `CareersPage`'s own rosters use on this same page. */
const DEFAULT_STATS: StatItem[] = [];

/**
 * The `/careers` page's top banner — a `composableElement` section
 * (`subType: "careersBanner"` — see `ComposableElementRenderer`), ported
 * from `Refrence/careers-banner-horizon.html`'s clean "horizon line"
 * design: a pulsing "we're hiring" eyebrow, a large heading with a
 * trailing accent-colored highlight, a lead paragraph, a primary/
 * secondary CTA pair, a two-tone gradient divider, and a stat row —
 * deliberately a different visual identity from `CareersPage`'s own
 * cork-board/pinned-note aesthetic immediately below it on the same
 * page, matching the reference's own distinct "banner" design rather
 * than reusing the cork-board's look.
 *
 * - the first `dataText` entry supplies the eyebrow, the heading, and
 *   its trailing `highlightText` (rendered in the section's own accent
 *   color — e.g. heading "Build what's next," + highlightText "with
 *   us"), plus the lead paragraph (`text`, rich text)
 * - `dataLink` entries: the one with `type: "primary"` becomes "View
 *   open roles", any other becomes "See our culture"
 * - every `statistic` entry becomes one stat cell (`value`/`label`) in
 *   the row below the gradient divider
 *
 * Falls back to the reference mockup's own copy for the scalar text
 * fields, and to an empty stat row (same convention `CareersPage`'s own
 * rosters use) when no `statistic` entries are set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own cream/indigo identity. The composableElement's own `backgroundImage`
 * field is an optional full-bleed photo, same convention as every
 * sibling section. The gradient divider (indigo → orange) stays a fixed
 * decorative flourish regardless of theme, same "signature flourish
 * stays fixed" convention `CareersPage`'s own red pin dot uses.
 *
 * The heading (including its highlighted trailing span) gets the same
 * GSAP split-text word reveal every hero on this site uses, running on
 * load rather than scroll since this is the very top of the page.
 * Skipped entirely under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function CareersBannerHorizon({ entry }: Props) {
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
  const secondaryLink = linkEntries.find((link) => link !== primaryLink);

  const statEntries = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map((stat) => ({ value: stat.fields.value, label: stat.fields.label }));
  const stats = statEntries.length ? statEntries : DEFAULT_STATS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const highlightText = copy?.fields.highlightText;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  // No fallback label/href here — each button only renders at all when
  // its own `dataLink` resolves to a real href (see the JSX below), so
  // there's nothing to fall back to; `label` is a required field on
  // `dataLink`, guaranteed present whenever the link itself is.
  const primaryHref = primaryLink ? resolveLinkHref(primaryLink) : undefined;
  const secondaryHref = secondaryLink ? resolveLinkHref(secondaryLink) : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "indigo" — see
  // app/lib/theme.ts) to this section's text/button colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the reference mockup's own cream/indigo identity.
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL, same
  // pattern every sibling composableElement section uses.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading (including its highlighted trailing
     span) splits into words and rises in as soon as it mounts, same GSAP
     split-text vocabulary every other hero's own top heading uses — no
     scroll trigger, since this banner sits right at the top of the page,
     already in view on first paint. Skipped entirely under
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
        "relative overflow-hidden pt-20 pb-12 md:pt-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-[#FBF9F3]")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        {/* Same rounded-pill eyebrow badge (with pulsing dot) every other
            composableElement section's own eyebrow uses, not the
            reference mockup's own bespoke indigo pill — kept consistent
            with the rest of the site. Only rendered when `eyebrow` is
            actually set — no empty pill otherwise. */}
        {eyebrow && (
          <span
            className={cx(
              "inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-[#ECEAFC]",
              theme?.eyebrowText ?? "text-[#4F46E5]"
            )}
          >
            {/* Fixed indigo regardless of theme — this banner's own
                signature decorative pulse, same "flourish stays fixed"
                convention every other section's own decorative accents
                use (see app/lib/theme.ts). */}
            <span
              aria-hidden
              className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-[#4F46E5]"
            />
            {eyebrow}
          </span>
        )}

        {heading && (
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "mt-7 max-w-2xl text-[34px] leading-[1.2] font-extrabold tracking-tight sm:text-[46px] md:text-[58px]",
              theme?.heading ?? "text-[#151A2D]"
            )}
          >
            {heading}{" "}
            {highlightText && (
              <span className={theme?.accentText ?? "text-[#4F46E5]"}>{highlightText}</span>
            )}
          </DynamicHeading>
        )}

        {description && (
          <div
            className={cx(
              "rich-text mt-5 max-w-2xl text-[16.5px] leading-relaxed",
              theme?.body ?? "text-[#5B6270]"
            )}
          >
            {description}
          </div>
        )}

        {(primaryHref || secondaryHref) && (
          <div className="mt-8 flex flex-wrap items-center gap-6">
            {/* Same rounded-full pill button (shadow + hover-lift) every
                other composableElement section's primary CTA uses. Only
                rendered when `primaryLink` resolves to a real href —
                no button pointing nowhere. */}
            {primaryLink && primaryHref && (
              <Link
                href={primaryHref}
                className={cx(
                  "inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme?.buttonBg ?? "bg-[#4F46E5]",
                  theme?.buttonText ?? "text-white",
                  theme?.buttonHoverBg ?? "hover:bg-[#4338CA]"
                )}
              >
                {primaryLink.fields.label}
                <ArrowRight size={15} aria-hidden />
              </Link>
            )}
            {secondaryLink && secondaryHref && (
              <Link
                href={secondaryHref}
                className={cx(
                  "border-b-[1.5px] pb-0.5 text-[14.5px] font-semibold transition-colors",
                  theme?.body ?? "border-[#EDEAE1] text-[#5B6270]",
                  theme ? "hover:opacity-70" : "hover:text-[#151A2D]"
                )}
              >
                {secondaryLink.fields.label}
              </Link>
            )}
          </div>
        )}

        {/* =================================================
            HORIZON LINE — a fixed two-tone gradient divider, this
            banner's own signature flourish (same "stays fixed
            regardless of theme" convention as the eyebrow dot above).
        ================================================= */}
        <div
          aria-hidden
          className="mt-16 h-[2px] w-full bg-gradient-to-r from-[#4F46E5] to-[#F0921E]"
        />

        {/* =================================================
            STAT ROW
        ================================================= */}
        {stats.length > 0 && (
          <div className="flex flex-wrap justify-between gap-7 py-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2.5">
                <span className={cx("text-[26px] font-extrabold", theme?.heading ?? "text-[#151A2D]")}>
                  {stat.value}
                </span>
                <span
                  className={cx(
                    "text-[13px] font-semibold tracking-wide uppercase",
                    theme?.muted ?? "text-[#8A90A0]"
                  )}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
