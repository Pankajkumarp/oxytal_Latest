"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Layers,
  MapPin,
  MonitorCheck,
  RotateCcw,
  Tag,
  type LucideIcon,
} from "lucide-react";
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
  OfficeSkeleton,
  StatisticSkeleton,
} from "../types/contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeAI/HomeProducts/HomeTalkToUs use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/** Converts a `#rrggbb` (or shorthand `#rgb`) hex color to an `rgba(...)` string at the given alpha — used for the sector chips' hover fill (see CHIP HOVER below), which needs a translucent version of the theme's accent hex rather than the bar/icon-scale hover every other card/row/tile uses. */
function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const value = parseInt(expanded, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface PillarItem {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

/** Cycled by item index as a fallback when a `contentDetail` pillar has no `icon` image set — chosen to echo the reference mockup's own 4 pillar glyphs (rewind/loop, monitor-check, layered stack, checkmark). */
const PILLAR_FALLBACK_ICONS: LucideIcon[] = [
  RotateCcw,
  MonitorCheck,
  Layers,
  CheckCircle2,
];

/** Maps a resolved `contentDetail` entry (one that has a `shortDescription` set — see `HomeAboutUs`'s own doc comment for the pillar/sector split) to the `PillarItem` shape the "what makes us different" grid renders. */
function contentDetailToPillar(
  entry: PlainEntry<ContentDetailSkeleton>
): PillarItem {
  const iconEntry = entry.fields.icon;

  return {
    id: entry.sys.id,
    name: entry.fields.title ?? "",
    description: entry.fields.shortDescription,
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
          (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

interface SectorItem {
  id: string;
  label: string;
  iconUrl?: string;
}

/** Maps a resolved `contentDetail` entry (one with *no* `shortDescription` set — a title-only entry) to one "Sectors we work in" chip. */
function contentDetailToSector(
  entry: PlainEntry<ContentDetailSkeleton>
): SectorItem {
  const iconEntry = entry.fields.icon;

  return {
    id: entry.sys.id,
    label: entry.fields.title ?? "",
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
          (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

interface Hub {
  id: string;
  name: string;
  role?: string;
  description?: string;
  flagUrl?: string;
}

/** Maps a resolved `office` entry (the same content type `Footer`/`AboutHero`/`AboutGlobal` already reuse) to one "hubs" panel row — `city`+`country` combine into the bold name (e.g. "Dublin, Ireland"), `role` is the short tagline (e.g. "Headquarters" — see `OfficeSkeleton.role`'s own doc comment for why it's currently unset on most entries), `description` the paragraph below it, `flag` an optional small flag image. */
function officeToHub(entry: PlainEntry<OfficeSkeleton>): Hub {
  const flagEntry = entry.fields.flag;
  const city = entry.fields.city;
  const country = entry.fields.country;

  return {
    id: entry.sys.id,
    name: city && country ? `${city}, ${country}` : country || city || "",
    role: entry.fields.role,
    description: entry.fields.description,
    flagUrl: isEntry(flagEntry)
      ? getAssetUrl(
          (flagEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
        )
      : undefined,
  };
}

interface ProofStat {
  id: string;
  value: string;
  label: string;
}

/** Maps a resolved `statistic` entry to one "proof strip" tile — same content type `HomeAI`/`contentDetail.statistics`/`testimonial.stats` already reuse. */
function statisticToProof(entry: PlainEntry<StatisticSkeleton>): ProofStat {
  return {
    id: entry.sys.id,
    value: entry.fields.value,
    label: entry.fields.label,
  };
}

/**
 * "About Us", rendered from a `composableElement` entry (`subType:
 * "aboutus"` — see `ComposableElementRenderer`). Ported from
 * `Refrence/oxytal-about-section.html`.
 *
 * Reads a mixed roster out of the composableElement's own `elements`:
 *
 * - the first `dataText` entry supplies the intro copy: `eyebrow`,
 *   `heading` (+ optional `highlightText` trailing accent word, same
 *   idiom `CareersBannerHorizon` already uses), and `text` (rich text —
 *   can hold multiple paragraphs, each rendered as its own `<p>`) for the
 *   lede under the heading
 * - a 2nd `dataText` entry (if present) drives the dark "hubs" panel's
 *   own copy: its `eyebrow` is the small kicker label above the location
 *   list (e.g. "Three locations, one team"), its `text` (rich text) is
 *   the highlighted note under the list (e.g. "Three locations, one set
 *   of standards…")
 * - every `office` entry becomes one row in that same hubs panel (via
 *   `officeToHub`) — the *same* `office` entries `Footer`/`AboutHero`/
 *   `AboutGlobal` already reuse, so linking the same entries here keeps
 *   every location list on the site in sync
 * - every `contentDetail` entry becomes either a "pillar" card (via
 *   `contentDetailToPillar`) or a "sector" chip (via
 *   `contentDetailToSector`) in the two grids below — split purely by
 *   whether the entry has a `shortDescription` set: one *with* a
 *   description becomes a pillar card ("We stay after launch", …); one
 *   with *no* description (title, and optionally an `icon`, only) becomes
 *   a plain sector chip ("Drinks & FMCG", …). No new content type needed
 *   for either.
 * - every `statistic` entry becomes one tile in the bottom "proof strip"
 *   (value + label) — same content type `HomeAI` already reuses.
 * - the first `dataLink` entry supplies the intro's CTA button
 *
 * Every block above only renders when its own roster is non-empty —
 * an elements array with just the intro `dataText` (no offices/
 * contentDetail/statistic/link entries yet) renders just the intro
 * copy, no empty panels.
 *
 * Background image + theme: same `composableElement.backgroundImage`/
 * `themeColor`/`pattern`/`patternColor` mechanism every sibling section
 * uses — `resolveTheme` recolors the intro copy, pillar/sector/proof
 * cards, and CTA button; the dark "hubs" panel itself keeps its own
 * fixed navy-gradient look regardless of theme (a deliberate bespoke
 * treatment lifted straight from the reference mockup, the one part of
 * this section `themeColor` doesn't reach).
 *
 * Animation: the intro heading gets the same GSAP split-text reveal
 * every sibling section's own heading uses. Everything else — the intro
 * copy, the hubs panel, every pillar card, the sectors row, and the
 * proof strip — plays as *one* orchestrated GSAP timeline the moment the
 * section scrolls into view, cascading top-to-bottom with a slight
 * overlap between each piece, rather than each block having its own
 * independent scroll trigger (which read as disjointed — panels popping
 * in at unrelated moments as a long section like this one scrolls by) —
 * see the SECTION REVEAL comment below. Every pillar card, the hub rows,
 * and the proof tiles also share *one* hover mechanism (a thin accent
 * bar that visibly wipes in along one edge, plus a matching icon/flag/
 * value scale); the sector chips pick up just the icon-scale half of it
 * (a straight edge bar would get clipped by their full pill rounding)
 * — see the CARD HOVER comment below.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeAboutUs({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const hubsCopy = dataTextEntries[1];

  const ctaLinkEntry = elements.find(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const pillars = contentDetailEntries
    .filter((element) => element.fields.shortDescription)
    .map(contentDetailToPillar);
  const sectors = contentDetailEntries
    .filter((element) => !element.fields.shortDescription)
    .map(contentDetailToSector);

  const hubs = elements
    .filter(
      (element): element is PlainEntry<OfficeSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "office"
    )
    .map(officeToHub);

  const proofStats = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map(statisticToProof);

  const eyebrow = copy?.fields.eyebrow;
  const highlight = copy?.fields.highlightText;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;

  const hubsKicker = hubsCopy?.fields.eyebrow;
  const hubsNote: ReactNode = hubsCopy?.fields.text
    ? documentToReactComponents(hubsCopy.fields.text)
    : undefined;

  const ctaHref = (ctaLinkEntry && resolveLinkHref(ctaLinkEntry)) ?? "";
  const ctaLabel = ctaLinkEntry?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeTalkToUs/PageBody's default composableElement renderer
  // use). Optional here: no placeholder fallback, so it's simply absent
  // until an editor sets one.
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
  // falls back to this section's own default look — the reference
  // mockup's cyan-on-navy palette, not the site's usual emerald.
  const theme = resolveTheme(entry.fields.themeColor);
  // Raw hex used for hover states that need an actual color value rather
  // than a Tailwind class (GSAP box-shadow/border tweens can't animate to
  // an arbitrary theme's class name) — same "patternColor as the theme's
  // one accent hex" reuse `HomeTalkToUs` already established.
  const accentHex = theme?.patternColor ?? "#0E9BC4";

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hubsRef = useRef<HTMLDivElement>(null);
  const sectorsRef = useRef<HTMLDivElement>(null);
  const proofRef = useRef<HTMLDivElement>(null);
  const pillarsCardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading splits into words on scroll-in (same
     GSAP split-text treatment as HomeServices/HomeProducts/HomeAI/
     HomeTalkToUs). Skipped entirely under prefers-reduced-motion.
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
     SECTION REVEAL — one orchestrated GSAP timeline, triggered once as
     the section scrolls into view (not per-block), so every piece below
     the heading cascades in together rather than popping in
     independently at whatever moment each happens to cross the
     viewport: intro copy, then the hubs panel (in parallel, since they
     sit side by side), then the pillar cards (staggered), then the
     sectors row, then the proof strip — each starting slightly before
     the previous one finishes, for one continuous cascade rather than a
     series of separate pops. No per-card/row/chip hover motion anywhere
     in this section. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    const pillarCards = pillarsCardsRef.current
      ? Array.from(pillarsCardsRef.current.children)
      : [];
    const targets = [
      introRef.current,
      hubsRef.current,
      ...pillarCards,
      sectorsRef.current,
      proofRef.current,
    ].filter((el): el is Element => el !== null);

    if (!targets.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          once: true,
        },
      });

      if (introRef.current) {
        tl.from(introRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        }, 0);
      }

      if (hubsRef.current) {
        tl.from(hubsRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        }, 0.1);
      }

      if (pillarCards.length) {
        tl.from(pillarCards, {
          y: 26,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
        }, 0.35);
      }

      if (sectorsRef.current) {
        tl.from(sectorsRef.current, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        }, 0.55);
      }

      if (proofRef.current) {
        tl.from(proofRef.current, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        }, 0.65);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [hubs.length, pillars.length, sectors.length, proofStats.length]);

  /* =========================================================
     CARD HOVER — one shared mechanism for every card/row/chip in this
     section (pillar cards, hub rows, sector chips, proof tiles), rather
     than each having its own bespoke lift/shadow treatment: a thin
     accent-colored bar visibly wipes in along one edge (`[data-hover-
     bar]` — a real element scaled in via `transform`, not a `boxShadow`
     trick), paired with a small scale-up on that item's own icon/flag/
     value (`[data-hover-icon]`). Every card/tile/chip gets a horizontal
     bar along its top edge; the hub rows (list rows, not discrete tiles)
     get a vertical bar down their left edge instead — same mechanism,
     oriented to fit the shape. One pair of handlers below covers all of
     it via those two shared data attributes, so there's a single motion
     "voice" for the whole section instead of four bespoke ones. Skipped
     entirely under prefers-reduced-motion.
  ========================================================= */
  const handleHoverEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) {
      return;
    }
    const target = event.currentTarget;
    const bar = target.querySelector<HTMLElement>("[data-hover-bar]");
    const icon = target.querySelector<HTMLElement>("[data-hover-icon]");

    if (bar) {
      gsap.to(bar, { scaleX: 1, scaleY: 1, duration: 0.4, ease: "power2.out" });
    }
    if (icon) {
      gsap.to(icon, { scale: 1.12, duration: 0.35, ease: "power2.out" });
    }
  };

  const handleHoverLeave = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) {
      return;
    }
    const target = event.currentTarget;
    const bar = target.querySelector<HTMLElement>("[data-hover-bar]");
    const icon = target.querySelector<HTMLElement>("[data-hover-icon]");

    if (bar) {
      gsap.to(bar, { scaleX: 0, scaleY: 0, duration: 0.3, ease: "power2.in" });
    }
    if (icon) {
      gsap.to(icon, { scale: 1, duration: 0.3, ease: "power2.out" });
    }
  };

  /* =========================================================
     CHIP HOVER — the sector chips get their own treatment rather than
     the bar/icon-scale mechanism above: a translucent accent-colored
     fill (`[data-chip-fill]`, a rounded-full span already clipped to
     the pill's own shape via the chip's `overflow-hidden`) grows in
     from the chip's center, paired with the icon giving a small
     scale + rotate rather than a plain scale — a pill fits a radial
     "bloom" far better than a straight edge bar would (which is why
     these were left with no bar at all before). Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  const handleChipEnter = (event: React.MouseEvent<HTMLLIElement>) => {
    if (prefersReducedMotion()) {
      return;
    }
    const chip = event.currentTarget;
    const fill = chip.querySelector<HTMLElement>("[data-chip-fill]");
    const icon = chip.querySelector<HTMLElement>("[data-hover-icon]");

    if (fill) {
      gsap.to(fill, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" });
    }
    if (icon) {
      gsap.to(icon, { scale: 1.15, rotate: 8, duration: 0.35, ease: "power2.out" });
    }
  };

  const handleChipLeave = (event: React.MouseEvent<HTMLLIElement>) => {
    if (prefersReducedMotion()) {
      return;
    }
    const chip = event.currentTarget;
    const fill = chip.querySelector<HTMLElement>("[data-chip-fill]");
    const icon = chip.querySelector<HTMLElement>("[data-hover-icon]");

    if (fill) {
      gsap.to(fill, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
    }
    if (icon) {
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.3, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl && (theme?.sectionBg ?? "bg-[#FBFDFE]")
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
          DECORATIVE BACKGROUND — a soft mint wash in the top-right
          corner when there's no real background image; a light scrim
          over it instead when there is, so the copy stays readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern
          theme={theme}
          pattern={entry?.fields.pattern}
          patternColor={entry?.fields.patternColor}
        />
      </div>

      <div className="container relative mx-auto px-5 py-16 md:px-10 md:py-24 lg:py-28">
        {/* =================================================
            TOP — intro copy (left) + dark "hubs" panel (right). The
            panel only takes its own column when there's at least one
            office entry to show; with none, the intro copy just runs
            full width.
        ================================================= */}
        <div
          className={cx(
            "grid items-center gap-10",
            hubs.length > 0 && "lg:grid-cols-2 lg:gap-16"
          )}
        >
          <div ref={introRef} className="z-2 flex max-w-2xl flex-col items-start gap-5">
            {eyebrow && (
              <span
                className={cx(
                  "inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase",
                  theme?.accentText ?? "text-[#0E9BC4]"
                )}
              >
                <span
                  aria-hidden
                  className={cx("h-px w-6", theme?.buttonBg ?? "bg-[#0E9BC4]")}
                />
                {eyebrow}
              </span>
            )}

            <DynamicHeading
              level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              className={cx(
                "text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
                theme?.heading ?? "text-[#0B1B2B]"
              )}
            >
              {copy?.fields.heading}
              {highlight && (
                <>
                  {" "}
                  <span className={theme?.accentText ?? "text-[#0E9BC4]"}>
                    {highlight}
                  </span>
                </>
              )}
            </DynamicHeading>

            {description && (
              <div
                className={cx(
                  "rich-text max-w-2xl text-[15px] leading-relaxed",
                  theme?.body ?? "text-[#546A7E]"
                )}
              >
                {description}
              </div>
            )}

            {ctaLabel ? (
              <Link
                href={ctaHref || ""}
                className={cx(
                  "mt-2 inline-flex relative z-2 w-fit items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme?.buttonBg ?? "bg-[#0B1B2B]",
                  theme?.buttonText ?? "text-white",
                  theme?.buttonHoverBg ?? "hover:bg-[#16324B]"
                )}
              >
                {ctaLabel}
                <ArrowRight size={16} aria-hidden />
              </Link>
            ) : null}
          </div>

          {/* =================================================
              HUBS — dark navy panel, one row per `office` entry. Always
              this fixed navy/cyan look regardless of `themeColor` (see
              this file's own doc comment for why).
          ================================================= */}
          {hubs.length > 0 && (
            <div
              ref={hubsRef}
              className="relative z-2 overflow-hidden rounded-2xl bg-gradient-to-br from-[#061223] to-[#0C2138] p-7 text-[#E9F2F8] shadow-[0_22px_60px_-24px_rgba(11,27,43,0.5)] md:p-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-[40%] -right-[30%] h-[420px] w-[420px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(22,185,232,.22), transparent 62%)",
                }}
              />

              {hubsKicker && (
                <p className="relative mb-1.5 text-[12px] font-semibold tracking-wide text-[#16B9E8] uppercase">
                  {hubsKicker}
                </p>
              )}

              <div className="relative">
                {hubs.map((hub, index) => (
                  <div
                    key={hub.id}
                    onMouseEnter={handleHoverEnter}
                    onMouseLeave={handleHoverLeave}
                    className={cx(
                      "relative flex gap-4 overflow-hidden rounded-lg py-4 pl-4 -ml-4",
                      index < hubs.length - 1 && "border-b border-white/10"
                    )}
                  >
                    <span
                      aria-hidden
                      data-hover-bar
                      className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0"
                      style={{ backgroundColor: accentHex }}
                    />
                    <span
                      data-hover-icon
                      className="mt-0.5 h-[22px] w-[26px] flex-shrink-0 overflow-hidden"
                    >
                      {hub.flagUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                        <img
                          src={hub.flagUrl}
                          alt=""
                          aria-hidden
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-white/10">
                          <MapPin size={12} aria-hidden className="text-[#16B9E8]" />
                        </span>
                      )}
                    </span>
                    <span>
                      <span className="block text-[16.5px] font-extrabold tracking-tight text-white">
                        {hub.name}
                      </span>
                      {hub.role && (
                        <span className="mt-1 mb-1.5 block text-[11.5px] font-semibold tracking-wide text-[#16B9E8] uppercase">
                          {hub.role}
                        </span>
                      )}
                      {hub.description && (
                        <span className="block text-[14px] leading-relaxed text-[#9BB0C2]">
                          {hub.description}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {hubsNote && (
                <div className="relative mt-4 flex items-start gap-3 border-t border-white/10 pt-4">
                  <Globe
                    size={17}
                    aria-hidden
                    className="mt-0.5 flex-shrink-0 text-[#16B9E8]"
                  />
                  <div className="rich-text text-[14px] leading-relaxed text-[#C3D3DF] [&_strong]:font-semibold [&_strong]:text-white">
                    {hubsNote}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            PILLARS — "what makes us different", one card per
            `contentDetail` entry that has a `shortDescription` set.
        ================================================= */}
        {pillars.length > 0 && (
          <div
            ref={pillarsCardsRef}
            className={cx(
              "z-2 mt-10 grid divide-x divide-y divide-cyan-100 overflow-hidden rounded-2xl border sm:grid-cols-2 md:mt-14 md:grid-cols-4",
              theme?.cardBorder ?? "divide-[#E3ECF2] border-[#E3ECF2]"
            )}
          >
            {pillars.map((pillar, index) => {
              const FallbackIcon =
                PILLAR_FALLBACK_ICONS[index % PILLAR_FALLBACK_ICONS.length];
              return (
                <div
                  key={pillar.id}
                  onMouseEnter={handleHoverEnter}
                  onMouseLeave={handleHoverLeave}
                  className={cx(
                    "relative overflow-hidden p-7",
                    theme?.cardBg ?? "bg-white"
                  )}
                >
                  <span
                    aria-hidden
                    data-hover-bar
                    className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0"
                    style={{ backgroundColor: accentHex }}
                  />
                  <div
                    data-hover-icon
                    className={cx(
                      "mb-4 flex h-10 w-10 items-center justify-center rounded-[10px]",
                      theme?.eyebrowBg ?? "bg-[#E5F5FB]",
                      theme?.accentText ?? "text-[#0E9BC4]"
                    )}
                  >
                    {pillar.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                      <img
                        src={pillar.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={19} aria-hidden />
                    )}
                  </div>
                  <span
                    className={cx(
                      "text-[18px] font-bold tracking-tight block",
                      theme?.heading ?? "text-[#0B1B2B]"
                    )}
                  >
                    {pillar.name}
                  </span>
                  {pillar.description && (
                    <p
                      className={cx(
                        "mt-2 text-[14.6px] leading-[1.75]",
                        theme?.body ?? "text-[#546A7E]"
                      )}
                    >
                      {pillar.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================
            SECTORS — "Sectors we work in", one chip per `contentDetail`
            entry with no `shortDescription` set.
        ================================================= */}
        {sectors.length > 0 && (
          <div
            ref={sectorsRef}
            className={cx(
              "z-2 mt-6 grid gap-5 rounded-2xl border p-6 sm:grid-cols-[auto_1fr] sm:items-center md:p-7",
              theme?.cardBorder ?? "border-[#E3ECF2]",
              theme?.cardBg ?? "bg-white"
            )}
          >
            <span
              className={cx(
                "text-[13px] font-semibold tracking-wide whitespace-nowrap uppercase",
                theme?.accentText ?? "text-[#0E9BC4]"
              )}
            >
              Sectors we work in
            </span>
            <ul className="flex flex-wrap gap-2.5">
              {sectors.map((sector) => (
                <li
                  key={sector.id}
                  onMouseEnter={handleChipEnter}
                  onMouseLeave={handleChipLeave}
                  className={cx(
                    "relative flex items-center gap-2 overflow-hidden rounded-full border py-2 pr-4 pl-3 text-[14px]",
                    theme?.cardBorder ?? "border-[#E3ECF2]",
                    theme?.body ?? "bg-[#F1F6F9] text-[#546A7E]"
                  )}
                >
                  <span
                    aria-hidden
                    data-chip-fill
                    className="absolute inset-0 scale-0 rounded-full opacity-0"
                    style={{ backgroundColor: hexToRgba(accentHex, 0.16) }}
                  />
                  {sector.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
                    <img
                      data-hover-icon
                      src={sector.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-3.5 w-3.5 object-contain"
                    />
                  ) : (
                    <Tag
                      data-hover-icon
                      size={14}
                      aria-hidden
                      className={theme?.accentText ?? "text-[#0E9BC4]"}
                    />
                  )}
                  {sector.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* =================================================
            PROOF — one tile per `statistic` entry.
        ================================================= */}
        {proofStats.length > 0 && (
          <div
            ref={proofRef}
            className={cx(
              "z-2 mt-6 grid divide-x divide-y divide-cyan-100 overflow-hidden rounded-2xl border sm:grid-cols-2 md:grid-cols-5",
              theme?.cardBorder ?? "divide-[#E3ECF2] border-[#E3ECF2]"
            )}
          >
            {proofStats.map((stat) => (
              <div
                key={stat.id}
                onMouseEnter={handleHoverEnter}
                onMouseLeave={handleHoverLeave}
                className={cx("relative overflow-hidden p-6", theme?.cardBg ?? "bg-white")}
              >
                <span
                  aria-hidden
                  data-hover-bar
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0"
                  style={{ backgroundColor: accentHex }}
                />
                <div
                  data-hover-icon
                  className={cx(
                    "inline-block text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold tracking-tight",
                    theme?.accentText ?? "text-[#0E9BC4]"
                  )}
                >
                  {stat.value}
                </div>
                <div
                  className={cx(
                    "mt-2 text-[14px] leading-snug",
                    theme?.body ?? "text-[#546A7E]"
                  )}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
