"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, Check, Layers } from "lucide-react";
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeAI/AboutHero use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface ProductItem {
  id: string;
  accent: "blue" | "yellow";
  badge: string;
  name: string;
  tag: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

/** Cycled by item index as a fallback when there's no dedicated accent field on `contentDetail` — blue first, green second, repeating. */
const ACCENT_CYCLE: ProductItem["accent"][] = ["blue", "yellow"];

/** Fixed hex per accent, ported from `Refrence/tech-platforms-section.html`'s own `--blue`/`--orange` custom properties — reused for the GSAP hover glow (see `handleProductEnter`) so the shadow tint actually matches the card's own identity instead of a generic gray. ("yellow" is the internal label already matched against Contentful's `accentColor` value; the reference's actual color for it is an orange, not a true yellow.) */
const ACCENT_HEX: Record<ProductItem["accent"], string> = {
  blue: "#2451D6",
  yellow: "#F0921E",
};

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 2-card showcase. */
const DEFAULT_PRODUCTS: ProductItem[] = [];

/** Normalizes `contentDetail.accentColor` (free text in Contentful — case/whitespace can vary) to one of the two supported accents. Returns `undefined` for an unset or unrecognized value, so the caller can fall back to cycling by array position instead. */
function resolveAccentColor(value?: string): ProductItem["accent"] | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized === "blue" || normalized === "yellow" ? normalized : undefined;
}

/** Maps a resolved `contentDetail` entry (plus its array position) to one `ProductItem` — `title` as the product name, `badge` as the category tag, `category` as the subtitle line, `shortDescription` as the body copy, every `statistic` entry in `statistics` as one feature-checklist item (`label`; `value` unused), `cta`'s first `dataLink` as the CTA button. Accent (blue/orange) comes from `accentColor` when set to a recognized value, otherwise cycles by array position. */
function contentDetailToProductItem(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): ProductItem {
  const features = (entry.fields.statistics ?? [])
    .filter(isEntry)
    .map((stat) => (stat as unknown as PlainEntry<StatisticSkeleton>).fields.label);

  const ctaLink = (entry.fields.cta ?? []).find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;

  return {
    id: entry.sys.id,
    accent:
      resolveAccentColor(entry.fields.accentColor) ??
      ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    badge: entry.fields.badge ?? "",
    name: entry.fields.title ?? "",
    tag: entry.fields.category ?? "",
    description: entry.fields.shortDescription ?? "",
    features,
    ctaLabel: ctaLink?.fields.label ?? "",
    ctaHref: (ctaLink && resolveLinkHref(ctaLink)) ?? "#",
  };
}

/**
 * The About page's "Products" section — a `composableElement` section
 * (`subType: "aboutProducts"` — see `ComposableElementRenderer`), split
 * out of `AboutPage` the same way `AboutHero`/`AboutStats`/`AboutStory`/
 * `AboutServices`/`AboutApproach` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one product
 *   card (via `contentDetailToProductItem`) — see that function's own
 *   comment for the full field mapping; add/remove/reorder
 *   `contentDetail` entries in Contentful to change the roster, nothing
 *   here needs to change
 *
 * The eyebrow, heading, and description each render exactly what's in
 * Contentful — the eyebrow is simply omitted when unset, and the
 * product grid only renders the `contentDetail` entries that actually
 * exist — no invented placeholder copy or products.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * plain white/blue look, so it renders the same as before this existed
 * until an editor sets a `themeColor`. The per-card blue/orange accent
 * (icon-mark, category tag, feature-check circles, CTA button, corner
 * glow) is independent of that section-wide theme — set via each
 * `contentDetail` entry's own `accentColor` field ("blue" or "yellow"),
 * falling back to cycling by card position when unset (see
 * `resolveAccentColor`).
 *
 * Card layout is a close, Contentful-driven port of
 * `Refrence/tech-platforms-section.html` (the "Our Own Technology
 * Platforms" mockup this section has always been built from): a flat
 * white card, a small accent-gradient icon-mark next to a category tag
 * pill, product name/subtitle, body copy, a two-column checklist of
 * `statistic` entries (each with its own accent check-circle), and a
 * gradient CTA button — rather than the fuller-bleed colored "hero
 * panel" a prior pass on this section used. The icon-mark's glyph is a
 * single fixed `Layers` icon tinted per accent, standing in for the
 * reference's two hand-picked per-category SVGs (a people icon for
 * "Workforce Technology", a graduation cap for "Edtech Platform") — kept
 * generic since this roster isn't limited to just those two categories
 * going forward.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field AboutHero/AboutStats/AboutStory/
 * AboutServices/AboutApproach use) is an *optional* full-bleed section
 * background — no placeholder fallback, so the section just shows its
 * themed background color until an editor sets one. `ThemePattern`'s
 * dotted backdrop only renders when there's no background photo, same
 * call every sibling section makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The product cards get their own scroll-
 * triggered load animation too — a fade + rise, staggered one card
 * after another as the grid scrolls into view. Each card also gets its
 * own GSAP hover: it lifts with a shadow tinted in that card's own
 * accent color (blue or orange, via `ACCENT_HEX` — the reference's own
 * hover only lifts with a neutral shadow, this keeps the extra per-card
 * identity from the earlier pass), its icon-mark and corner glow pulse
 * slightly, and the CTA's arrow nudges right — see the CARD HOVER
 * comment below. All of this is skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutProducts({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailProducts = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map((detailEntry, index) => contentDetailToProductItem(detailEntry, index));

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const products = contentDetailProducts.length
    ? contentDetailProducts
    : DEFAULT_PRODUCTS;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own plain white/blue look (today's
  // look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern AboutHero/AboutStats/AboutStory/AboutServices/AboutApproach
  // use). Optional here: no placeholder fallback, so it's simply absent
  // until an editor sets one.
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
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/AboutHero/AboutStory/AboutServices/
     AboutApproach). Nothing else in this section animates. Skipped
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
     CARD REVEAL — the product cards fade + rise into place with a
     stagger as the grid scrolls into view (same load treatment several
     sibling About sections use). Hover is handled separately by CARD
     HOVER below. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.5,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD HOVER — the reference mockup's own hover is a plain CSS
     lift + neutral shadow (`.tech-card:hover`); this keeps that lift but
     tints the shadow in *that card's own* accent color (blue or orange —
     see `ACCENT_HEX`) and adds two small flourishes the flat reference
     card has room for: the icon-mark nudges up/scales slightly, the
     corner glow blooms a touch, and the CTA's arrow nudges a step to the
     right. GSAP rather than CSS so the tint color and the lift can run
     as one coordinated tween. Skipped under prefers-reduced-motion — the
     card just stays put.
  ========================================================= */
  const handleProductEnter = (
    event: React.MouseEvent<HTMLElement>,
    accent: ProductItem["accent"]
  ) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-product-icon]");
    const glow = card.querySelector<HTMLElement>("[data-product-glow]");
    const ctaIcon = card.querySelector<HTMLElement>("[data-product-cta-icon]");
    const hex = ACCENT_HEX[accent];

    gsap.to(card, {
      y: -4,
      boxShadow: `0 24px 48px -20px ${hex}40`,
      duration: 0.4,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, { scale: 1.08, rotate: -4, duration: 0.4, ease: "back.out(2)" });
    }

    if (glow) {
      gsap.to(glow, { scale: 1.15, opacity: 0.8, duration: 0.6, ease: "power2.out" });
    }

    if (ctaIcon) {
      gsap.to(ctaIcon, { x: 4, duration: 0.35, ease: "power2.out" });
    }
  };

  const handleProductLeave = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-product-icon]");
    const glow = card.querySelector<HTMLElement>("[data-product-glow]");
    const ctaIcon = card.querySelector<HTMLElement>("[data-product-cta-icon]");

    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      clearProps: "boxShadow",
    });

    if (icon) {
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.35, ease: "power2.out" });
    }

    if (glow) {
      gsap.to(glow, { scale: 1, opacity: 0.5, duration: 0.5, ease: "power2.out" });
    }

    if (ctaIcon) {
      gsap.to(ctaIcon, { x: 0, duration: 0.3, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="products"
      aria-labelledby="products-heading"
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

      <div className="container mx-auto px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            {eyebrow && (
              <span
                className={cx(
                  "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                  theme?.eyebrowBg ?? "bg-blue-50",
                  theme?.eyebrowText ?? "text-blue-700"
                )}
              >
                {eyebrow}
              </span>
            )}
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              id="products-heading"
              className={cx(
                "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] max-w-md",
                theme?.heading ?? "text-gray-900"
              )}
            >
              {heading}
            </DynamicHeading>
          </div>
          <div
            className={cx(
              "rich-text text-[15px] leading-relaxed lg:col-span-5 lg:col-start-8",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-7 lg:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.id}
              onMouseEnter={(event) => handleProductEnter(event, product.accent)}
              onMouseLeave={handleProductLeave}
              className={cx(
                "relative overflow-hidden rounded-[22px] border z-1 p-8 shadow-[0_1px_2px_rgba(21,26,45,0.04)] md:p-10",
                theme?.cardBg ?? "bg-white",
                theme?.cardBorder ?? "border-[#EDEAE1]"
              )}
            >
              {/* Corner glow — fixed per accent, same "flourish stays
                  fixed" convention every other section's own background
                  accents use; ported from the reference's `.card-glow`. */}
              <div
                aria-hidden
                data-product-glow
                className={cx(
                  "pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-50 blur-2xl",
                  product.accent === "blue"
                    ? "bg-[radial-gradient(circle,rgba(36,81,214,0.3),transparent_70%)]"
                    : "bg-[radial-gradient(circle,rgba(240,146,30,0.35),transparent_70%)]"
                )}
              />

              <div className="relative z-2 flex items-center gap-4">
                <span
                  data-product-icon
                  className={cx(
                    "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl",
                    product.accent === "blue"
                      ? "bg-gradient-to-br from-[#2451D6] to-[#17348E]"
                      : "bg-gradient-to-br from-[#F0921E] to-[#D9740E]"
                  )}
                >
                  <Layers size={26} strokeWidth={1.8} className="text-white" aria-hidden />
                </span>
                <span
                  className={cx(
                    "rounded-full px-3.5 py-1.5 text-[11.5px] font-bold tracking-wide uppercase",
                    product.accent === "blue"
                      ? "bg-[#E8EEFF] text-[#17348E]"
                      : "bg-[#FFF3E3] text-[#D9740E]"
                  )}
                >
                  {product.badge}
                </span>
              </div>

              <p
                className={cx(
                  "relative z-2 mt-6 text-[27px] font-extrabold tracking-tight",
                  theme?.heading ?? "text-gray-900"
                )}
              >
                {product.name}
              </p>
              <p className="relative z-2 mt-1 text-[14.5px] font-semibold text-gray-400">
                {product.tag}
              </p>

              <p
                className={cx(
                  "relative z-2 mt-5 text-[15px] leading-relaxed",
                  theme?.body ?? "text-gray-500"
                )}
              >
                {product.description}
              </p>

              <div className="relative z-2 mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-2.5 rounded-xl border border-[#EDEAE1] bg-[#FAFAF9] p-3.5 text-[13.5px] font-semibold text-gray-800"
                  >
                    <span
                      className={cx(
                        "mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full",
                        product.accent === "blue" ? "bg-[#2451D6]" : "bg-[#F0921E]"
                      )}
                    >
                      <Check size={11} strokeWidth={3} className="text-white" aria-hidden />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href={product.ctaHref}
                className={cx(
                  "relative z-2 mt-8 inline-flex w-fit items-center gap-2.5 rounded-xl px-[26px] py-[14px] text-[14.5px] font-bold text-white",
                  product.accent === "blue"
                    ? "bg-gradient-to-br from-[#2451D6] to-[#17348E] shadow-[0_10px_24px_rgba(36,81,214,0.28)]"
                    : "bg-gradient-to-br from-[#F0921E] to-[#D9740E] shadow-[0_10px_24px_rgba(240,146,30,0.28)]"
                )}
              >
                {product.ctaLabel}
                <ArrowRight size={15} data-product-cta-icon aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
