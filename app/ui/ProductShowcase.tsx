"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  ArrowRightCircle,
  CalendarCheck,
  CheckCircle2,
  Lightbulb,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/AboutHero use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * `contentDetail.accentColor` in Contentful is a locked enum of exactly
 * `"blue"`/`"yellow"` (the same field `AboutProducts` reuses) — there's no
 * "green" option. This component still wants a distinct blue/green
 * Oxyem/Skolrup identity (matching the reference mockup), so it keeps
 * "yellow" as the CMS-valid value for the second product but renders it
 * with the green palette below (`ACCENT_STYLES.yellow`) instead of an
 * actual yellow one.
 */
type Accent = "blue" | "yellow";

/** Normalizes `contentDetail.accentColor` to one of the two enum values. Returns `undefined` for an unset or unrecognized value, so the caller can fall back to the "blue" default. */
function resolveAccentColor(value?: string): Accent | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized === "blue" || normalized === "yellow" ? normalized : undefined;
}

interface Differentiator {
  id: string;
  title: string;
  description: string;
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
}

const ACCENT_STYLES: Record<
  Accent,
  {
    headerGradient: string;
    badge: string;
    valueBoxBorder: string;
    valueBoxBg: string;
    chipStripBg: string;
    chipStripLabel: string;
    chipIcon: string;
    diffIcon: string;
    diffBg: string;
    ctaButton: string;
    ctaOutline: string;
    watermark: string;
    featureAccentBar: string;
  }
> = {
  blue: {
    headerGradient: "bg-gradient-to-br from-[#040e2d] via-[#0a2885] to-[#1450d4]",
    badge: "bg-white/12 text-white/90 ring-1 ring-white/20",
    valueBoxBorder: "border-l-4 border-[#1450d4]",
    valueBoxBg: "bg-gradient-to-br from-[#e8f1ff] to-[#d4e8ff]",
    chipStripBg: "bg-[#e8f1ff]",
    chipStripLabel: "text-[#1450d4]",
    chipIcon: "text-[#1450d4]",
    diffIcon: "text-[#1450d4]",
    diffBg: "bg-[#e8f1ff] border border-[#dce8ff]",
    ctaButton:
      "bg-gradient-to-r from-[#1450d4] to-[#2d7dfa] shadow-[0_5px_22px_rgba(45,125,250,.4)] hover:shadow-[0_10px_32px_rgba(45,125,250,.6)]",
    ctaOutline: "border-[#1450d4] text-[#1450d4] hover:bg-[#1450d4] hover:text-white",
    watermark: "text-[rgba(20,80,212,.06)]",
    featureAccentBar: "from-[#1450d4] to-[#00d4ff]",
  },
  // Contentful-valid value is "yellow" (see the `Accent` comment above) —
  // styled green here to preserve Skolrup's reference-mockup identity.
  yellow: {
    headerGradient: "bg-gradient-to-br from-[#031a0e] via-[#0a4a2a] to-[#22b060]",
    badge: "bg-white/12 text-white/90 ring-1 ring-white/20",
    valueBoxBorder: "border-l-4 border-[#22b060]",
    valueBoxBg: "bg-gradient-to-br from-[#e8fff2] to-[#c8f5dc]",
    chipStripBg: "bg-[#e8fff2]",
    chipStripLabel: "text-[#1a8040]",
    chipIcon: "text-[#22b060]",
    diffIcon: "text-[#22b060]",
    diffBg: "bg-[#e8fff2] border border-[#c8f5dc]",
    ctaButton:
      "bg-gradient-to-r from-[#1a8040] to-[#22b060] shadow-[0_5px_22px_rgba(34,176,96,.38)] hover:shadow-[0_10px_32px_rgba(34,176,96,.55)]",
    ctaOutline: "border-[#22b060] text-[#22b060] hover:bg-[#22b060] hover:text-white",
    watermark: "text-[rgba(34,176,96,.05)]",
    featureAccentBar: "from-[#22b060] to-[#a8f0c8]",
  },
};

/**
 * One reusable "product overview" section for the `/products` page —
 * a `composableElement` (`subType: "productShowcase"` — see
 * `ComposableElementRenderer`), ported from `Refrence/oxytal-products.html`'s
 * `.oxyem-section`/`.skolrup-section` blocks. Both are the same layout with
 * different content and a mirrored column order, so this one component is
 * meant to be instantiated twice in Contentful (once per product) rather
 * than duplicated into two files:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow
 *   (e.g. "Product 01"), heading, and intro paragraph (`text`, rich text)
 * - a 2nd `dataText` entry supplies the "Why it works" callout: its
 *   `eyebrow` is the callout title (e.g. "💡 Why Oxyem Works"), its `text`
 *   the body — same "reuse a secondary dataText" pattern `AboutHero`'s
 *   overview card / `HomeAI`'s proof callout use
 * - a 3rd `dataText` entry supplies the side column's own heading + intro
 *   paragraph ("Built for the Teams Running Your Organisation")
 * - the first `contentDetail` entry is the product card itself: `badge`,
 *   `title` (product name), `industry` (tagline — `category` is a locked
 *   Contentful enum of business-catalog values and doesn't fit free-text
 *   taglines, so this reuses `industry` instead), `shortDescription`
 *   (card body), `heroImage` (optional photo replacing the gradient
 *   header), `accentColor` ("blue"/"yellow" — Contentful's enum has no
 *   "green", so "yellow" renders as this section's green identity instead,
 *   see the `Accent` type below; also drives every other accented element
 *   in this section), and its `cta` array — the `dataLink` with `type:
 *   "primary"` becomes the solid button, any other becomes the outline
 *   button
 * - every `statistic` entry among `elements` becomes one "who uses this"
 *   chip (`label`)
 * - every *other* `contentDetail` entry (i.e. excluding the first) becomes
 *   one key-differentiator card (`title`/`shortDescription`)
 * - every `serviceCard` entry among `elements` becomes one core-feature
 *   grid item (`title`/`shortDescription`/`icon`) — same content type
 *   `HomeServices` reuses
 *
 * `textStart` on the composableElement ("left"/"right") controls which
 * side the product card renders on — "left" (default) puts it first
 * (the Oxyem layout), "right" mirrors it to the end (the Skolrup layout),
 * matching the reference's `order-lg-1`/`order-lg-2` swap.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own plain white background. The composableElement's own `backgroundImage`
 * field is an optional full-bleed photo, same convention as every sibling
 * section; `ThemePattern`'s dotted backdrop and the giant faint watermark
 * word (the product name) only render when there's no photo.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The product card gets its own scroll-triggered
 * reveal too — a fade + rise + zoom-out, same family of treatment
 * `AboutHero`'s overview card uses — and the differentiator/feature grids
 * each get a fade + rise stagger as they scroll into view. All skipped
 * under `prefers-reduced-motion`. The product card also lifts with a
 * deeper shadow on hover, its header band zooming in slightly inside it
 * — plain CSS `hover`/`group-hover`, not GSAP, same convention every
 * other section's own card hover uses.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductShowcase({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const valueBoxEntry = dataTextEntries[1];
  const sideEntry = dataTextEntries[2];

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const productEntry = contentDetailEntries[0];
  const differentiators: Differentiator[] = contentDetailEntries
    .slice(1)
    .map((detail) => ({
      id: detail.sys.id,
      title: detail.fields.title ?? "",
      description: detail.fields.shortDescription ?? "",
    }));

  const chips = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map((stat) => stat.fields.label);

  const features: FeatureItem[] = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map((card) => {
      const iconEntry = card.fields.icon;
      return {
        id: card.sys.id,
        title: card.fields.title,
        description: card.fields.shortDescription,
        iconUrl: isEntry(iconEntry)
          ? getAssetUrl(
              (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields
                .image
            )
          : undefined,
      };
    });

  // "Product" is a generic structural eyebrow label (like Footer's
  // column titles), not invented marketing copy, so it keeps its
  // default.
  const eyebrow = copy?.fields.eyebrow ?? "Product";
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const valueBoxTitle = valueBoxEntry?.fields.eyebrow;
  const valueBoxText = valueBoxEntry?.fields.text
    ? documentToReactComponents(valueBoxEntry.fields.text)
    : null;

  const sideHeading = sideEntry?.fields.heading;
  const sideText = sideEntry?.fields.text
    ? documentToReactComponents(sideEntry.fields.text)
    : null;

  const accent = resolveAccentColor(productEntry?.fields.accentColor) ?? "blue";
  const styles = ACCENT_STYLES[accent];

  const productName = productEntry?.fields.title ?? "";
  const productBadge = productEntry?.fields.badge ?? "";
  // `category` is a locked Contentful enum of business-catalog values
  // ("Featured", "Workforce Management Platform", …) — doesn't fit a
  // free-text tagline, so this reuses `industry` instead (see the
  // component doc comment above).
  const productTag = productEntry?.fields.industry ?? "";
  const productDescription = productEntry?.fields.shortDescription ?? "";
  const productSlug =
    productEntry?.fields.slug ??
    productName.trim().toLowerCase().replace(/\s+/g, "-");

  const ctaLinks = (productEntry?.fields.cta ?? []).filter(isEntry) as unknown as PlainEntry<DataLinkSkeleton>[];
  const primaryCta = ctaLinks.find((link) => link.fields.type === "primary");
  const secondaryCta = ctaLinks.find((link) => link.fields.type !== "primary");

  const heroImageEntry = productEntry?.fields.heroImage;
  const heroImageUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
        (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
          .image
      )
    : undefined;

  // "left" (default) puts the product card first — the reference's Oxyem
  // layout; "right" mirrors it to the end — the reference's Skolrup layout.
  const cardOnRight = entry?.fields.textStart === "right";

  const theme = resolveTheme(entry?.fields.themeColor);

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
  const diffRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

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
     PRODUCT CARD REVEAL — fades in with a gentle rise, zooming out from
     slightly larger (`scale: 1.08`) down to its normal size, same family
     of treatment AboutHero's overview card uses. Skipped entirely under
     prefers-reduced-motion.
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
        scale: 1.08,
        opacity: 0,
        duration: 0.9,
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

  /* =========================================================
     DIFFERENTIATOR REVEAL — fade + rise with a stagger as the grid
     scrolls into view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!diffRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(diffRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(diffRef.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: diffRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, diffRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     FEATURE GRID REVEAL — fade + rise with a stagger as the grid scrolls
     into view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!featuresRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(featuresRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(featuresRef.current!.children, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, featuresRef);

    return () => ctx.revert();
  }, []);

  const productCard = (
    <div
      ref={cardRef}
      className="group overflow-hidden rounded-[20px] shadow-[0_24px_60px_rgba(20,80,212,.15)] transition-all duration-300 ease-out z-2 relative hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(20,80,212,.28)]"
    >
      {/* The header — gradient/hero-image band at the top — zooms in
          slightly on the card's own hover, clipped to the card's rounded
          corners by this element's own `overflow-hidden` above. */}
      <div
        className={cx(
          "relative z-2 flex min-h-[220px] flex-col justify-between overflow-hidden p-8 md:p-10 transition-transform duration-500 ease-out group-hover:scale-[1.03]",
          !heroImageUrl && styles.headerGradient
        )}
        style={
          heroImageUrl
            ? {
                backgroundImage: `url(${heroImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!heroImageUrl && (
          <>
            <div
              aria-hidden
              className="absolute -top-16 -right-14 h-56 w-56 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-8 -left-6 h-36 w-36 rounded-full bg-white/10 blur-2xl"
            />
          </>
        )}
        <span
          className={cx(
            "relative z-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase",
            styles.badge
          )}
        >
          {productBadge}
        </span>
        <div className="relative z-2">
          <p className="text-[36px] leading-none font-extrabold tracking-tight text-white md:text-[44px]">
            {productName}
          </p>
          <p className="mt-2 max-w-sm text-[14px] text-white/65">
            {productTag}
          </p>
        </div>
      </div>

      <div className={cx("p-8 md:p-10", theme?.cardBg ?? "bg-white")}>
        <p
          className={cx(
            "text-[14px] leading-relaxed",
            theme?.body ?? "text-[#5a6f99]"
          )}
        >
          {productDescription}
        </p>

        {(valueBoxTitle || valueBoxText) && (
          <div className={cx("mt-6 rounded-2xl p-6", styles.valueBoxBorder, styles.valueBoxBg)}>
            <p className="flex items-center gap-2 text-[15px] font-bold text-[#0d1b3e]">
              <Lightbulb size={16} aria-hidden />
              {valueBoxTitle}
            </p>
            <div className="rich-text mt-2 text-[13.5px] leading-relaxed text-[#3a5ba0]">
              {valueBoxText}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {primaryCta && (
            <a
              href={resolveLinkHref(primaryCta) ?? "#"}
              className={cx(
                "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[13px] font-bold tracking-wide text-white uppercase transition-shadow duration-300",
                styles.ctaButton
              )}
            >
              <ArrowRightCircle size={15} aria-hidden />
              {primaryCta.fields.label}
            </a>
          )}
          {secondaryCta && (
            <a
              href={resolveLinkHref(secondaryCta) ?? "#"}
              className={cx(
                "inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-[13px] font-semibold tracking-wide uppercase transition-colors duration-200",
                styles.ctaOutline
              )}
            >
              <CalendarCheck size={15} aria-hidden />
              {secondaryCta.fields.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const sideColumn = (
    <div className="relative z-2">
      {sideHeading && (
        <h3 className={cx("text-[19px] font-bold", theme?.heading ?? "text-[#050e2d]")}>
          {sideHeading}
        </h3>
      )}
      <div
        className={cx(
          "rich-text mt-4 text-[14.5px] leading-relaxed",
          theme?.body ?? "text-[#5a6f99]"
        )}
      >
        {sideText}
      </div>

      {chips.length > 0 && (
        <div className={cx("mt-6 flex flex-wrap items-center gap-4 rounded-xl p-6", styles.chipStripBg)}>
          <span className={cx("text-[11px] font-bold tracking-wide uppercase", styles.chipStripLabel)}>
            Who Uses It
          </span>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dce8ff] bg-white px-3 py-1 text-[12.5px] font-semibold text-[#3a5ba0]"
              >
                <CheckCircle2 size={13} className={styles.chipIcon} aria-hidden />
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}

      {differentiators.length > 0 && (
        <div ref={diffRef} className="mt-5 grid gap-3 sm:grid-cols-2">
          {differentiators.map((item) => (
            <div key={item.id} className={cx("rounded-xl p-5", styles.diffBg)}>
              <CheckCircle2 size={18} className={cx("mb-2", styles.diffIcon)} aria-hidden />
              <p className="text-[14px] font-bold text-[#050e2d]">{item.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#5a6f99]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id={productSlug || undefined}
      aria-labelledby={productSlug ? `${productSlug}-heading` : undefined}
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
            <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? (accent === "blue" ? "bg-blue-50" : "bg-emerald-50"),
                theme?.eyebrowText ?? (accent === "blue" ? "text-blue-700" : "text-emerald-700")
              )}
            >
              {eyebrow}
            </span>
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              id={productSlug ? `${productSlug}-heading` : undefined}
              className={cx(
                "mt-4 text-[26px] leading-[1.15] font-extrabold tracking-tight sm:text-[32px] md:text-[38px]",
                theme?.heading ?? "text-[#050e2d]"
              )}
            >
              {heading}
            </DynamicHeading>
          </div>
          <div
            className={cx(
              "rich-text text-[15px] leading-relaxed lg:col-span-5 lg:col-start-8",
              theme?.body ?? "text-[#5a6f99]"
            )}
          >
            {description}
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className={cx("lg:col-span-5", cardOnRight ? "lg:order-2" : "lg:order-1")}>
            {productCard}
          </div>
          <div className={cx("lg:col-span-7", cardOnRight ? "lg:order-1" : "lg:order-2")}>
            {sideColumn}
          </div>
        </div>

        {features.length > 0 && (
          <div className="mt-16">
            <h3 className={cx("text-[19px] font-bold", theme?.heading ?? "text-[#050e2d]")}>
              Core Features
            </h3>
            <div
              ref={featuresRef}
              className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[#e0ebff] bg-[#e8f0ff] sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className={cx(
                    "group relative overflow-hidden p-6 transition-colors duration-200 hover:bg-[#e8f1ff]",
                    theme?.cardBg ?? "bg-white"
                  )}
                >
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100",
                      styles.featureAccentBar
                    )}
                  />
                  <div
                    className={cx(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      styles.diffBg
                    )}
                  >
                    {feature.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={feature.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <CheckCircle2 size={18} className={styles.diffIcon} aria-hidden />
                    )}
                  </div>
                  <p className="mt-3 text-[14px] font-bold text-[#050e2d]">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#5a6f99]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
