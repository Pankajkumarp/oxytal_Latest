"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  Handshake,
  Laptop,
  Network,
  Package,
  Palette,
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

interface WhyItem {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set — same pattern every sibling About section uses. */
const FALLBACK_ICONS: LucideIcon[] = [Package, Laptop, Palette, Network, Handshake];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 5-point list. */
const DEFAULT_WHY: WhyItem[] = [];

/** Maps a resolved `contentDetail` entry to one `WhyItem` — `title`/`shortDescription` as the name/description, `icon` (falls back to a cycled Lucide icon) as the glyph. */
function contentDetailToWhyItem(entry: PlainEntry<ContentDetailSkeleton>): WhyItem {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
  };
}

/** The mockup's own dark navy gradient — used as the un-themed default background, same identity `AboutHero`/`AboutApproach`/`AboutCulture` use. */
const NAVY_GRADIENT = "linear-gradient(160deg, #050e2d, #0a2885 55%, #081a5a)";

/**
 * The About page's "Why Choose Us" section — a `composableElement`
 * section (`subType: "aboutWhy"` — see `ComposableElementRenderer`),
 * split out of `AboutPage` the same way `AboutHero`/`AboutStats`/
 * `AboutStory`/`AboutServices`/`AboutApproach`/`AboutProducts`/
 * `AboutLeadership`/`AboutCulture`/`AboutGlobal`/`AboutMissionVision`
 * were — the last section in `Refrence/oxytal-about.html`, so
 * `AboutPage` is left with nothing of its own once this is wired up
 * (kept registered regardless, in case a future section needs a home):
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text); a 2nd `dataText`
 *   entry (if present) supplies the italic pull-quote callout via its
 *   own `text` field
 * - every `contentDetail` entry among `elements` becomes one list item
 *   (via `contentDetailToWhyItem`) — `title`/`shortDescription` as the
 *   name/description, `icon` (falls back to a cycled Lucide icon) as
 *   the glyph; add/remove/reorder `contentDetail` entries in Contentful
 *   to change the roster, nothing here needs to change
 *
 * Falls back to `DEFAULT_WHY` and the original hardcoded heading/copy
 * when the corresponding entries aren't set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * dark navy gradient (`NAVY_GRADIENT`) with white/cyan text, same
 * treatment `AboutApproach`/`AboutCulture` use, so it renders the same
 * as before this existed until an editor sets a `themeColor` (which then
 * replaces the gradient with a flat `theme.sectionBg`).
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling About section uses) is an
 * *optional* full-bleed section background — wins over both the
 * gradient and the theme when set. `ThemePattern`'s dotted backdrop only
 * renders when there's no background photo, same call every sibling
 * section makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. Three more spots get their own GSAP
 * treatment: the quote callout fades + scales in as it scrolls into
 * view; each list item fades + slides in from the right, staggered one
 * after another; and each list item gets its own hover — the icon pops
 * with a bouncy rotate + scale while the row nudges slightly to the
 * right. All four are skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutWhy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const quoteEntry = dataTextEntries[1];

  const contentDetailItems = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToWhyItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;
  const quote = quoteEntry?.fields.text
    ? documentToReactComponents(quoteEntry.fields.text)
    : null;

  const items = contentDetailItems.length ? contentDetailItems : DEFAULT_WHY;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own dark navy gradient + white/cyan
  // text (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling About section uses). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one
  // — wins over both the gradient and the theme when set.
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
  const quoteRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling About
     section). Nothing else in this section animates. Skipped entirely
     under prefers-reduced-motion.
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
     QUOTE REVEAL — the pull-quote callout fades + scales in as it
     scrolls into view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!quoteRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(quoteRef.current, { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(quoteRef.current, {
        opacity: 0,
        scale: 0.94,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: quoteRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, quoteRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     LIST REVEAL — each list item fades + slides in from the right,
     staggered one after another as the list scrolls into view. Skipped
     entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!listRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(listRef.current.children, { opacity: 1, x: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(listRef.current!.children, {
        x: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, listRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     LIST ITEM HOVER — the icon pops with a bouncy rotate + scale while
     the row nudges slightly to the right. GSAP rather than CSS because
     the icon and row animate on two different eases from one trigger.
     Skipped under prefers-reduced-motion.
  ========================================================= */
  const handleItemEnter = (event: React.MouseEvent<HTMLLIElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const row = event.currentTarget;
    const icon = row.querySelector<HTMLElement>("[data-why-icon]");

    gsap.to(row, { x: 6, duration: 0.3, ease: "power2.out" });
    if (icon) {
      gsap.to(icon, { rotate: -12, scale: 1.2, duration: 0.35, ease: "back.out(2)" });
    }
  };

  const handleItemLeave = (event: React.MouseEvent<HTMLLIElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const row = event.currentTarget;
    const icon = row.querySelector<HTMLElement>("[data-why-icon]");

    gsap.to(row, { x: 0, duration: 0.35, ease: "power2.out" });
    if (icon) {
      gsap.to(icon, { rotate: 0, scale: 1, duration: 0.35, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="why"
      aria-labelledby="why-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
      )}
      style={backgroundStyle}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative mx-auto grid gap-12 px-5 md:px-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide z-2",
              theme?.eyebrowBg ?? "bg-white/10",
              theme?.eyebrowText ?? "text-cyan-300"
            )}
          >
            {eyebrow}
          </span>
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            id="why-heading"
            className={cx(
              "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] z-2",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>
          <div
            className={cx(
              "rich-text mt-4 text-[15px] leading-relaxed z-2",
              theme?.body ?? "text-blue-200/75"
            )}
          >
            {description}
          </div>
          <div
            ref={quoteRef}
            className={cx(
              "mt-6 rounded-xl p-4 ring-1 ring-white/10 z-2 relative",
              theme?.cardBg ?? "bg-cyan-400/10"
            )}
          >
            <div
              className={cx(
                "rich-text text-[13.5px] leading-relaxed italic",
                theme?.body ?? "text-white/75"
              )}
            >
              {quote}
            </div>
          </div>
        </div>

        <ul
          ref={listRef}
          className="flex flex-col divide-y divide-white/10 lg:col-span-6 lg:col-start-7"
        >
          {items.map((item, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <li
                key={item.id}
                onMouseEnter={handleItemEnter}
                onMouseLeave={handleItemLeave}
                className="flex gap-4 py-6 first:pt-0 last:pb-0"
              >
                {item.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                  <img
                    data-why-icon
                    src={item.iconUrl}
                    alt=""
                    aria-hidden
                    className="mt-0.5 h-5 w-5 shrink-0 object-contain"
                  />
                ) : (
                  <FallbackIcon
                    data-why-icon
                    size={20}
                    className={cx("mt-0.5 shrink-0", theme?.accentText ?? "text-cyan-300")}
                    aria-hidden
                  />
                )}
                <div>
                  <p
                    className={cx(
                      "text-[15px] font-bold",
                      theme?.heading ?? "text-white"
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cx(
                      "mt-1 text-[13.5px] leading-relaxed",
                      theme?.body ?? "text-blue-200/70"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
