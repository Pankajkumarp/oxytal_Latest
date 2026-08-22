"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  TechnologySkeleton,
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

/**
 * Parses a leading "N / total" pattern out of the eyebrow text (e.g.
 * "Service 2 / 6") to drive the progress-dots indicator, instead of a
 * dedicated Contentful field — the eyebrow's own display text already
 * carries this information, so there's nothing to keep in sync. Returns
 * `null` when the eyebrow doesn't match, in which case the dots simply
 * don't render.
 */
function parseProgress(eyebrow: string): { current: number; total: number } | null {
  const match = eyebrow.match(/(\d+)\s*\/\s*(\d+)/);

  if (!match) {
    return null;
  }

  return { current: Number(match[1]), total: Number(match[2]) };
}

/**
 * The `/service/<slug>` detail pages' hero — a `composableElement`
 * section (`subType: "serviceHero"` — see `ComposableElementRenderer`),
 * ported from `Refrence/serviceDetail/service-0N-*.html`'s own `.hero`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow
 *   (`eyebrow`, e.g. "Service 2 / 6" — also parsed for the progress-dots
 *   indicator, see `parseProgress`) and the `h1` (`heading`)
 * - a 2nd `dataText` entry supplies the highlighted one-line statement
 *   below the `h1` (its own `eyebrow`, e.g. "Improve customer experience
 *   and usability") and the longer lead paragraph under it (`text`, rich
 *   text) — same "reuse a secondary dataText" pattern AboutHero/HomeAI
 *   use for a second piece of copy
 * - `dataLink` entries: the one with `type: "primary"` becomes the solid
 *   "Talk to Oxytal AI Lab" button, any other becomes the "See what's
 *   included" text link
 * - every `technology` entry among `elements` becomes one tag pill
 *   (`name` only — logo/website/category unused here), same reuse
 *   `AISolutionsTechStack` makes of this content type
 *
 * Falls back to a generic placeholder hero when the corresponding
 * entries aren't set yet — there's no single "reference" service this
 * page defaults to, unlike `AISolutionsHero`.
 *
 * The "← All services" back link and the milestone diagram below the
 * CTAs are this section's own fixed chrome, not content-driven — the
 * diagram is a decorative illustration (a generic progress/milestone
 * line), identical on every instance, same "flourish stays fixed"
 * convention every other section's own decorative background uses.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * defaults to the `darkyellow` preset (the `/services` mockup's own
 * dark/amber identity — see app/lib/theme.ts) rather than the site's
 * usual light default, matching `Refrence/serviceDetail`'s own look. The
 * composableElement's own `backgroundImage` field is an optional
 * full-bleed section photo, same "photo wins" treatment every sibling
 * composableElement section uses.
 *
 * Animation: the `h1` gets the same GSAP split-text reveal every other
 * section's top heading uses, on mount rather than scroll-in since the
 * hero is already in view on first paint (same as `AISolutionsHero`).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ServiceDetailHero({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const titleCopy = dataTextEntries[0];
  const leadCopy = dataTextEntries[1];

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLink = linkEntries.find((link) => link.fields.type !== "primary");

  const tags = elements
    .filter(
      (element): element is PlainEntry<TechnologySkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "technology"
    )
    .map((tech) => tech.fields.name);

  const eyebrow = titleCopy?.fields.eyebrow ?? "Service";
  const heading = titleCopy?.fields.heading;
  const statement = leadCopy?.fields.eyebrow;
  const body: ReactNode = leadCopy?.fields.text
    ? documentToReactComponents(leadCopy.fields.text)
    : null;

  const progress = parseProgress(eyebrow);

  const primaryHref = (primaryLink && resolveLinkHref(primaryLink)) ?? "/contact-us";
  const primaryLabel = primaryLink?.fields.label;
  const secondaryHref = (secondaryLink && resolveLinkHref(secondaryLink)) ?? "#includes";
  const secondaryLabel = secondaryLink?.fields.label;

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Un-themed, this defaults to the `darkyellow` preset (the `/services`
  // mockup's own dark/amber identity) rather than the site's usual light
  // default — an explicit `themeColor` still wins when an editor sets
  // one, same convention `AISolutionsProcess`'s "navy" default uses.
  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("darkyellow")!;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

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
        !backgroundUrl && theme.sectionBg
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
        {backgroundUrl && <div className={cx("absolute inset-0 opacity-85", theme.sectionBg)} />}
      </div>

      <div className="container mx-auto px-5 pt-8 pb-16 md:px-10 md:pt-24 md:pb-24">
        <Link
          href="/services"
          className={cx(
            "inline-flex items-center gap-2 text-[13.5px] font-semibold transition-colors",
            theme.muted,
            "hover:opacity-70"
          )}
        >
          <ArrowLeft size={13} aria-hidden />
          All services
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-3.5">
          <span
            className={cx(
              "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
              theme.eyebrowBg,
              theme.eyebrowText
            )}
          >
            {eyebrow}
          </span>

          {progress && (
            // Fixed gold/dim-white regardless of theme — a small
            // decorative indicator, same "flourish stays fixed"
            // convention the milestone diagram below uses (rather than
            // deriving a background-color class from `theme.accentText`
            // at runtime, which Tailwind's static scanner can't discover
            // — see the `gridColsClass` comment in Navbar.tsx for the
            // same constraint).
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: progress.total }, (_, i) => (
                <span
                  key={i}
                  className={cx(
                    "h-1.5 w-1.5 rounded-full",
                    i < progress.current ? "bg-[#F0B94A]" : "bg-white/15"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {heading && (
          <DynamicHeading level={resolveHeadingLevel(titleCopy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "mt-6 max-w-3xl text-[32px] leading-[1.08] font-bold tracking-tight sm:text-[42px] md:text-[54px]",
              theme.heading
            )}
          >
            {heading}
          </DynamicHeading>
        )}

        {statement && (
          <p
            className={cx(
              "mt-5 max-w-xl text-[19px] leading-snug font-semibold sm:text-[22px]",
              theme.accentText
            )}
          >
            {statement}
          </p>
        )}

        {body && (
          <div className={cx("rich-text mt-4 max-w-xl text-[16px] leading-relaxed", theme.body)}>
            {body}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cx(
                  "rounded-full border px-4 py-2 text-[13px] font-semibold",
                  theme.cardBorder,
                  theme.body
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-6">
          {primaryLabel && (
            <a
              href={primaryHref}
              className={cx(
                "inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                theme.buttonBg,
                theme.buttonText,
                theme.buttonHoverBg
              )}
            >
              {primaryLabel}
              <ArrowRight size={15} aria-hidden />
            </a>
          )}
          {secondaryLabel && (
            <Link
              href={secondaryHref}
              className={cx(
                "border-b pb-0.5 text-[14px] font-semibold transition-opacity hover:opacity-70",
                theme.muted,
                theme.cardBorder
              )}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>

        {/* =================================================
            MILESTONE DIAGRAM — this section's own signature
            decoration; not content-driven, identical on every instance
            (same "flourish stays fixed" convention every other
            section's own decorative background uses).
        ================================================= */}
        <div
          className={cx(
            "mt-12 overflow-hidden rounded-[20px] border py-10 px-2",
            theme.cardBorder,
            theme.cardBg
          )}
        >
          <svg
            viewBox="0 0 800 180"
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto w-full max-w-[720px] mx-auto"
            role="img"
            aria-label="A milestone timeline running from discovery to delivery"
          >
            <line x1="40" y1="110" x2="760" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            <line x1="40" y1="110" x2="600" y2="110" stroke="#F0B94A" strokeWidth="2.4" />
            <g fill="rgba(255,255,255,0.5)">
              <circle cx="200" cy="110" r="5" />
              <circle cx="360" cy="110" r="5" />
              <circle cx="520" cy="110" r="5" />
            </g>
            <circle cx="40" cy="110" r="8" fill="#F0B94A" />
            <circle cx="600" cy="110" r="18" fill="#0B0B0C" stroke="#F0B94A" strokeWidth="2.4" />
            <path d="M591 110l6 6 12-13" stroke="#F0B94A" strokeWidth="2.4" fill="none" />
            <text x="40" y="145" fill="#6E6E73" fontFamily="monospace" fontSize="12">
              Discovery
            </text>
            <text x="555" y="145" fill="#E3A63E" fontFamily="monospace" fontSize="12">
              Delivered
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
