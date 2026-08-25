"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowRight, Sparkles } from "lucide-react";
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
  DataLinkSkeleton,
  DataTextSkeleton,
  StatisticSkeleton,
} from "../types/contentful";
import styles from "./HomeProducts.module.css";
import ProductsCarousel from "./ProductsCarousel";

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeAI use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

type Accent = "gold" | "teal" | "emerald";

/** Cycled purely by row position — the reference mockup's own tag coloring isn't tied to any particular field value, it just alternates gold/teal/emerald down the list. */
const ACCENT_CYCLE: Accent[] = ["gold", "teal", "emerald"];

const ACCENT_TAG_CLASS: Record<Accent, string> = {
  gold: styles.tagGold,
  teal: styles.tagTeal,
  emerald: styles.tagEmerald,
};

interface MetaPair {
  key: string;
  value: string;
}

/** Maps a resolved `statistic` entry to one `row-meta` key/value pair (`label`/`value`) — e.g. "Client" / "Diageo". Same content type `ContactStats`/`AboutHero` reuse for their own label/value rows. */
function statisticToMetaPair(entry: PlainEntry<StatisticSkeleton>): MetaPair {
  return { key: entry.fields.label, value: entry.fields.value };
}

interface CaseItem {
  id: string;
  num: string;
  title?: string;
  /** From `badge` — both the exhibit's rotated "stamp" and the row's own colored tag. */
  badge?: string;
  /** From `clientName` — the exhibit panel's "Client — Reach" style caption line. */
  client?: string;
  description?: string;
  image?: string;
  href: string;
  ctaLabel?: string;
  accent: Accent;
  meta: MetaPair[];
}

/** Maps a resolved `contentDetail` entry (plus its position) to one `CaseItem`. */
function contentDetailToCaseItem(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): CaseItem {
  const heroImageEntry = entry.fields.heroImage;
  const image = isEntry(heroImageEntry)
    ? getAssetUrl(
      (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
        .image
    )
    : undefined;

  const ctaLink = (entry.fields.cta ?? []).find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;

  const meta = (entry.fields.statistics ?? [])
    .filter((stat): stat is PlainEntry<StatisticSkeleton> => isEntry(stat))
    .map(statisticToMetaPair);

  return {
    id: entry.sys.id,
    num: String(index + 1).padStart(2, "0"),
    title: entry.fields.title,
    badge: entry.fields.badge,
    client: entry.fields.clientName,
    description: entry.fields.shortDescription,
    image,
    href: (ctaLink && resolveLinkHref(ctaLink)) ?? "#",
    ctaLabel: ctaLink?.fields.label,
    accent: ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    meta,
  };
}

/**
 * "Our Work. Their Success." — the home page's Products/case-index
 * section, rendered from a `composableElement` entry (`subType:
 * "producthome"` — see `ComposableElementRenderer`). Redesigned as a
 * near-verbatim port of `Refrence/product-section.html`'s editorial
 * "case index" mockup — a sticky preview panel synced to a numbered list
 * of rows — replacing this section's earlier bento-grid layout. The
 * underlying Contentful shape is unchanged from that earlier version, so
 * existing `producthome` content keeps working as-is:
 *
 * - one `dataText` entry among `elements` supplies the eyebrow/heading/
 *   description copy (the eyebrow additionally gets a live "— NN entries"
 *   suffix appended, matching the reference's own "Case index — 03
 *   entries")
 * - every `contentDetail` entry among `elements` becomes one row + its
 *   paired sticky-preview "exhibit" (via `contentDetailToCaseItem`):
 *   `title`, `badge` (both the exhibit's rotated stamp and the row's
 *   colored tag), `clientName` (the exhibit's client caption — `category`
 *   is a locked business-catalog enum on this content type and can't hold
 *   this), `shortDescription`, `heroImage` (shown inside the sticky
 *   preview frame in place of the reference's hand-drawn SVG art — there's
 *   no way to author bespoke per-case line art from Contentful, so a real
 *   photo takes its place; blank until an editor sets one), every
 *   `statistic` entry in `statistics` as one `row-meta` key/value pair
 *   (e.g. "Client" / "Diageo"), and its `cta`'s first `dataLink` as the
 *   "View case study" link. Tag/accent color (gold/teal/emerald) cycles
 *   purely by row position — the reference's own coloring isn't tied to
 *   any field, `accentColor` included, so this doesn't read it.
 *
 * Every field above renders exactly what's in Contentful — an unset
 * eyebrow/heading/description/case title/badge/cta label simply renders
 * nothing (no hardcoded placeholder copy), and no `contentDetail` entries
 * means no rows/exhibits at all (see the `cases.length > 0` guard below).
 *
 * Hovering or clicking a row syncs the sticky preview panel to that row's
 * exhibit (plain CSS background/color transitions for the row itself,
 * mirroring the reference's own vanilla-JS `.active` toggle) — the first
 * row is active by default. Below 880px the preview panel stops being
 * sticky and moves above the row list instead (see
 * `HomeProducts.module.css`), matching the reference's own responsive
 * rule.
 *
 * Typography is the site's own default (Poppins, via the ambient
 * `body`/`font-sans` set up in `app/(content)/[locale]/layout.tsx`) at
 * the same sizes every sibling section uses for the equivalent role
 * (heading/body/card-title scale) — no bespoke fonts loaded for this
 * section. The two purely-numeric labels (`exhibitNum`/`rowNum`) use
 * Tailwind's own `font-mono` utility instead, matching the "index number
 * in mono" convention `HomeServices`/`AboutApproach` already use for
 * their own numbered items.
 *
 * The corner-tick decorations, sticky-preview mechanics, row grid, and
 * the gold/teal/emerald tag palette (`HomeProducts.module.css`) are this
 * section's fixed structural/decorative identity, same as every other
 * bespoke-mockup port in this codebase (e.g. `ServicesPage`'s own dark/
 * amber chrome) — they don't swap with `themeColor`. `resolveTheme`
 * *does* drive the section's actual background and its primary readable
 * text (heading, intro body copy, eyebrow, exhibit/row titles) — a wider
 * reach than `ServicesPage`'s "intro copy only" scope, since this section
 * doesn't have as strong a single fixed "look" (a light paper background,
 * not a dark editorial one) to defend. The composableElement's own
 * `backgroundImage` field is an *optional* full-bleed photo behind
 * everything, same convention every sibling section uses — an opacity-90
 * tint in the resolved (or default paper) `sectionBg` color sits over it
 * so text stays readable, same pattern `AboutStory`/`AboutProducts` use.
 *
 * The heading gets the same GSAP split-text scroll-reveal every sibling
 * section's heading uses; the row list fades + rises in with a stagger
 * the first time it scrolls into view. Whichever row is active also gets
 * two different *types* of GSAP animation at once, one per side of the
 * layout: the row itself gets a "spring" — its arrow overshoots
 * slightly on the way in and its number gives a quick scale pulse (see
 * ACTIVE ROW SPRING) — while the sticky preview's newly active exhibit
 * gets a slower, easing "reveal" instead — its photo does a Ken-Burns-
 * style zoom-down-and-fade-up and its rotated stamp settles into its
 * resting tilt from a sharper angle (see EXHIBIT REVEAL). Both replace
 * what used to be a single linear CSS fade, and both are distinct from
 * every other section's own card hover.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeProducts({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailCases = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToCaseItem);

  const cases = contentDetailCases;

  // The live "— NN entries" suffix only makes sense once there's an
  // eyebrow to attach it to — with no `eyebrow` set at all, render
  // nothing rather than a bare "undefined — 00 entries".
  const eyebrowBase = copy?.fields.eyebrow;
  const eyebrow = eyebrowBase
    ? `${eyebrowBase} — ${String(cases.length).padStart(2, "0")} entries`
    : undefined;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to this section's background and primary readable
  // text (heading/body/eyebrow/titles). `undefined` for an unset or
  // unrecognized value, in which case every themed class below falls back
  // to the reference's own paper/ink identity (today's look, unchanged).
  // The corner ticks, sticky-preview mechanics, borders, and gold/teal/
  // emerald tag colors (all in HomeProducts.module.css) stay fixed either
  // way — see the component doc comment above.
  const theme = resolveTheme(entry.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  const [activeId, setActiveId] = useState(cases[0]?.id);
  const activeCase = cases.find((item) => item.id === activeId) ?? cases[0];

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const prevArrowRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling section).
     Skipped entirely under prefers-reduced-motion.
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
     ROW REVEAL — the row list fades + rises in with a stagger the first
     time it scrolls into view. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!rowsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(rowsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(rowsRef.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: rowsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, rowsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     ACTIVE ROW SPRING — replaces the plain CSS opacity/transform fade
     that used to drive the "View case study" arrow and row number:
     whichever row becomes active now gets its arrow springing in with
     a slight overshoot (`back.out`) instead of a linear ease, and its
     number gives a quick scale "pulse" — distinct from every other
     section's own hover treatment (this one leans on a list row's own
     shape: a number and a trailing link, not a card). The previously
     active row's arrow is handed back to its own CSS resting state via
     `clearProps` rather than animated out, so it doesn't fight the next
     row's "in" tween. Skipped under prefers-reduced-motion — rows just
     snap between the plain CSS states in that case, same as before.
  ========================================================= */
  useLayoutEffect(() => {
    if (!rowsRef.current || prefersReducedMotion()) {
      return;
    }

    const activeRow = rowsRef.current.querySelector<HTMLElement>(
      `[data-row-id="${activeId}"]`
    );
    const numeral = activeRow?.querySelector<HTMLElement>("[data-row-num]");
    const arrow = activeRow?.querySelector<HTMLElement>("[data-row-arrow]");

    if (prevArrowRef.current && prevArrowRef.current !== arrow) {
      gsap.to(prevArrowRef.current, { clearProps: "opacity,transform", duration: 0 });
    }

    if (arrow) {
      gsap.fromTo(
        arrow,
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "back.out(1.7)" }
      );
    }

    if (numeral) {
      gsap.fromTo(
        numeral,
        { scale: 1 },
        { scale: 1.22, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }
      );
    }

    prevArrowRef.current = arrow ?? null;
  }, [activeId]);

  /* =========================================================
     EXHIBIT REVEAL — a second, different *type* of animation from the
     row's own "spring" above: rather than an elastic overshoot, the
     newly active exhibit's photo does a slow Ken-Burns-style reveal
     (scaling down from slightly zoomed-in while fading up) and its
     rotated "stamp" badge settles into its resting tilt from a sharper
     angle, both easing out smoothly (`power3`/`power2`) instead of
     springing. Layered on top of the exhibit container's own existing
     CSS opacity/translateY crossfade (unchanged) — this only adds
     motion to what's *inside* the newly active exhibit. Skipped under
     prefers-reduced-motion, same as every other GSAP effect here.
  ========================================================= */
  useLayoutEffect(() => {
    if (!previewRef.current || prefersReducedMotion()) {
      return;
    }

    const activeExhibit = previewRef.current.querySelector<HTMLElement>(
      `[data-exhibit-id="${activeId}"]`
    );
    const art = activeExhibit?.querySelector<HTMLElement>("[data-exhibit-art]");
    const stamp = activeExhibit?.querySelector<HTMLElement>(
      "[data-exhibit-stamp]"
    );

    if (art) {
      gsap.fromTo(
        art,
        { scale: 1.12, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.9, ease: "power3.out" }
      );
    }

    if (stamp) {
      gsap.fromTo(
        stamp,
        { rotate: -9, opacity: 0 },
        {
          rotate: -2,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          clearProps: "transform",
        }
      );
    }
  }, [activeId]);

  return (
    <>
    <section
      ref={sectionRef}
      className={cx(
        styles.page,
        // No `overflow-hidden` here, unlike most sibling sections' own
        // decorative-background wrapper: this section's `.previewCol`
        // (see HomeProducts.module.css) uses `position: sticky`, which
        // stops working the moment ANY ancestor sets `overflow` to
        // anything but `visible` — and nothing in this section's own
        // background/pattern layer actually extends past its edges, so
        // there's nothing that needs clipping in the first place.
        "relative py-16 md:py-24",
        !backgroundUrl && (theme?.sectionBg ?? "bg-[#ECEAE2]"),
        theme?.heading ?? "text-[#15181C]"
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

      <div className="container relative mx-auto px-5 md:px-10">
        {/* =================================================
            HEADER
        ================================================= */}
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

        <div className={styles.headerRow}>
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(styles.heading, theme?.heading ?? "text-[#15181C]")}
          >
            {heading}
          </DynamicHeading>
          {description && (
            <div
              className={cx("rich-text", styles.headerSub, theme?.body ?? "text-[#565A57]")}
            >
              {description}
            </div>
          )}
        </div>

        {/* =================================================
            INDEX — sticky preview + row list. Only rendered when there's
            at least one `contentDetail` case — no placeholder rows/exhibits
            when the roster is empty.
        ================================================= */}
        {cases.length > 0 && (
        <div className={styles.index}>
          <div
            className={cx(
              styles.previewCol,
              theme?.cardBorder ?? "border-gray-100",
              theme?.cardBg ?? "bg-white"
            )}
          >
            <div ref={previewRef} className={styles.previewFrame}>
              {cases.map((item) => (
                <div
                  key={item.id}
                  data-exhibit-id={item.id}
                  className={cx(
                    styles.exhibit,
                    item.id === activeCase?.id && styles.exhibitActive
                  )}
                >
                  <div className={styles.exhibitTop}>
                    {item.badge && (
                      <span data-exhibit-stamp className={styles.exhibitStamp}>
                        {item.badge}
                      </span>
                    )}
                    <span className={cx(styles.exhibitNum, "font-mono")}>
                      {item.num}
                    </span>
                  </div>

                  <div className={styles.exhibitArt}>
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img data-exhibit-art src={item.image} alt="" aria-hidden />
                    ) : null}
                  </div>

                  <div>
                    {item.client && (
                      <div className={styles.exClient}>{item.client}</div>
                    )}
                    {item.title && (
                      <div
                        className={cx(
                          styles.exTitle,
                          theme?.heading ?? "text-[#15181C]"
                        )}
                      >
                        {item.title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              ref={rowsRef}
              className={cx(
                styles.rows,
                theme?.cardBorder ?? "border-gray-100",
                theme?.cardBg ?? "bg-white"
              )}
            >
              {cases.map((item) => {
                const isActive = item.id === activeCase?.id;

                return (
                  // A plain `<div>`, not a `<button>`: the row's own
                  // hover/click only syncs the sticky preview (mirroring
                  // the reference mockup's own vanilla-JS behavior) — the
                  // actual navigable control is the "View case study"
                  // `<Link>` nested inside it below, and a `<button>`
                  // can't legally contain another interactive element
                  // like an `<a>`.
                  <div
                    key={item.id}
                    data-row-id={item.id}
                    onMouseEnter={() => setActiveId(item.id)}
                    onClick={() => setActiveId(item.id)}
                    className={cx(
    styles.row,
    isActive && styles.rowActive,
    theme?.cardBorder ?? "border-gray-100",
    "border-b"
  )}
                  >
                    <span data-row-num className={cx(styles.rowNum, "font-mono")}>
                      {item.num}
                    </span>

                    <div>
                      {item.badge && (
                        <span
  className={cx(
    styles.rowTag,
    ACCENT_TAG_CLASS[item.accent],
    theme?.eyebrowBg ?? "bg-emerald-50",
    theme?.eyebrowText ?? "text-emerald-700"
  )}
>
                          {item.badge}
                        </span>
                      )}
                      {item.title && (
                        <div
                          className={cx(
                            styles.rowTitle,
                            theme?.heading ?? "text-[#15181C]"
                          )}
                        >
                          {item.title}
                        </div>
                      )}
                      {item.description && (
                        <p
                          className={cx(
                            styles.rowDesc,
                            theme?.body ?? "text-[#565A57]"
                          )}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>

                    {item.meta.length > 0 && (
                      <div className={styles.rowMeta}>
                        {item.meta.map((pair) => (
                          <span key={pair.key}>
                            {pair.key} <b>{pair.value}</b>
                          </span>
                        ))}
                      </div>
                    )}

                    {item.ctaLabel && (
                      <Link
                        href={item.href}
                        data-row-arrow
                        onFocus={() => setActiveId(item.id)}
                        className={cx(
                          styles.rowArrow,
                          isActive && styles.rowArrowActive
                        )}
                      >
                        {item.ctaLabel}
                        <ArrowRight size={14} aria-hidden />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
    <ProductsCarousel entry={entry} />
    </>
  );
}
