"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { GraduationCap, Home, Users, type LucideIcon } from "lucide-react";
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
import Link from "next/link";

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

type SwitcherTab = { id: string; label: string; href: string };

/** Placeholder tabs, used only when `elements` has no `dataLink` entries yet. */
const DEFAULT_TABS: SwitcherTab[] = [];

interface HeroProductCard {
  id: string;
  badge: string;
  name: string;
  tag: string;
  href: string;
  stats: { value: string; label: string }[];
}

/** Cycled by card index for the card's icon — Users first (workforce), then GraduationCap (student community), repeating. */
const ICON_CYCLE: LucideIcon[] = [Users, GraduationCap];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the mockup's own Oxyem/Skolrup mini cards. */
const DEFAULT_CARDS: HeroProductCard[] = [];

/** Maps a resolved `contentDetail` entry to one `HeroProductCard` — `badge`/`title`/`category` as the badge/name/tag (`category` here is Contentful's locked "Workforce Management Platform"/"Student Community Platform"-style enum, which happens to fit a card tag well), every `statistic` entry in `statistics` as one stat (`value`/`label`), `slug` (falls back to a slugified `title`) as the anchor this card scrolls to. Card chrome (background/border/badge/text) is themed via `resolveTheme` in the JSX below, not per-card — `contentDetail.accentColor`'s blue/green accent cycling (the same field `AboutProducts`/`ProductShowcase` reuse) doesn't apply to this section. */
function contentDetailToHeroCard(
  entry: PlainEntry<ContentDetailSkeleton>
): HeroProductCard {
  const stats = (entry.fields.statistics ?? [])
    .filter(isEntry)
    .map((stat) => {
      const statistic = stat as unknown as PlainEntry<StatisticSkeleton>;
      return { value: statistic.fields.value, label: statistic.fields.label };
    });

  const name = entry.fields.title ?? "";
  const slug = entry.fields.slug ?? name.trim().toLowerCase().replace(/\s+/g, "-");

  return {
    id: entry.sys.id,
    badge: entry.fields.badge ?? "",
    name,
    tag: entry.fields.category ?? "",
    href: slug ? `#${slug}` : "#",
    stats,
  };
}

/**
 * The `/products` page's hero — a `composableElement` section (`subType:
 * "productsHero"` — see `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-products.html`'s `.products-hero` block, split out the
 * same way `AboutHero`/`ContactHero` were:
 *
 * - the first `dataText` entry among `elements` supplies the breadcrumb
 *   eyebrow, the heading, and the lead paragraph (`text`, rich text)
 * - every `dataLink` entry among `elements` becomes one product-switcher
 *   tab (the reference's "Oxyem — Workforce Platform" / "Skolrup —
 *   Student Community" pills)
 * - every `contentDetail` entry among `elements` becomes one mini
 *   product card (via `contentDetailToHeroCard`) — `badge`/`title`/
 *   `category` as the badge/name/tag, every `statistic` entry in its
 *   `statistics` array as one stat, and its `slug` (falls back to a
 *   slugified `title`) as the in-page anchor it scrolls to (matching the
 *   `id` the paired `ProductShowcase` section renders under)
 *
 * Renders nothing for the breadcrumb eyebrow, the switcher tabs, or
 * the mini product cards when the corresponding entries/fields
 * aren't set in Contentful yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own dark navy identity (grid + glow decoration), so it renders the same
 * as before this existed until an editor sets a `themeColor`. The
 * composableElement's own `backgroundImage` field is an optional full-
 * bleed photo, same convention as `AboutHero`/`AboutStory`; the grid +
 * orb decoration and `ThemePattern`'s dotted backdrop only render when
 * there's no photo. Unlike `AboutProducts`/`ProductShowcase`, the
 * switcher tabs and mini cards here don't cycle through a bespoke blue/
 * green accent — both use this section's one themed button/card look
 * (`theme.buttonBg`/`theme.cardBg`/`theme.cardBorder`/etc.) uniformly.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The hero mini cards get their own scroll-
 * triggered reveal too — a fade + gentle rise + zoom-out (`scale: 1.1` →
 * 1), staggered one after another, same family of treatment `AboutHero`'s
 * own card uses. Both are skipped under `prefers-reduced-motion`. On
 * hover, each card also gets a GSAP "magnetic" 3D tilt that follows the
 * cursor (`rotateX`/`rotateY` driven by pointer position within the
 * card, plus a slight scale-up), resetting smoothly on mouse-leave — a
 * different hover vocabulary from every other card on the site, which
 * only ever animate on enter/leave rather than tracking the pointer
 * continuously. Its badge icon still nudges/pops on plain CSS
 * `group-hover` alongside it, unchanged.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductsHero({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const tabs: SwitcherTab[] = elements
    .filter(
      (element): element is PlainEntry<DataLinkSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "dataLink"
    )
    .map((link) => ({
      id: link.sys.id,
      label: link.fields.label,
      href: resolveLinkHref(link) ?? "#",
    }));

  const cards = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToHeroCard);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const switcherTabs = tabs.length ? tabs : DEFAULT_TABS;
  const heroCards = cards.length ? cards : DEFAULT_CARDS;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/button/card colors.
  // `undefined` for an unset or unrecognized value, in which case every
  // themed class below falls back to the reference's own dark navy
  // identity (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern AboutHero/AboutStory use). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
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

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling section's
     heading). Nothing else in this section animates this way. Skipped
     entirely under prefers-reduced-motion.
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

  /* =========================================================
     CARD REVEAL — the hero mini product cards fade in with a gentle
     rise, zooming out from slightly larger (`scale: 1.1`) down to their
     normal size, staggered one after another. Runs on load rather than
     scroll (this is the hero — it's already in view), same family of
     treatment AboutHero's own overview card uses. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 32,
        scale: 1.1,
        opacity: 0,
        duration: 0.9,
        delay: 0.4,
        ease: "power3.out",
        stagger: 0.15,
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD TILT — a GSAP "magnetic" 3D tilt that tracks the pointer inside
     each mini card: `rotateX`/`rotateY` follow how far the cursor sits
     from the card's center, plus a slight scale-up, easing back to flat
     on mouse-leave. Distinct from every sibling card's own enter/leave-
     only hover (lift+shadow, icon-pop, letter-spacing, pulsing dot, …) —
     this one tracks the pointer continuously instead of a single
     transition. Skipped entirely under `prefers-reduced-motion`.
  ========================================================= */
  const handleCardMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    gsap.to(card, {
      rotateX: (0.5 - relativeY) * 12,
      rotateY: (relativeX - 0.5) * 12,
      scale: 1.02,
      transformPerspective: 800,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleCardMouseLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.to(event.currentTarget, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-[#050e2d]")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
            <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 md:px-10">
        <div className="max-w-4xl">
          {eyebrow && (
            <div
              aria-label="breadcrumb"
              className={cx(
                "inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase ring-1 ring-white/10",
                theme?.eyebrowBg ?? "bg-[rgba(45,125,250,.12)]",
                theme?.eyebrowText ?? "text-[#00d4ff]"
              )}
            >
              <Home size={12} aria-hidden />
              {eyebrow}
            </div>
          )}

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "mt-6 text-[28px] leading-[1.2] max-w-xl font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>

          <div
            className={cx(
              "rich-text mt-5 max-w-xl text-[15px] leading-relaxed",
              theme?.body ?? "text-[#7b93c8]"
            )}
          >
            {description}
          </div>

          {switcherTabs.length > 0 && (
            <div className="mt-9 flex gap-3">
              {/* Same rounded-full pill button (shadow + hover-lift) every
                  other composableElement section's primary CTA uses
                  (AboutHero, HomeAI, AISolutionsHero, …) — one consistent
                  themed button for every tab, not a bespoke bordered pill
                  alternating blue/green by position. */}
              {switcherTabs.map((tab, index) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cx(
                    "z-2 inline-flex items-center gap-2 rounded-full rounded-full px-7 py-3.5 text-[15px] font-semibold tracking-wide uppercase shadow-lg",
                    theme?.buttonBg ?? "bg-[#2F5CFF]",
                    theme?.buttonText ?? "text-white",
                    theme?.buttonHoverBg ?? "hover:bg-[#1E3FCC]"
                  )}
                >
                  {index === 0 ? (
                    <Users size={14} aria-hidden />
                  ) : (
                    <GraduationCap size={14} aria-hidden />
                  )}
                  {tab.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {heroCards.length > 0 && (
          <div ref={cardsRef} className="mt-14 grid gap-5 md:grid-cols-2 z-2 relative">
            {heroCards.map((card, index) => {
              const Icon = ICON_CYCLE[index % ICON_CYCLE.length];

              return (
                <a
                  key={card.id}
                  href={card.href}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  className={cx(
                    "group rounded-2xl border p-7 will-change-transform",
                    theme?.cardBg ?? "bg-white/5",
                    theme?.cardBorder ?? "border-blue-600"
                  )}
                >
                  {/* Same pill-badge treatment as the breadcrumb chip
                      above — one consistent themed badge for every card,
                      not the bespoke blue/green accent pill. Its icon
                      pops slightly on the card's own hover. */}
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase",
                      theme?.eyebrowBg ?? "bg-[rgba(45,125,250,.12)]",
                      theme?.eyebrowText ?? "text-[#00d4ff]"
                    )}
                  >
                    <Icon
                      size={12}
                      aria-hidden
                      className="transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:scale-125"
                    />
                    {card.badge}
                  </span>
                  <p
                    className={cx(
                      "mt-4 text-[26px] font-extrabold tracking-tight",
                      theme?.heading ?? "text-white"
                    )}
                  >
                    {card.name}
                  </p>
                  <p className={cx("mt-1 text-[13px]", theme?.body ?? "text-[#7b93c8]")}>
                    {card.tag}
                  </p>

                  {card.stats.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-6">
                      {card.stats.map((stat) => (
                        <div key={stat.label}>
                          <p
                            className={cx(
                              "text-[20px] font-extrabold leading-none",
                              theme?.heading ?? "text-white"
                            )}
                          >
                            {stat.value}
                          </p>
                          <p
                            className={cx(
                              "mt-1 text-[10px] tracking-wide uppercase",
                              theme?.body ?? "text-[#7b93c8]"
                            )}
                          >
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
