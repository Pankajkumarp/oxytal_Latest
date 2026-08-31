"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import AIPipelineDemo from "./AIPipelineDemo";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface GroupItem {
  name: string;
  description: string;
}

interface Group {
  label: string;
  items: GroupItem[];
}

/**
 * Maps each `contentDetail` entry to one `Group`: the entry's own `title`
 * is the group label (e.g. "What we build"), and every `statistic` entry
 * in its `statistics` array becomes one item — `statistic.label` as the
 * item name, `statistic.value` as the item description. Reuses
 * `contentDetail` + `statistic` instead of dedicated content types.
 */
function groupContentDetails(
  entries: PlainEntry<ContentDetailSkeleton>[]
): Group[] {
  return entries.map((entry) => ({
    label: entry.fields.title ?? "",
    items: (entry.fields.statistics ?? [])
      .filter(isEntry)
      .map((stat) => {
        const statistic = stat as unknown as PlainEntry<StatisticSkeleton>;

        return {
          name: statistic.fields.label,
          description: statistic.fields.value,
        };
      }),
  }));
}

/**
 * "AI & Agentic Engineering", rendered from a `composableElement` entry
 * (`subType: "ai"` — see `ComposableElementRenderer`):
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading/description intro copy
 * - a second `dataText` entry (if present) supplies the "proof" callout:
 *   its `eyebrow` becomes the small tag (e.g. "This isn't theory"), its
 *   `text` becomes the description (rich text, so bold emphasis can be
 *   authored directly in Contentful)
 * - `dataLink` entries among `elements` become the footer's two links:
 *   the one with `type: "primary"` renders as the solid CTA button, any
 *   other renders as the text link
 * - every `contentDetail` entry among `elements` becomes one group (its
 *   `title` is the group label), and every `statistic` entry in that
 *   `contentDetail`'s `statistics` array becomes one item within that
 *   group (via `groupContentDetails`) — `label` as the item name,
 *   `value` as the item description. Add/remove `contentDetail`/
 *   `statistic` entries in Contentful to change the roster, nothing
 *   here needs to change
 *
 * Every field above renders exactly what's in Contentful — an unset
 * eyebrow/heading/description/proof tag/proof description/link label
 * simply renders nothing (no hardcoded placeholder copy), and an empty
 * `contentDetail` roster renders no groups.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field HomeAboutUs/HomeTalkToUs use) is an
 * *optional* full-bleed section background — like HomeAboutUs, there's no
 * placeholder fallback, so the section just renders on its plain
 * background until an editor sets one.
 *
 * Animation: the heading gets the same GSAP split-text reveal every
 * sibling section's own heading uses. Each group card also gets its own
 * hover — distinct from every other section's lift/tilt/pulse/spotlight/
 * zoom treatment, shaped around what these cards actually have (a label
 * and a list, no icon): the underline under the group's label grows
 * from a short dash to the full rule, each list item nudges a step
 * right with a stagger, and the card lifts with a soft shadow — see the
 * GROUP CARD HOVER comment below.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeAI({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const proofEntry = dataTextEntries[1];

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLink = linkEntries.find(
    (link) => link.fields.type !== "primary"
  );

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const groupedEntries = groupContentDetails(contentDetailEntries);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;
  const groups = groupedEntries;

  const proofTag = proofEntry?.fields.eyebrow;
  const proofDescription: ReactNode = proofEntry?.fields.text
    ? documentToReactComponents(proofEntry.fields.text)
    : undefined;
  const secondaryHref =
    (secondaryLink && resolveLinkHref(secondaryLink)) ??
    "/ai-agentic-engineering";
  const secondaryLabel = secondaryLink?.fields.label;
  const primaryHref =
    (primaryLink && resolveLinkHref(primaryLink)) ??
    "https://www.oxytal.com/contact";
  const primaryLabel = primaryLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAboutUs's optional background uses). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to its text/button/card colors. `undefined` for an
  // unset or unrecognized value, in which case every themed class below
  // falls back to this section's existing default (today's plain look).
  const theme = resolveTheme(entry.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     HomeServices/HomeProducts/CommonTrustedBy). Nothing else in this
     section animates. Skipped entirely under prefers-reduced-motion.
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
     GROUP CARD HOVER — a layered "reveal" distinct from every other
     section's own lift/tilt/pulse/spotlight/zoom hover (these cards
     have no icon to animate, just a label and a list, so the treatment
     leans on that shape instead): the underline beneath the group's
     label grows from a short dash into a full-width rule, each list
     item nudges a step to the right with a stagger (a quiet "cascade"),
     and the card itself lifts with a soft shadow — all three at once,
     GSAP rather than CSS since the underline's growth and the list's
     stagger both need real tweens. Skipped under prefers-reduced-motion
     — the card just stays put.
  ========================================================= */
  const handleGroupEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const underline = card.querySelector<HTMLElement>("[data-group-underline]");
    const items = card.querySelectorAll<HTMLElement>("[data-group-item]");

    gsap.to(card, {
      y: -5,
      boxShadow: "0 18px 34px -18px rgba(16,24,40,0.14)",
      duration: 0.4,
      ease: "power2.out",
    });

    if (underline) {
      gsap.to(underline, { scaleX: 1, duration: 0.5, ease: "power3.out" });
    }

    if (items.length) {
      gsap.to(items, {
        x: 4,
        duration: 0.35,
        ease: "power2.out",
        stagger: 0.05,
      });
    }
  };

  const handleGroupLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const underline = card.querySelector<HTMLElement>("[data-group-underline]");
    const items = card.querySelectorAll<HTMLElement>("[data-group-item]");

    gsap.to(card, {
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      clearProps: "boxShadow",
    });

    if (underline) {
      gsap.to(underline, { scaleX: 0.22, duration: 0.4, ease: "power2.out" });
    }

    if (items.length) {
      gsap.to(items, { x: 0, duration: 0.3, ease: "power2.out", stagger: 0.03 });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl && theme?.sectionBg
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
      {/* =================================================
          DECORATIVE BACKGROUND — same treatment as
          HomeServices/HomeProducts, centered here for variety; a light
          scrim over the background image instead when there is one, so
          the copy stays readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-20 lg:py-20">
        {/* =================================================
            INTRO
        ================================================= */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide z-2",
                theme?.eyebrowBg ?? "bg-emerald-50",
                theme?.eyebrowText ?? "text-emerald-700"
              )}
            >
              {eyebrow}
            </span>
          )}

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "text-[28px] leading-[1.1] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] z-2",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

          {description && (
            <div
              className={cx(
                "rich-text max-w-xl text-[15.5px] leading-relaxed md:text-[17px] z-2",
                theme?.body ?? "text-gray-500"
              )}
            >
              {description}
            </div>
          )}
        </div>

        {/* =================================================
            GROUPS — one per contentDetail entry, items from its
            statistics array.
        ================================================= */}
        {groups?.length > 0 && (
          <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.label}
                onMouseEnter={handleGroupEnter}
                onMouseLeave={handleGroupLeave}
                className={cx(
                  "rounded-2xl border p-7 z-2 shadow-[0_4px_14px_-10px_rgba(16,24,40,0.06)]",
                  theme?.cardBorder ?? "border-gray-100",
                  theme?.cardBg ?? "bg-white"
                )}
              >
                <div className="relative mb-5 pb-3">
                  <p
                    className={cx(
                      "text-xs font-bold tracking-wide uppercase",
                      theme?.accentText ?? "text-emerald-600"
                    )}
                  >
                    {group.label}
                  </p>
                  {/* Static base rule, full width. */}
                  <span
                    aria-hidden
                    className={cx(
                      "absolute bottom-0 left-0 h-0 w-full border-t",
                      theme?.cardBorder ?? "border-gray-100"
                    )}
                  />
                  {/* Accent overlay — starts as a short dash, grows to the
                    rule's full width on hover (see GROUP CARD HOVER
                    above). */}
                  <span
                    aria-hidden
                    data-group-underline
                    className={cx(
                      "absolute bottom-0 left-0 h-px w-full origin-left scale-x-[0.22]",
                      theme?.buttonBg ?? "bg-emerald-600"
                    )}
                  />
                </div>

                <ul className="flex flex-col gap-5">
                  {group.items.map((item) => (
                    <li key={item.name} data-group-item>
                      <span
                        className={cx(
                          "text-[16px] font-bold block",
                          theme?.heading ?? "text-gray-900"
                        )}
                      >
                        {item.name}
                      </span>
                      <p
                        className={cx(
                          "mt-1 text-[14px] leading-relaxed",
                          theme?.body ?? "text-gray-500"
                        )}
                      >
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* =================================================
            PROOF CALLOUT — left-accent bar. Only rendered when the
            second `dataText` entry supplied at least a tag or a
            description — no placeholder content when it's absent.
        ================================================= */}
        {(proofTag || proofDescription) && (
          <div
            className={cx(
              "relative mt-8 overflow-hidden rounded-xl border p-6 pl-8 z-2",
              theme?.cardBorder ?? "border-emerald-100",
              theme?.cardBg ?? "bg-emerald-50/50"
            )}
          >
            <div
              aria-hidden
              className={cx(
                "absolute inset-y-0 left-0 w-1",
                theme?.buttonBg ?? "bg-emerald-500"
              )}
            />
            <div className="flex flex-wrap items-center gap-4">
              {proofTag && (
                <span
                  className={cx(
                    "w-fit shrink-0 text-xs font-bold tracking-wide uppercase",
                    theme?.accentText ?? "text-emerald-600"
                  )}
                >
                  {proofTag}
                </span>
              )}
              {proofDescription && (
                <div
                  className={cx(
                    "rich-text text-[15px] leading-relaxed",
                    theme?.body ?? "text-gray-600"
                  )}
                >
                  {proofDescription}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="relative z-2 mt-10 max-w-6xl mx-auto">
          <AIPipelineDemo />
        </div>

        {/* =================================================
            FOOTER — text link + CTA button.
        ================================================= */}
        {(secondaryLabel || primaryLabel) && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {secondaryLabel && (
              <Link
                href={secondaryHref}
                className={cx(
                  "group inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold z-2",
                  theme?.accentText ?? "text-emerald-600"
                )}
              >
                {secondaryLabel}
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            )}

            {primaryLabel && (
              <Link
                href={primaryHref}
                className={cx(
                  "inline-flex z-2 w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme?.buttonBg ?? "bg-emerald-600",
                  theme?.buttonText ?? "text-white",
                  theme?.buttonHoverBg ?? "hover:bg-emerald-500"
                )}
              >
                {primaryLabel}
              </Link>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
