"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Circle } from "lucide-react";
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
  DataTextSkeleton,
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

type Status = "now" | "soon" | "future";

/** Normalizes `contentDetail.badge` (free text, e.g. "Live Now"/"Coming Soon"/"Future") to one of the three supported statuses. Defaults to "future" for anything unrecognized. */
function resolveStatus(value?: string): Status {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized.includes("now") || normalized.includes("live")) return "now";
  if (normalized.includes("soon")) return "soon";
  return "future";
}

type ProductTag = "blue" | "green" | "neutral";

/** Best-effort accent from `contentDetail.industry` (the product name, e.g. "Oxyem"/"Skolrup") — falls back to cycling by array position for anything else. `category` isn't used for this: it's a locked Contentful enum of business-catalog labels that doesn't fit free-text product names, so this reuses `industry` instead, same convention `ProductShowcase`'s tagline uses. */
function resolveProductTag(value: string | undefined, index: number): ProductTag {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized.includes("oxyem")) return "blue";
  if (normalized.includes("skolrup")) return "green";
  return index % 2 === 0 ? "blue" : "green";
}

interface RoadmapItem {
  id: string;
  product: string;
  productTag: ProductTag;
  status: Status;
  title: string;
  description: string;
}

/** Maps a resolved `contentDetail` entry (plus its array position) to one `RoadmapItem` — `industry` as the product tag, `badge` as the status, `title`/`shortDescription` as the item's own name/description. */
function contentDetailToRoadmapItem(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): RoadmapItem {
  return {
    id: entry.sys.id,
    product: entry.fields.industry ?? "",
    productTag: resolveProductTag(entry.fields.industry, index),
    status: resolveStatus(entry.fields.badge),
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
  };
}

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the reference's own 6-item roadmap. */
const DEFAULT_ITEMS: RoadmapItem[] = [];

const STATUS_LABEL: Record<Status, string> = {
  now: "Live Now",
  soon: "Coming Soon",
  future: "Future",
};

const STATUS_STYLES: Record<Status, string> = {
  now: "bg-[rgba(0,212,255,.15)] text-[#00d4ff] ring-1 ring-[rgba(0,212,255,.3)]",
  soon: "bg-[rgba(45,125,250,.15)] text-[#5ba4fc] ring-1 ring-[rgba(45,125,250,.3)]",
  future: "bg-[rgba(34,176,96,.12)] text-[#6ee8a8] ring-1 ring-[rgba(34,176,96,.25)]",
};

const PRODUCT_TAG_STYLES: Record<ProductTag, string> = {
  blue: "bg-[rgba(20,80,212,.2)] text-[#5ba4fc]",
  green: "bg-[rgba(34,176,96,.15)] text-[#6ee8a8]",
  neutral: "bg-white/10 text-white/70",
};

/** Raw-hex counterpart to `STATUS_STYLES`, for the GSAP hover glow below — a Tailwind class string can't be animated by GSAP, so this mirrors each status's own color as a real hex value instead. */
const STATUS_HEX: Record<Status, string> = {
  now: "#00d4ff",
  soon: "#2d7dfa",
  future: "#22b060",
};

/** The reference's own dark navy gradient — used as the un-themed default background, same identity `ProductTech`/`AboutApproach` use. */
const NAVY_GRADIENT = "linear-gradient(160deg, #050e2d, #0a2885 55%, #081a5a)";

/**
 * The `/products` page's "Product Roadmap Highlights" section — a
 * `composableElement` section (`subType: "productRoadmap"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-products.html`'s `.roadmap-section`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one roadmap item
 *   (via `contentDetailToRoadmapItem`) — `industry` as the product tag
 *   (`category` is a locked Contentful enum of business-catalog labels
 *   that doesn't fit free-text product names, so this reuses `industry`
 *   instead, same convention `ProductShowcase`'s tagline uses; accented
 *   blue/green when it names "Oxyem"/"Skolrup", cycling otherwise),
 *   `badge` as the status (maps "Live Now"/"Coming Soon" to
 *   their reference styling, anything else to "Future"), `title`/
 *   `shortDescription` as the item's own name/description; add/remove/
 *   reorder `contentDetail` entries in Contentful to change the roster,
 *   nothing here needs to change
 *
 * `DEFAULT_ITEMS` is an empty roster, so no roadmap cards render until
 * `contentDetail` entries exist. `heading` renders only when the
 * `dataText` entry actually has one set; `eyebrow` still falls back to
 * "What's Coming" (a short structural section tag, not authored
 * marketing copy) when unset.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own dark navy gradient (`NAVY_GRADIENT`), same un-themed default
 * `ProductTech`/`AboutApproach` use. The composableElement's own
 * `backgroundImage` field is an optional full-bleed photo, winning over
 * both the gradient and the theme when set; `ThemePattern`'s dotted
 * backdrop only renders when there's no photo.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The roadmap cards fade + rise into place with
 * a stagger as the grid scrolls into view. On hover, each card's glow
 * shifts to that item's own status color and its status dot pulses like
 * a live beacon for as long as it's hovered — see the CARD HOVER comment
 * below for why this is deliberately unlike every sibling section's own
 * hover. All skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductRoadmap({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailItems = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map((detailEntry, index) => contentDetailToRoadmapItem(detailEntry, index));

  const eyebrow = copy?.fields.eyebrow ?? "What's Coming";
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const items = contentDetailItems.length ? contentDetailItems : DEFAULT_ITEMS;

  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const backgroundStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})` }
    : theme
      ? undefined
      : { background: NAVY_GRADIENT };

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

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
     CARD REVEAL — fade + rise with a stagger as the grid scrolls into
     view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!itemsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(itemsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(itemsRef.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: itemsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, itemsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD HOVER — distinct from every sibling section's own hover (lift+
     icon-pop, 3D-flip, letter-pop+bar, scale+spin+letter-spacing): no
     lift or icon rotation here — instead the card's own ring/glow shifts
     to that item's own status color (`STATUS_HEX`), and its status dot
     starts a continuous pulse (a repeating, yoyo'd scale + fade — a
     "live beacon" cue, fitting for a status indicator) for as long as
     the card stays hovered, rather than a one-shot tween like every
     sibling section's own hover uses. Skipped entirely under
     `prefers-reduced-motion`.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const dot = card.querySelector<SVGElement>("[data-status-dot]");
    const status = (card.dataset.status as Status | undefined) ?? "future";
    const hex = STATUS_HEX[status];

    gsap.to(card, {
      boxShadow: `0 0 0 1px ${hex}55, 0 20px 40px -20px ${hex}55`,
      duration: 0.4,
      ease: "power2.out",
    });

    if (dot) {
      gsap.killTweensOf(dot);
      gsap.to(dot, {
        scale: 1.8,
        opacity: 0.35,
        duration: 0.55,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const dot = card.querySelector<SVGElement>("[data-status-dot]");

    gsap.to(card, { duration: 0.35, ease: "power2.out", clearProps: "boxShadow" });

    if (dot) {
      gsap.killTweensOf(dot);
      gsap.to(dot, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
      )}
      style={backgroundStyle}
    >

        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="max-w-xl">
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-white/10",
              theme?.eyebrowText ?? "text-[#00d4ff]"
            )}
          >
            {eyebrow}
          </span>
          {heading && (
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              className={cx(
                "mt-4 text-[26px] leading-[1.15] font-extrabold tracking-tight sm:text-[32px] md:text-[38px]",
                theme?.heading ?? "text-white"
              )}
            >
              {heading}
            </DynamicHeading>
          )}
          <div
            className={cx(
              "rich-text mt-4 text-[15px] leading-relaxed",
              theme?.body ?? "text-[#7b93c8]"
            )}
          >
            {description}
          </div>
        </div>

        {items.length > 0 && (
          <div ref={itemsRef} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                data-status={item.status}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "relative rounded-2xl p-7 ring-1 ring-white/10  border",
                  theme?.cardBg ?? "bg-white/5 hover:bg-white/9",
                  theme?.cardBorder ?? ""
                )}
              >
                {item.product && (
                  <span
                    className={cx(
                      "absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      PRODUCT_TAG_STYLES[item.productTag]
                    )}
                  >
                    {item.product}
                  </span>
                )}
                <span
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase",
                    STATUS_STYLES[item.status]
                  )}
                >
                  <Circle data-status-dot size={7} fill="currentColor" aria-hidden />
                  {STATUS_LABEL[item.status]}
                </span>
                <p className={cx("mt-4 text-[15px] font-bold", theme?.heading ?? "text-white")}>
                  {item.title}
                </p>
                <p className={cx("mt-2 text-[13px] leading-relaxed", theme?.body ?? "text-[#7b93c8]")}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
