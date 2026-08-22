"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { ArrowRight, ShieldCheck, TrendingUp, Boxes, FileText, type LucideIcon } from "lucide-react";
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface Card {
  id: string;
  title: string;
  description: string;
  metric?: string;
  iconUrl?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

/** Cycled by card index as a fallback when a `serviceCard` entry has no `icon`/`heroImage` set. */
const FALLBACK_ICONS: LucideIcon[] = [ShieldCheck, TrendingUp, Boxes, FileText];

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_CARDS: Card[] = [];

/** Maps a resolved `serviceCard` entry to one `Card`. */
function serviceCardToCard(entry: PlainEntry<ServiceCardSkeleton>): Card {
  const iconEntry = entry.fields.icon ?? entry.fields.heroImage;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const ctaEntry = entry.fields.cta;
  const ctaLink = isEntry(ctaEntry)
    ? (ctaEntry as unknown as PlainEntry<DataLinkSkeleton>)
    : undefined;

  return {
    id: entry.sys.id,
    title: entry.fields.title,
    description: entry.fields.shortDescription,
    metric: entry.fields.metric,
    iconUrl,
    ctaHref: ctaLink ? resolveLinkHref(ctaLink) : undefined,
    ctaLabel: ctaLink?.fields.label,
  };
}

/**
 * The `/landing-page` "What we cover" cards — a `composableElement`
 * section (`subType: "landingCards"` — see `ComposableElementRenderer`),
 * ported from `Refrence/oxytal-landing-page.html`'s `.cards-grid`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading (left) and support paragraph (right, `text` rich text)
 * - every `serviceCard` entry among `elements` becomes one card
 *   (`title`/`shortDescription`/`icon` or `heroImage`/`metric`/`cta`) —
 *   `metric` is the small highlight badge above the title (e.g. "↓ 40%
 *   scoping time"), renders nothing when unset
 *
 * Renders nothing when `elements` has no `serviceCard` entries — no
 * hardcoded placeholder roster.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`. Heading gets this
 * site's standard split-text scroll reveal; the cards fade + rise in with
 * a stagger. Each card's own hover lifts it while its icon tile pops with
 * a spring scale + rotation — distinct from `ContactStats`'/`ContactFaq`'s
 * icon treatments (no ring, no color shift, just a snappy tile pop).
 * Skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingCards({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const serviceCardEntries = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map(serviceCardToCard);
  const cards = serviceCardEntries.length ? serviceCardEntries : DEFAULT_CARDS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const support: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

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
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!headingRef.current) return;

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
            scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  useLayoutEffect(() => {
    if (!cardsRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: cardsRef.current, start: "top 85%", once: true },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD HOVER — the card lifts with a soft shadow while its icon
     tile pops with a springy scale + slight rotation (back.out),
     reverting on leave. Distinct from every sibling section's icon
     hover in this codebase (no ring, no color cycle — just a snappy
     tile pop). Skipped under prefers-reduced-motion.
  ========================================================= */
  const handleEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const card = event.currentTarget;
    gsap.to(card, { y: -6, boxShadow: "0 20px 40px -20px rgba(16,24,40,0.18)", duration: 0.35, ease: "power2.out" });

    const icon = card.querySelector<HTMLElement>("[data-card-icon]");
    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1.15, rotate: 8, duration: 0.5, ease: "back.out(2.4)" });
    }
  };

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const card = event.currentTarget;
    gsap.to(card, { y: 0, duration: 0.4, ease: "power2.out", clearProps: "boxShadow" });

    const icon = card.querySelector<HTMLElement>("[data-card-icon]");
    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.4, ease: "power2.out" });
    }
  };

  if (!eyebrow && !heading && !support && !cards.length) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={cx("relative overflow-hidden py-16 md:py-24", backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white"))}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div>
            {eyebrow && (
              <span className={cx("inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", theme?.eyebrowBg ?? "bg-blue-50", theme?.eyebrowText ?? "text-blue-700")}>
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading
                level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
                ref={headingRef}
                className={cx("mt-3.5 max-w-2xl text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}
              >
                {heading}
              </DynamicHeading>
            )}
          </div>
          {support && (
            <div className={cx("rich-text max-w-md text-[15px] leading-relaxed", theme?.body ?? "text-gray-500")}>
              {support}
            </div>
          )}
        </div>

        {cards.length > 0 && (
          <div ref={cardsRef} className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <div
                  key={card.id}
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                  className={cx("flex flex-col rounded-2xl border p-6", theme?.cardBorder ?? "border-gray-100", theme?.cardBg ?? "bg-white shadow-sm")}
                >
                  <span
                    data-card-icon
                    className={cx("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", theme?.eyebrowBg ?? "bg-blue-50", theme?.accentText ?? "text-blue-600")}
                  >
                    {card.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img src={card.iconUrl} alt="" aria-hidden className="h-5.5 w-5.5 object-contain" />
                    ) : (
                      <FallbackIcon size={22} aria-hidden />
                    )}
                  </span>

                  {card.metric && (
                    <span className={cx("mb-3.5 inline-block w-fit rounded-full px-3 py-1.5 text-[12.5px] font-bold", theme?.eyebrowBg ?? "bg-gray-50", theme?.heading ?? "text-gray-900")}>
                      {card.metric}
                    </span>
                  )}

                  <h3 className={cx("text-[18px] font-extrabold", theme?.heading ?? "text-gray-900")}>{card.title}</h3>
                  <p className={cx("mt-2.5 flex-1 text-[14.5px] leading-relaxed", theme?.body ?? "text-gray-500")}>{card.description}</p>

                  {card.ctaHref && (
                    <a href={card.ctaHref} className={cx("mt-4 inline-flex w-fit items-center gap-1.5 text-[14px] font-bold", theme?.accentText ?? "text-blue-600")}>
                      {card.ctaLabel}
                      <ArrowRight size={14} aria-hidden />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
