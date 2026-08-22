"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowRight, BarChart3, Compass, Handshake, type LucideIcon } from "lucide-react";
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
} from "../types/contentful";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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

interface Article {
  id: string;
  title: string;
  tag?: string;
  thumbUrl?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

/** Cycled by card index as a fallback when a `contentDetail` entry has no `heroImage` set. */
const FALLBACK_ICONS: LucideIcon[] = [BarChart3, Compass, Handshake];

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_ARTICLES: Article[] = [];

/** Maps a resolved `contentDetail` entry to one article card — `title` as the headline, `badge` as the small tag label (`category` is a locked business-catalog enum used for a different meaning elsewhere, so it doesn't fit a free-text tag here), `heroImage` as the thumbnail, the first `dataLink` in `cta` as "Read the article". */
function contentDetailToArticle(entry: PlainEntry<ContentDetailSkeleton>): Article {
  const heroImageEntry = entry.fields.heroImage;
  const thumbUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
        (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const ctaLink = entry.fields.cta?.find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;

  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    tag: entry.fields.badge,
    thumbUrl,
    ctaHref: ctaLink ? resolveLinkHref(ctaLink) : undefined,
    ctaLabel: ctaLink?.fields.label,
  };
}

/**
 * The `/landing-page` "Insights" teaser grid — a `composableElement`
 * section (`subType: "landingInsights"` — see `ComposableElementRenderer`),
 * ported from `Refrence/oxytal-landing-page.html`'s `.insights-grid`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading (left) and support paragraph (right, `text` rich text)
 * - every `contentDetail` entry among `elements` becomes one article card
 *   — `title` as the headline, `category` as the small tag above it,
 *   `heroImage` as the thumbnail (falls back to a cycled Lucide icon
 *   tile), and the first `dataLink` in `cta` as the "Read the article"
 *   link
 *
 * Renders nothing when `elements` has no `contentDetail` entries — no
 * hardcoded placeholder roster.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`. Cards fade + rise
 * in with a stagger as the grid scrolls into view; each card's thumbnail
 * zooms in slightly on hover while its "Read the article" link's arrow
 * slides right — a lighter, more editorial hover than every sibling
 * section's card treatment (no lift, no shadow — just the photo and the
 * link reacting). Skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingInsights({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailArticles = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToArticle);
  const articles = contentDetailArticles.length ? contentDetailArticles : DEFAULT_ARTICLES;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;

  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!cardsRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 26,
        opacity: 0,
        duration: 0.65,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: cardsRef.current, start: "top 85%", once: true },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  const handleThumbEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;

    const card = event.currentTarget.closest("[data-article-card]");
    const img = card?.querySelector<HTMLElement>("[data-article-thumb]");
    if (img) gsap.to(img, { scale: 1.08, duration: 0.5, ease: "power2.out" });

    const arrow = card?.querySelector<HTMLElement>("[data-article-arrow]");
    if (arrow) gsap.to(arrow, { x: 4, duration: 0.3, ease: "power2.out" });
  };

  const handleThumbLeave = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;

    const card = event.currentTarget.closest("[data-article-card]");
    const img = card?.querySelector<HTMLElement>("[data-article-thumb]");
    if (img) gsap.to(img, { scale: 1, duration: 0.4, ease: "power2.out" });

    const arrow = card?.querySelector<HTMLElement>("[data-article-arrow]");
    if (arrow) gsap.to(arrow, { x: 0, duration: 0.3, ease: "power2.out" });
  };

  if (!eyebrow && !heading && !articles.length) {
    return null;
  }

  return (
    <section className={cx("relative overflow-hidden py-16 md:py-20", backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white"))} style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                                  <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
                                </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            {eyebrow && (
              <span className={cx("inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", theme?.eyebrowBg ?? "bg-blue-50", theme?.eyebrowText ?? "text-blue-700")}>
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")} className={cx("mt-3.5 max-w-md text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}>
                {heading}
              </DynamicHeading>
            )}
          </div>
        </div>

        {articles.length > 0 && (
          <div ref={cardsRef} className="mt-11 grid gap-6 md:grid-cols-3">
            {articles.map((article, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <div key={article.id} data-article-card className={cx("flex flex-col overflow-hidden rounded-2xl border", theme?.cardBorder ?? "border-gray-100", theme?.cardBg ?? "bg-white shadow-sm")}>
                  <div
                    onMouseEnter={handleThumbEnter}
                    onMouseLeave={handleThumbLeave}
                    className={cx("relative flex h-36 items-center justify-center overflow-hidden", theme?.sectionBg ?? "bg-gray-900")}
                  >
                    {article.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img data-article-thumb src={article.thumbUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <FallbackIcon data-article-thumb size={28} className={theme?.accentText ?? "text-blue-400"} aria-hidden />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    {article.tag && (
                      <span className={cx("mb-2.5 text-[11.5px] font-bold tracking-wide uppercase", theme?.accentText ?? "text-blue-600")}>{article.tag}</span>
                    )}
                    <h4 className={cx("flex-1 text-[16px] leading-snug font-bold", theme?.heading ?? "text-gray-900")}>{article.title}</h4>
                    {article.ctaHref && (
                      <a
                        href={article.ctaHref}
                        onMouseEnter={handleThumbEnter}
                        onMouseLeave={handleThumbLeave}
                        className={cx("mt-4 inline-flex w-fit items-center gap-1.5 text-[13.5px] font-bold", theme?.accentText ?? "text-blue-600")}
                      >
                        {article.ctaLabel}
                        <ArrowRight data-article-arrow size={14} aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
