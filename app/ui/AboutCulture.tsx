"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  BookOpen,
  Globe,
  Heart,
  ShieldCheck,
  Users,
  Zap,
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

interface CultureItem {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set — same pattern AboutApproach/AboutServices use. */
const FALLBACK_ICONS: LucideIcon[] = [Zap, Users, BookOpen, ShieldCheck, Globe, Heart];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 6-card grid. */
const DEFAULT_CULTURE: CultureItem[] = [];

/** Maps a resolved `contentDetail` entry to one `CultureItem` — `title`/`shortDescription` as the name/description, `icon` (falls back to a cycled Lucide icon) as the glyph. */
function contentDetailToCultureItem(
  entry: PlainEntry<ContentDetailSkeleton>
): CultureItem {
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

/** The mockup's own dark navy gradient — used as the un-themed default background, same identity `AboutHero`/`AboutApproach` use. */
const NAVY_GRADIENT = "linear-gradient(160deg, #050e2d, #0a2885 55%, #081a5a)";

/**
 * The About page's "Culture" section — a `composableElement` section
 * (`subType: "aboutCulture"` — see `ComposableElementRenderer`), split
 * out of `AboutPage` the same way `AboutHero`/`AboutStats`/`AboutStory`/
 * `AboutServices`/`AboutApproach`/`AboutProducts`/`AboutLeadership` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one value card
 *   (via `contentDetailToCultureItem`) — `title`/`shortDescription` as
 *   the name/description, `icon` (falls back to a cycled Lucide icon) as
 *   the glyph; add/remove/reorder `contentDetail` entries in Contentful
 *   to change the roster, nothing here needs to change
 *
 * Falls back to `DEFAULT_CULTURE` and the original hardcoded heading/
 * copy when the corresponding entries aren't set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * dark navy gradient (`NAVY_GRADIENT`) with white/cyan text, same
 * treatment `AboutApproach` uses, so it renders the same as before this
 * existed until an editor sets a `themeColor` (which then replaces the
 * gradient with a flat `theme.sectionBg`).
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling About section uses) is an
 * *optional* full-bleed section background — wins over both the
 * gradient and the theme when set. `ThemePattern`'s dotted backdrop only
 * renders when there's no background photo, same call every sibling
 * section makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The value cards get their own scroll-triggered
 * reveal too — a fade + rise, one card at a time, staggered apart —
 * *and* a GSAP-driven hover (`handleCardEnter`/`handleCardLeave`): the
 * card lifts + scales up slightly while its icon spins and scales with
 * a bouncy `back.out` ease, reverting on mouse-leave. GSAP rather than a
 * plain CSS `:hover` transition because it's animating two different
 * elements (card + icon) with two different easings from one trigger,
 * which a single CSS `transition` can't express — a treatment none of
 * the sibling sections have yet. All three are skipped under
 * `prefers-reduced-motion` (hover falls back to a plain CSS background
 * swap in that case).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutCulture({ entry }: Props) {
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
    .map(contentDetailToCultureItem);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const items = contentDetailItems.length ? contentDetailItems : DEFAULT_CULTURE;

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
  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling About
     section). Skipped entirely under prefers-reduced-motion.
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
     CARD REVEAL — the value cards fade + rise into place with a stagger
     as the grid scrolls into view. Skipped entirely under
     prefers-reduced-motion.
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
        y: 36,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: .5,
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
     HOVER — GSAP-driven instead of a plain CSS `:hover` transition, so
     the card lift and icon spin/scale can ease independently (a CSS
     `transition` can't stagger two different transforms like this on
     two different elements from one trigger). Skipped under
     prefers-reduced-motion — the card just keeps its plain CSS
     `hover:bg-white/10` background swap in that case.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-culture-icon]");

    gsap.to(card, { y: -8, scale: 1.03, duration: 0.35, ease: "power2.out" });
    if (icon) {
      gsap.to(icon, { rotate: 12, scale: 1.12, duration: 0.35, ease: "back.out(2)" });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-culture-icon]");

    gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
    if (icon) {
      gsap.to(icon, { rotate: 0, scale: 1, duration: 0.4, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="culture"
      aria-labelledby="culture-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
      )}
      style={backgroundStyle}
    >
 
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container relative mx-auto px-5 md:px-10">
        <div className="max-w-xl">
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-white/10",
              theme?.eyebrowText ?? "text-cyan-300"
            )}
          >
            {eyebrow}
          </span>
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            id="culture-heading"
            className={cx(
              "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>
          <div
            className={cx(
              "rich-text mt-4 text-[15px] leading-relaxed",
              theme?.body ?? "text-blue-200/75"
            )}
          >
            {description}
          </div>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <div
                key={item.id}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "flex flex-col items-center rounded-2xl p-8 text-center ring-1 ring-white/10 z-1",
                  theme?.cardBg ?? "bg-white/5",
                  theme?.cardBorder
                )}
              >
                <div
                  data-culture-icon
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1450d4] to-[#2d7dfa] text-white"
                >
                  {item.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={item.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <FallbackIcon size={22} aria-hidden />
                  )}
                </div>
                <h3
                  className={cx(
                    "mt-4 text-[15px] font-bold",
                    theme?.heading ?? "text-white"
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cx(
                    "mt-1.5 text-[13.5px] leading-relaxed",
                    theme?.body ?? "text-blue-200/70"
                  )}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
