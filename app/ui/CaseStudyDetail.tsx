"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, type Document as RichTextDocument } from "@contentful/rich-text-types";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowLeft } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { resolveVariant, type Variant } from "../lib/caseStudyVariant";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import {
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution `CaseStudiesListing`/`PageBody` use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface StatItem {
  label: string;
  value: string;
}

function statisticToStatItem(entry: PlainEntry<StatisticSkeleton>): StatItem {
  return { value: entry.fields.value ?? "", label: entry.fields.label ?? "" };
}

interface RelatedItem {
  id: string;
  title: string;
  category?: string;
  clientName?: string;
  imageUrl?: string;
  href: string;
}

/** Maps a resolved `contentDetail` entry (one of `getRelatedCaseStudies`'s results) to the plain shape the "More case studies" grid renders. */
function contentDetailToRelatedItem(entry: PlainEntry<ContentDetailSkeleton>): RelatedItem {
  const heroImageEntry = entry.fields.heroImage;
  const imageUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
      (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
        .image
    )
    : undefined;

  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    category: entry.fields.category,
    clientName: entry.fields.clientName,
    imageUrl,
    href: entry.fields.slug ? `/case-studies/${entry.fields.slug}` : "#",
  };
}

/** The mapped shape every variant renders from — same fields regardless of which of the 3 designs is picked (see `CaseStudyDetail`'s own doc comment below). */
interface CaseStudyData {
  title: string;
  badge?: string;
  category?: string;
  clientName?: string;
  shortDescription?: string;
  fullDescription?: RichTextDocument;
  /** This case study's own photo (`contentDetail.heroImage` — the same field/asset `CaseStudiesListing`'s card and `RelatedCard` show) — a dedicated image *within* the hero area (the reference mockups' own `.reel-art`/`.chapter-art`/`.cell-art` boxes), not a full-bleed backdrop. Every variant has a slot for it; it just doesn't render at all when unset, same "no placeholder" convention as everywhere else on this page. */
  heroPhotoUrl?: string;
  /** A full-bleed photo behind the *entire* page — a `page`/`composableElement`-only feature (its `backgroundImage` field), set via `overrides` below; applies independently of `theme`, same as every other section's `backgroundImage`. There's no fallback-path equivalent: without a dedicated `page` yet, a case study only has `heroPhotoUrl` and a standalone `theme` to work with. */
  backdropUrl?: string;
  /** First 3 `statistics` entries — the headline numbers every variant leads with (ticker/rail-stat/cell-stat). */
  headlineStats: StatItem[];
  /** `category` (labeled "Practice") plus any `statistics` entries beyond the first 3 — the secondary fact rows (rail-meta/cell-meta). Reel has no separate meta list; its ticker just shows every stat. */
  metaRows: { k: string; v: string }[];
  variant: Variant;
  theme?: SectionTheme;
  /** `ThemePattern`'s per-section pattern choice — see `contentDetail.pattern`'s own doc comment (app/types/contentful.ts). Only takes effect together with `patternColor`; otherwise falls back to `theme?.showPattern`'s own dotted-grid default, same as everywhere else `ThemePattern` is dropped in. */
  pattern?: string;
  patternColor?: string;
  /** First resolved entry in `contentDetail.cta` (an array, same "reuse `dataLink`" convention as everywhere else on this site) — its href/label. Renders nothing when `cta` is unset or has no resolved link, same "no placeholder" convention as this component's other optional fields. */
  ctaHref?: string;
  ctaLabel?: string;
}

function mapContentDetail(entry: PlainEntry<ContentDetailSkeleton>): CaseStudyData {
  const allStats = (entry.fields.statistics ?? [])
    .filter(isEntry)
    .map((s) => statisticToStatItem(s as unknown as PlainEntry<StatisticSkeleton>));
  const headlineStats = allStats.slice(0, 3);
  const metaStats = allStats.slice(3);

  const metaRows = [
    ...(entry.fields.category ? [{ k: "Practice", v: entry.fields.category }] : []),
    ...metaStats.map((s) => ({ k: s.label, v: s.value })),
  ];

  const heroImageEntry = entry.fields.heroImage;
  const heroPhotoUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
      (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
        .image
    )
    : undefined;

  const ctaLink = entry.fields.cta?.find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;

  return {
    title: entry.fields.title ?? "",
    badge: entry.fields.badge,
    ctaHref: ctaLink ? resolveLinkHref(ctaLink) : undefined,
    ctaLabel: ctaLink?.fields.label,
    category: entry.fields.category,
    clientName: entry.fields.clientName,
    shortDescription: entry.fields.shortDescription,
    fullDescription: entry.fields.fullDescription,
    heroPhotoUrl,
    headlineStats,
    metaRows,
    variant: resolveVariant(entry.fields.layoutVariant),
    // Fallback-path theming only — no backdrop photo of its own to pair
    // with (see `backdropUrl`'s own doc comment above), so it's just a
    // standalone recolor rather than the paired feature `overrides`
    // provides once a `page` exists.
    theme: resolveTheme(entry.fields.themeColor),
    pattern: entry.fields.pattern,
    patternColor: entry.fields.patternColor,
  };
}

/** Default narrative text colors per variant — used whenever no `theme` is set, same tones the `.case-narrative-<variant>` CSS scope used to hardcode directly (see app/globals.css's own comment on why color moved out of that stylesheet). `quoteBg` only applies to bento, whose pull-quote is a solid colored card rather than just oversized colored text. */
const NARRATIVE_COLORS: Record<
  Variant,
  { heading: string; body: string; quoteText: string; quoteBg?: string; quoteOnBg?: string }
> = {
  reel: { heading: "text-white", body: "text-[#9A9A9A]", quoteText: "text-white" },
  editorial: { heading: "text-[#221F1A]", body: "text-[#6B6357]", quoteText: "text-[#221F1A]" },
  bento: {
    heading: "text-[#1B1B18]",
    body: "text-[#6E6A60]",
    quoteText: "text-white",
    quoteBg: "bg-[#E4572E]",
    quoteOnBg: "text-white",
  },
};

/**
 * Renders `fullDescription`'s rich text, coloring each node type with a
 * Tailwind class straight on the element — `theme?.field` when a theme is
 * set, else this variant's own default (`NARRATIVE_COLORS`). Color can't
 * live in the `.case-narrative-<variant>` CSS scope (see app/globals.css)
 * the way the rest of the typography (size/weight/spacing) does: a static
 * CSS rule and a Tailwind utility class sit at the same specificity, so
 * the *later-declared* one wins regardless of which element has the
 * class — and since that CSS is declared after Tailwind's own utilities
 * in the stylesheet, a hardcoded `color` there would always beat a theme
 * class, `theme` or not. Applying it here instead, in JSX, is what every
 * other themed section on this site already does.
 *
 * On top of coloring, one extra convention: a paragraph whose text starts
 * with an em dash (e.g. "—  VP of Digital Marketing, Diageo") renders as a
 * small-caps attribution line instead of a plain paragraph — the same
 * lightweight "author it as plain rich text, get a styled result" move
 * `HomeCaseStudies`'s `*word*` heading markers make. Meant to follow a
 * `blockquote` (the pull-quote + its attribution), same convention every
 * reference mockup uses.
 */
function renderNarrative(doc: RichTextDocument, variant: Variant, theme?: SectionTheme) {
  const colors = NARRATIVE_COLORS[variant];
  const headingClass = theme?.heading ?? colors.heading;
  const bodyClass = theme?.body ?? colors.body;
  const attributionClass = theme?.muted ?? colors.body;

  return documentToReactComponents(doc, {
    renderNode: {
      [BLOCKS.HEADING_2]: (_node, children) => (
        <h2 className={headingClass}>{children}</h2>
      ),
      [BLOCKS.PARAGRAPH]: (node, children) => {
        const text = node.content
          .map((child) => ("value" in child ? child.value : ""))
          .join("");

        return text.trim().startsWith("—") ? (
          <p className={cx("case-attribution", attributionClass)}>{children}</p>
        ) : (
          <p className={bodyClass}>{children}</p>
        );
      },
      [BLOCKS.QUOTE]: (_node, children) =>
        colors.quoteBg ? (
          <blockquote className={cx(theme?.buttonBg ?? colors.quoteBg, theme?.buttonText ?? colors.quoteOnBg)}>
            {children}
          </blockquote>
        ) : (
          <blockquote className={theme?.heading ?? colors.quoteText}>{children}</blockquote>
        ),
    },
  });
}

/**
 * Tag/category pill default colors, split into `bg`/`text` (rather than
 * one combined class string) so `theme?.eyebrowBg`/`theme?.eyebrowText`
 * can override each independently — a combined string only lets a themed
 * background *replace* the whole thing, silently dropping the text color
 * that came with it. `extra` holds non-color classes (reel's own
 * uppercase/tracking, since it renders as bare colored text with no pill
 * background at all — themed or not, it never gets `eyebrowBg`).
 */
const VARIANT_TAG_STYLES: Record<Variant, { bg: string; text: string; extra?: string }> = {
  reel: { bg: "bg-transparent", text: "text-[#C97B3D]", extra: "uppercase tracking-[0.14em]" },
  editorial: { bg: "bg-[#EAEEE2]", text: "text-[#5C6E4F]" },
  bento: { bg: "bg-[#FCE7DE]", text: "text-[#E4572E]" },
};

/** `data.ctaHref`/`ctaLabel`'s pill button default colors, per variant — same "themed override, bespoke fallback" split every other styled element on this page uses. */
const VARIANT_BUTTON_STYLES: Record<Variant, { bg: string; text: string; hover: string }> = {
  reel: { bg: "bg-[#C97B3D]", text: "text-white", hover: "hover:bg-[#E0964F]" },
  editorial: { bg: "bg-[#5C6E4F]", text: "text-white", hover: "hover:bg-[#465A3A]" },
  bento: { bg: "bg-[#E4572E]", text: "text-white", hover: "hover:bg-[#C8451F]" },
};

/** `data.ctaHref`/`ctaLabel` rendered as a pill button — only when a `contentDetail.cta` link actually resolved (see `mapContentDetail`); renders nothing otherwise, same "no placeholder" convention as this component's other optional fields. */
function CaseStudyCta({
  data,
  variant,
  theme,
  className,
}: {
  data: CaseStudyData;
  variant: Variant;
  theme?: SectionTheme;
  className?: string;
}) {
  if (!data.ctaHref) {
    return null;
  }

  const button = VARIANT_BUTTON_STYLES[variant];

  return (
    <Link
      href={data.ctaHref}
      className={cx(
        "inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-bold tracking-wide uppercase transition-colors",
        theme?.buttonBg ?? button.bg,
        theme?.buttonText ?? button.text,
        theme?.buttonHoverBg ?? button.hover,
        className
      )}
    >
      {data.ctaLabel || "Learn more"}
    </Link>
  );
}


/** Per-variant heading GSAP params — same split-text word reveal every hero on this site uses, tuned to match each design's personality (reel: large + punchy; editorial: softer; bento: compact + snappy). */
const HEADING_ANIM: Record<Variant, gsap.TweenVars> = {
  reel: { yPercent: 130, rotate: 6, duration: 0.9, ease: "power4.out", stagger: 0.05 },
  editorial: { yPercent: 70, rotate: 1, duration: 1.1, ease: "power3.out", stagger: 0.08 },
  bento: { yPercent: 90, rotate: 2, duration: 0.7, ease: "power3.out", stagger: 0.04 },
};

/**
 * `/case-studies/[slug]`'s page content — one `contentDetail` entry
 * (`getCaseStudyBySlug`, see app/lib/contentEntry.ts) rendered as one of 3
 * designs, ported from `Refrence/case-study-detail.html` ("reel" — dark,
 * copper, Archivo-scale display type, a scrolling stat ticker), `case-
 * study-2.html` ("editorial" — cream/sage, a sticky fact rail beside a
 * numbered-chapter narrative column) and `case-study-3.html` ("bento" —
 * paper/coral/navy CSS-grid cells). Every variant reads from the exact
 * same `contentDetail` fields (`mapContentDetail`) — only the layout,
 * type scale, heading animation timing, and default background/theme
 * differ, picked by that entry's own `layoutVariant` field:
 *
 * - `title`/`category`/`clientName`/`shortDescription` — the hero/rail/
 *   header-cell copy in every variant
 * - `fullDescription` (rich text) — the entire challenge/approach/result
 *   narrative as one flowing document (heading-2 chapter titles,
 *   paragraphs, an unordered list for the approach bullets, a blockquote
 *   for the pull-quote followed by a "— Attribution" paragraph — see
 *   `renderNarrative`). Structural type (size/weight/spacing/transform)
 *   comes from the `.case-narrative-<variant>` CSS scope in app/
 *   globals.css so the same document looks native to whichever design
 *   renders it; color is applied dynamically in `renderNarrative` itself
 *   (`theme?.field ?? that variant's own default`) since a themed color
 *   can't win against a static CSS rule at equal specificity
 * - `statistics` — the first 3 entries are the headline numbers every
 *   variant leads with; any beyond that (plus `category`, labeled
 *   "Practice") become the secondary meta rows editorial/bento show
 *   (reel folds everything into its ticker instead)
 * - `heroImage` (optional, links to a `dataImage` entry) becomes
 *   `heroPhotoUrl` — a dedicated photo shown *within* the hero area (each
 *   variant's own take on the reference mockups' `.reel-art`/`.chapter-
 *   art`/`.cell-art` boxes), not a full-page backdrop; it simply doesn't
 *   render when unset
 * - `themeColor` resolves via `resolveTheme` (app/lib/theme.ts) as a
 *   standalone chrome recolor on this fallback path (see below). It
 *   intentionally does *not* reach into the narrative body copy, which
 *   keeps each variant's own muted reading color for legibility — same
 *   call `ThemePattern`'s decorative blobs make to stay unthemed ("a
 *   subtle accent rather than a necessary themed element").
 * - `pattern`/`patternColor` (together only — see `ThemePattern`'s own
 *   doc comment) pick one of its 14 decorative background tiles for this
 *   fallback path; unset (or half-set) falls back to `theme?.showPattern`'s
 *   own dotted-grid default, same as every other `ThemePattern` call site.
 *
 * `variant`/`theme`/`heroPhotoUrl` above are `contentDetail`'s own
 * fallback defaults — used as-is when this case study has no dedicated
 * `page` yet (see the `[locale]/[[...slug]]` catch-all's own fallback).
 * Once it does, that page's `composableElement` (`subType:
 * "caseStudyDetail"`) becomes the authoritative source for the *design
 * choices* instead: its own `isFor` picks the variant, its own
 * `themeColor` recolors the chrome, and its own `backgroundImage` becomes
 * a full-page backdrop layered *behind* everything — each applies on its
 * own whenever it's set, independently of the other (same convention
 * every other composableElement section uses), and independently of any
 * `heroPhotoUrl` too (the two can coexist: a backdrop photo behind the
 * whole page, plus this case study's own photo in its dedicated hero
 * slot). `CaseStudyDetailSection` resolves `variant`/`theme`/`backdropUrl`
 * and passes them down as `overrides`, which fully replace (not merge
 * with) the `contentDetail`-derived `variant`/`theme` for exactly the
 * fields it sets, so a page-level choice always wins over the fallback
 * once one exists. `heroPhotoUrl` is never part of `overrides` — it's
 * this case study's own photo either way, regardless of which path
 * renders it.
 *
 * The heading gets the same GSAP split-text word reveal every hero on
 * this site uses (see `HEADING_ANIM`), skipped under
 * `prefers-reduced-motion`. The "More case studies" grid fades + rises in
 * with a stagger as it scrolls into view.
 */
interface Props {
  entry: PlainEntry<ContentDetailSkeleton>;
  /** Set only by `CaseStudyDetailSection` (the `page`/`composableElement` path) — see this component's own doc comment above. */
  overrides?: {
    variant?: Variant;
    theme?: SectionTheme;
    backdropUrl?: string;
    pattern?: string;
    patternColor?: string;
  };
}

export default function CaseStudyDetail({ entry, overrides }: Props) {
  const data = { ...mapContentDetail(entry), ...overrides };

  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!headingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;
    const anim = HEADING_ANIM[data.variant];

    const ctx = gsap.context(() => {
      split = SplitText.create(headingRef.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            ...anim,
            opacity: 0,
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [data.variant]);

  useLayoutEffect(() => {
    if (!relatedRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(relatedRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(relatedRef.current!.children, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: relatedRef.current, start: "top 90%", once: true },
      });
    }, relatedRef);

    return () => ctx.revert();
  }, []);

  if (data.variant === "reel") {
    return (
      <ReelLayout
        data={data}
        sectionRef={sectionRef}
        headingRef={headingRef}
      />
    );
  }

  if (data.variant === "bento") {
    return (
      <BentoLayout
        data={data}
        sectionRef={sectionRef}
        headingRef={headingRef}
      />
    );
  }

  return (
    <EditorialLayout
      data={data}
      sectionRef={sectionRef}
      headingRef={headingRef}
    />
  );
}

type LayoutProps = {
  data: CaseStudyData;
  sectionRef: RefObject<HTMLDivElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

/** Shared "back to all case studies" link — same position/style across all 3 variants (the reference mockups' own "01/12" index counter is skipped as a low-value flourish that would need fragile global numbering). */
function BackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/case-studies"
      className={cx(
        "inline-flex w-fit items-center gap-2 text-[13px] font-semibold uppercase tracking-wide transition-colors",
        className
      )}
    >
      <ArrowLeft size={14} aria-hidden />
      All case studies
    </Link>
  );
}

/** ================= REEL — dark, copper, display type, scrolling ticker ================= */
function ReelLayout({ data, sectionRef, headingRef }: LayoutProps) {
  const { theme } = data;
  const tickerItems = [
    ...data.headlineStats,
    ...data.metaRows.map((row) => ({ value: row.v, label: row.k })),
  ];

  return (
    <div
      ref={sectionRef}
      className={cx(
        "relative min-h-screen overflow-hidden",
        data.backdropUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "]")
      )}
      style={data.backdropUrl ? { backgroundImage: `url(${data.backdropUrl})` } : undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={data.pattern} patternColor={data.patternColor} />
      </div>

      <div className="mx-auto relative z-2 max-w-6xl px-5  md:px-8 py-16 md:py-20 lg:py-24">

        <div className="mt-10">
          <span
            className={cx(
              "mb-5 block text-[12.5px] font-bold",
              VARIANT_TAG_STYLES.reel.extra,
              theme?.eyebrowText ?? VARIANT_TAG_STYLES.reel.text
            )}
          >
            {data.badge}
          </span>

          <h1
            ref={headingRef}
            className={cx(
              "max-w-3xl text-[36px] leading-[1.2] font-black tracking-tight uppercase sm:text-[48px] md:text-[58px]",
              theme?.heading ?? "text-white"
            )}
          >
            {data.title}
          </h1>

          {data.shortDescription && (
            <p className={cx("mt-6 max-w-6xl text-[15.5px] leading-relaxed", theme?.body ?? "text-[#9A9A9A]")}>
              {data.shortDescription}
            </p>
          )}

          <CaseStudyCta data={data} variant="reel" theme={theme} className="mt-7" />

          {data.heroPhotoUrl && (
            <div className="mt-12  overflow-hidden rounded aspect-[1880/835]">
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project */}
              <img
                src={data.heroPhotoUrl}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {tickerItems.length > 0 && (
          <div
            className={cx(
              "my-14 overflow-hidden py-5 border",
              theme?.cardBg ?? "bg-white/5",
              theme?.cardBorder
            )}
          >
            <div className="flex w-max gap-16 motion-safe:animate-marquee motion-reduce:flex-wrap">
              {[...tickerItems, ...tickerItems].map((stat, index) => (
                <div key={index} className="flex shrink-0 items-baseline gap-2.5">
                  <span className={cx("text-[22px] font-extrabold", theme?.heading ?? "text-white")}>
                    {stat.value}
                  </span>
                  <span className={cx("text-[13px] font-semibold tracking-wide uppercase", theme?.body ?? "text-[#9A9A9A]")}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.fullDescription && (
          <div
          className={cx(
              "case-narrative case-narrative-reel max-w-[775px]",
              theme?.heading ?? "text-white"
            )}
            >
            {renderNarrative(data.fullDescription, "reel", theme)}
          </div>
        )}
      </div>
    </div>
  );
}

/** ================= EDITORIAL — cream/sage, sticky rail + numbered chapters ================= */
function EditorialLayout({ data, sectionRef, headingRef }: LayoutProps) {
  const { theme } = data;

  return (
    <div
      ref={sectionRef}
      className={cx(
        "relative min-h-screen overflow-hidden",
        data.backdropUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-[#FAF7F0]")
      )}
      style={data.backdropUrl ? { backgroundImage: `url(${data.backdropUrl})` } : undefined}
    >
      {data.backdropUrl && (
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#FAF7F0]/92" />
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={data.pattern} patternColor={data.patternColor} />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 md:px-8 py-16 md:px-10 md:py-20 lg:py-24">
        <BackLink className={theme?.body ?? "text-[#6B6357] hover:text-[#5C6E4F]"} />

        <div className="mt-9 grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            {data.category && (
              <span
                className={cx(
                  "mb-5 inline-block rounded-full px-3 py-1.5 text-[11.5px] font-bold tracking-wide uppercase",
                  theme?.eyebrowBg ?? VARIANT_TAG_STYLES.editorial.bg,
                  theme?.eyebrowText ?? VARIANT_TAG_STYLES.editorial.text
                )}
              >
                {data.category}
              </span>
            )}
            {data.clientName && (
              <p className={cx("mb-2 text-[14px] font-semibold", theme?.body ?? "text-[#6B6357]")}>
                {data.clientName}
              </p>
            )}
            <h1
              ref={headingRef}
              className={cx(
                "mb-7 text-[28px] leading-[1.12] font-semibold tracking-tight sm:text-[36px]",
                theme?.heading ?? "text-[#221F1A]"
              )}
            >
              {data.title}
            </h1>

            {data.headlineStats.length > 0 && (
              <div className="mb-8 flex flex-col gap-5 border-t border-[#E5DFD1] pt-6">
                {data.headlineStats.map((stat) => (
                  <div key={stat.label}>
                    <div className={cx("text-[32px] leading-none font-semibold", theme?.accentText ?? "text-[#5C6E4F]")}>
                      {stat.value}
                    </div>
                    <div className={cx("mt-1 text-[12.5px] font-semibold", theme?.body ?? "text-[#6B6357]")}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.metaRows.length > 0 && (
              <div className="border-t border-[#E5DFD1] pt-6">
                {data.metaRows.map((row) => (
                  <div key={row.k} className="mb-3 flex justify-between text-[13.5px] last:mb-0">
                    <span className={theme?.body ?? "text-[#6B6357]"}>{row.k}</span>
                    <span className={cx("font-bold", theme?.heading ?? "text-[#221F1A]")}>{row.v}</span>
                  </div>
                ))}
              </div>
            )}

            <CaseStudyCta data={data} variant="editorial" theme={theme} className="mt-7" />
          </aside>

          <div className="pt-1.5">
            {data.shortDescription && (
              <p className={cx("mb-11 text-[20px] leading-relaxed font-medium", theme?.heading ?? "text-[#221F1A]")}>
                {data.shortDescription}
              </p>
            )}

            {data.heroPhotoUrl && (
              <div className="mb-11 aspect-[1672/941] overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project */}
                <img
                  src={data.heroPhotoUrl}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {data.fullDescription && (
              <div className="case-narrative case-narrative-editorial">
                {renderNarrative(data.fullDescription, "editorial", theme)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** ================= BENTO — paper/coral/navy CSS-grid cells ================= */
function BentoLayout({ data, sectionRef, headingRef }: LayoutProps) {
  const { theme } = data;
  const cell = "rounded-[20px] border p-6 flex flex-col";

  return (
    <div
      ref={sectionRef}
      className={cx(
        "relative min-h-screen overflow-hidden",
        data.backdropUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-[#F4F2ED]")
      )}
      style={data.backdropUrl ? { backgroundImage: `url(${data.backdropUrl})` } : undefined}
    >
      {data.backdropUrl && (
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#F4F2ED]/92" />
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={data.pattern} patternColor={data.patternColor} />
      </div>

      <div className="mx-auto max-w-[1160px] px-5 pt-8 pb-20 md:px-8">
        <BackLink className={theme?.body ?? "text-[#6E6A60] hover:text-[#E4572E]"} />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className={cx(cell, "justify-center lg:col-span-4", theme?.cardBorder ?? "border-[#E4E0D6]", theme?.cardBg ?? "bg-white")}>
            {data.category && (
              <span
                className={cx(
                  "mb-4 inline-flex w-fit rounded-full px-3 py-1.5 text-[11.5px] font-bold tracking-wide uppercase",
                  theme?.eyebrowBg ?? VARIANT_TAG_STYLES.bento.bg,
                  theme?.eyebrowText ?? VARIANT_TAG_STYLES.bento.text
                )}
              >
                {data.category}
              </span>
            )}
            {data.clientName && (
              <p className={cx("mb-2.5 text-[13.5px] font-semibold", theme?.body ?? "text-[#6E6A60]")}>
                {data.clientName}
              </p>
            )}
            <h1
              ref={headingRef}
              className={cx(
                "mb-3.5 text-[24px] leading-[1.18] font-bold tracking-tight sm:text-[32px]",
                theme?.heading ?? "text-[#1B1B18]"
              )}
            >
              {data.title}
            </h1>
            {data.shortDescription && (
              <p className={cx("max-w-md text-[14.5px] leading-relaxed", theme?.body ?? "text-[#6E6A60]")}>
                {data.shortDescription}
              </p>
            )}

            <CaseStudyCta data={data} variant="bento" theme={theme} className="mt-4" />
          </div>

          {data.heroPhotoUrl && (
            <div className="min-h-[140px] overflow-hidden rounded-[20px] aspect-[4/3] lg:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project */}
              <img
                src={data.heroPhotoUrl}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {data.headlineStats.slice(0, 2).map((stat) => (
            <div
              key={stat.label}
              className={cx(
                cell,
                "items-center justify-center text-center lg:col-span-2",
                theme?.buttonBg ?? "bg-[#22282E] border-[#22282E]"
              )}
            >
              <div className={cx("text-[32px] leading-none font-extrabold", theme?.buttonText ?? "text-white")}>
                {stat.value}
              </div>
              <div className={cx("mt-1.5 text-[12px] font-semibold", theme?.buttonText ?? "text-[#9FA6AD]")}>
                {stat.label}
              </div>
            </div>
          ))}

          {(data.headlineStats[2] || data.metaRows.length > 0) && (
            <div className={cx(cell, "justify-between lg:col-span-2", theme?.cardBorder ?? "border-[#E4E0D6]", theme?.cardBg ?? "bg-white")}>
              {[
                ...(data.headlineStats[2] ? [{ k: data.headlineStats[2].label, v: data.headlineStats[2].value }] : []),
                ...data.metaRows,
              ].map((row) => (
                <div key={row.k} className="flex justify-between border-b border-[#E4E0D6] py-2.5 last:border-b-0">
                  <span className={cx("text-[12.5px] font-semibold", theme?.body ?? "text-[#6E6A60]")}>{row.k}</span>
                  <span className={cx("text-[13px] font-bold", theme?.heading ?? "text-[#1B1B18]")}>{row.v}</span>
                </div>
              ))}
            </div>
          )}

          {data.fullDescription && (
            <div className={cx(cell, "lg:col-span-6", theme?.cardBorder ?? "border-[#E4E0D6]", theme?.cardBg ?? "bg-white")}>
              <div className="case-narrative case-narrative-bento">{renderNarrative(data.fullDescription, "bento", theme)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
