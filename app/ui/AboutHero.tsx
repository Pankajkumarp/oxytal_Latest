"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { MapPin, PlayCircle, Rocket } from "lucide-react";
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
  OfficeSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeAI/HomeTalkToUs use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

type OverviewRow = { key: string; value: string };

type OfficeRow = { country: string; role?: string; flagUrl?: string };

/** Maps a resolved `office` entry (same content type `Footer`'s office list uses) to the plain `OfficeRow` shape this component renders. */
function officeToRow(entry: PlainEntry<OfficeSkeleton>): OfficeRow {
  const flagEntry = entry.fields.flag;

  return {
    country: entry.fields.country,
    role: entry.fields.description,
    flagUrl: isEntry(flagEntry)
      ? getAssetUrl(
        (flagEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/**
 * The About page's hero — a `composableElement` section (`subType:
 * "aboutHero"` — see `ComposableElementRenderer`), split out of
 * `AboutPage` so it's independently Contentful-editable:
 *
 * - the first `dataText` entry among `elements` supplies the breadcrumb/
 *   eyebrow label, the heading, and the lead paragraph (`text`, rich
 *   text) below it
 * - a 2nd `dataText` entry (if present) supplies the "// Company
 *   Overview" card's own label via its `eyebrow` field; a 3rd supplies
 *   "// Office Locations"'s the same way (same "reuse a secondary
 *   dataText" pattern HomeAI's proof callout / HomeTalkToUs's note use)
 * - `dataLink` entries among `elements`: the one with `type: "primary"`
 *   becomes the "Our Story" button, any other becomes the "Start a
 *   Project" link — either is only rendered when that link entry has a
 *   `label`
 * - every `statistic` entry among `elements` becomes one row in the
 *   "Company Overview" card (`label`/`value`)
 * - every `office` entry among `elements` becomes one row in the
 *   "Office Locations" list (`country`/`description`/`flag` — same
 *   content type and fallback-to-pin-icon convention `Footer`'s own
 *   office list uses)
 *
 * Every field above renders exactly what's in Contentful: the eyebrow,
 * the CTAs, the "Company Overview" list, and the "Office Locations"
 * list are each simply omitted when their source entry/field is unset
 * or empty — no invented placeholder eyebrow/copy/stats/offices.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The "Company Overview"/"Office Locations"
 * glass card gets its own scroll-triggered reveal too — a fade + gentle
 * rise + zoom-out (starting at `scale: 1.15` and settling to its normal
 * size) as it scrolls into view. Both are skipped under
 * `prefers-reduced-motion`.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the original
 * dark navy identity from `Refrence/oxytal-about.html` (`bg-[#050e2d]`,
 * cyan accents, the blue CTA gradient), so it looks the same as before
 * this existed until an editor actually sets a `themeColor`. The glow-
 * blob decoration behind the copy stays fixed either way (a subtle,
 * low-opacity flourish, same call every other section's own decorative
 * background makes); `ThemePattern`'s dotted backdrop layers on top of
 * it, themed, same as everywhere else.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling section reads) is an
 * *optional* full-bleed section photo — when set, it replaces the glow
 * blobs entirely and a tint in the resolved (or default dark navy)
 * `theme.sectionBg` color sits over it so the copy stays readable, same
 * "photo wins" convention `HomeAI`/`ContactFaq` use.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutHero({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  // A 2nd/3rd `dataText` entry (if present) supplies the "// Company
  // Overview" / "// Office Locations" card labels via their own
  // `eyebrow` field — same "reuse a secondary dataText" pattern
  // HomeAI's proof callout and HomeTalkToUs's note use.
  const overviewLabelEntry = dataTextEntries[1];
  const officesLabelEntry = dataTextEntries[2];

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLink = linkEntries.find((link) => link.fields.type !== "primary");

  const overviewRows: OverviewRow[] = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map((stat) => ({ key: stat.fields.label, value: stat.fields.value }));

  const officeRows = elements
    .filter(
      (element): element is PlainEntry<OfficeSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "office"
    )
    .map(officeToRow);

  const eyebrow = copy?.fields.eyebrow;
  const heading =
    copy?.fields.heading;
  const overviewLabel = overviewLabelEntry?.fields.eyebrow;
  const officesLabel = officesLabelEntry?.fields.eyebrow;
  const description = copy?.fields.text ? (
    documentToReactComponents(copy.fields.text)
  ) : null;

  const primaryHref = (primaryLink && resolveLinkHref(primaryLink)) ?? "#";
  const primaryLabel = primaryLink?.fields.label;
  const secondaryHref = (secondaryLink && resolveLinkHref(secondaryLink)) ?? "#";
  const secondaryLabel = secondaryLink?.fields.label;

  const overview = overviewRows;
  const offices = officeRows;
  const hasOverviewCard = overview.length > 0 || offices.length > 0;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/button/card colors.
  // `undefined` for an unset or unrecognized value, in which case every
  // themed class below falls back to the mockup's own dark navy identity
  // (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL,
  // same pattern every sibling composableElement section uses. Optional
  // here: no placeholder fallback, so it's simply absent until an editor
  // sets one, in which case the section keeps its plain dark navy
  // background (or `theme.sectionBg`) as before.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/HomeTalkToUs/AboutHero's sibling sections).
     Nothing else in this section animates. Skipped entirely under
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
     CARD REVEAL — the "Company Overview"/"Office Locations" glass card
     fades in with a gentle rise, zooming out from slightly larger
     (`scale: 1.15`) down to its normal size as it scrolls into view.
     Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardRef.current, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 40,
        scale: 1.15,
        opacity: 0,
        duration: 3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-24 lg:py-28",
        !backgroundUrl && (theme?.sectionBg ?? "bg-[#050e2d]")
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
      <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container mx-auto grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        <div className="lg:col-span-7">
          {eyebrow && (
            <div aria-label="breadcrumb">
              <span
                className={cx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase ring-1 ring-white/10",
                  theme?.eyebrowBg ?? "bg-white/10",
                  theme?.eyebrowText ?? "text-cyan-300"
                )}
              >
                {eyebrow}
              </span>
            </div>
          )}

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "mt-6 text-[28px] leading-[1.35] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] max-w-2xl",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>

          <div
            className={cx(
              "rich-text max-w-2xl text-[15.5px] leading-relaxed mt-6",
              theme?.body ?? "text-blue-200/80"
            )}
          >
            {description}
          </div>

          {(primaryLabel || secondaryLabel) && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {primaryLabel && (
                <Link
                  href={primaryHref}
                  className={cx(
                    "inline-flex w-fit min-w-[220px] justify-center items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                    theme?.buttonBg ?? "bg-gradient-to-r from-[#1450d4] to-[#2d7dfa]",
                    theme?.buttonText ?? "text-white",
                    theme?.buttonHoverBg
                  )}
                >
                  <PlayCircle size={16} aria-hidden />
                  {primaryLabel}
                </Link>
              )}
              {secondaryLabel && (
                <Link
                  href={secondaryHref}
                  className={cx(
                    "inline-flex w-fit min-w-[220px] justify-center items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold ring-1 ring-white/25 transition-colors hover:bg-white/5",
                    theme?.heading ?? "text-white",
                    theme ? "hover:ring-current" : "hover:ring-cyan-300"
                  )}
                >
                  <Rocket size={16} aria-hidden />
                  {secondaryLabel}
                </Link>
              )}
            </div>
          )}
        </div>

        {hasOverviewCard && (
          <div className="lg:col-span-5">
            <div
              ref={cardRef}
              className={cx(
                "rounded-2xl p-8 ring-1 ring-white/10 backdrop-blur",
                theme?.cardBg ?? "bg-[#0a2885]/45",
                theme?.cardBorder ?? "border-blue-600",
              )}
            >
              {overview.length > 0 && (
                <>
                  {overviewLabel && (
                    <p
                      className={cx(
                        "text-[14px] font-bold tracking-widest uppercase",
                        theme?.accentText ?? "text-cyan-300"
                      )}
                    >
                      {overviewLabel}
                    </p>
                  )}
                  <dl className="mt-4 divide-y divide-white/10">
                    {overview.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                      >
                        <dt className={cx("text-[13px]", theme?.muted ?? "text-blue-200/70")}>
                          {row.key}
                        </dt>
                        <dd
                          className={cx(
                            "text-[14px] font-bold",
                            theme?.heading ?? "text-white"
                          )}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              {offices.length > 0 && (
                <div
                  className={cx(
                    overview.length > 0 && "mt-5 border-t border-white/10 pt-4"
                  )}
                >
                  {officesLabel && (
                    <p
                      className={cx(
                        "mb-3 text-[14px] font-bold tracking-widest uppercase",
                        theme?.accentText ?? "text-cyan-300"
                      )}
                    >
                      {officesLabel}
                    </p>
                  )}
                  <ul className="flex flex-col gap-2">
                    {offices.map((office) => (
                      <li
                        key={office.country}
                        className={cx(
                          "flex items-center gap-2 text-[13px]",
                          theme?.body ?? "text-blue-100/85"
                        )}
                      >
                        {office.flagUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                          <img
                            src={office.flagUrl}
                            alt=""
                            aria-hidden
                            className="h-3.5 w-3.5 shrink-0 object-cover"
                          />
                        ) : (
                          <MapPin
                            size={14}
                            className={cx("shrink-0", theme?.accentText ?? "text-cyan-300")}
                            aria-hidden
                          />
                        )}
                        <span>
                          {office.country}
                          {office.role && (
                            <span className={theme?.muted ?? "text-blue-200/60"}>
                              {" "}
                              — {office.role}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
