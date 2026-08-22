"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { ArrowUpRight } from "lucide-react";
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeAI/HomeTalkToUs use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * The `/contact` page's hero — a `composableElement` section (`subType:
 * "contactHero"` — see `ComposableElementRenderer`), the first of the
 * `/contact` page split out from the original monolithic `ContactPage`
 * port of `Refrence/contact-page.png`, the same move `AboutHero`/etc.
 * went through for `/about`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and first lead paragraph (`text`, rich text); a 2nd
 *   `dataText` entry (if present) supplies a second paragraph the same
 *   way
 * - `dataLink` entries among `elements`: the one with `type: "primary"`
 *   becomes the "Schedule Discovery Call" button, any other becomes the
 *   "Start Your Project" link
 *
 * Falls back to the original hardcoded eyebrow/heading/copy/CTAs from
 * the mockup when the corresponding entries aren't set yet.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field HomeTalkToUs/HomeAI/AboutHero-style
 * sections use) is an *optional* full-bleed section photo — when set, it
 * covers the whole section (behind the `min-h-screen` copy on the left)
 * with a left-to-right scrim so the text stays readable over it, same
 * "photo wins, scrim fades out toward the right" treatment
 * HomeTalkToUs uses. With no `backgroundImage` set, the section falls
 * back to its themed/default soft gradient background instead — there's
 * no decorative illustration standing in for a missing photo.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * soft emerald gradient, so it renders the same as before this existed
 * until an editor sets a `themeColor`.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses, skipped under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ContactHero({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const secondParagraphEntry = dataTextEntries[1];

  const links = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = links.find((link) => link.fields.type === "primary");
  const secondaryLink = links.find((link) => link !== primaryLink);

  const eyebrow = copy?.fields.eyebrow;
  const heading =
    copy?.fields.heading ;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;
  const secondDescription: ReactNode = secondParagraphEntry?.fields.text
    ? documentToReactComponents(secondParagraphEntry.fields.text)
    : null;

  const primaryHref =
    (primaryLink && resolveLinkHref(primaryLink)) ?? "#contact-form";
  const primaryLabel = primaryLink?.fields.label;
  const secondaryHref =
    (secondaryLink && resolveLinkHref(secondaryLink)) ?? "#contact-form";
  const secondaryLabel = secondaryLink?.fields.label;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to this section's colors. `undefined` for an unset
  // or unrecognized value, in which case every themed class below falls
  // back to the mockup's own soft emerald gradient (today's look).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeTalkToUs/HomeAI use). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one — in which
  // case the section falls back to its themed/default background instead.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling
     section). Nothing else in this section animates. Skipped
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

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden lg:flex lg:min-h-screen lg:items-center",
        backgroundUrl
          ? "bg-cover bg-center"
          : (theme?.sectionBg ?? "bg-gradient-to-b from-emerald-50/70 to-white")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      {/* =================================================
          DECORATIVE OVERLAY — the dotted `ThemePattern` backdrop when
          there's no photo; a left-to-right scrim over the photo instead
          when there is one, so the copy on the left stays readable while
          the image still reads on the right (same treatment
          HomeTalkToUs's optional background photo uses).
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>


      <div className="container relative z-2 mx-auto grid gap-12 px-5 py-16 md:px-10 md:py-20 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="flex flex-col gap-6">
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ring-1",
              theme?.eyebrowBg ?? "bg-emerald-50",
              theme?.eyebrowText ?? "text-emerald-700",
              theme ? "ring-black/5" : "ring-emerald-100"
            )}
          >
            {eyebrow}
          </span>

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "max-w-4xl text-[32px] leading-[1.3] font-extrabold tracking-tight sm:text-[52px] md:text-[62px]",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

          <p
            className={cx(
              "rich-text max-w-2xl text-[15.5px] leading-relaxed md:text-[17px]",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </p>
          <p
            className={cx(
              "rich-text max-w-md text-[15.5px] leading-relaxed md:text-[17px]",
              theme?.body ?? "text-gray-500"
            )}
          >
            {secondDescription}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            {primaryLink && primaryLabel && (
              <a
                href={primaryHref}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme?.buttonBg ?? "bg-emerald-600",
                  theme?.buttonText ?? "text-white",
                  theme?.buttonHoverBg ?? "hover:bg-emerald-500"
                )}
              >
                {primaryLabel}
                <ArrowUpRight size={16} aria-hidden />
              </a>
            )}
            {secondaryLink && secondaryLabel && (
              <a
                href={secondaryHref}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[15px] font-semibold transition-colors duration-300",
                  theme?.cardBorder ?? "border-emerald-200",
                  theme?.accentText ?? "text-emerald-700",
                  theme ? "hover:bg-white/10" : "hover:bg-emerald-50"
                )}
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </div>

        {/* RIGHT — empty spacer. The photo (when `backgroundImage` is
            set) is the whole section's own background above, so this
            column just reserves space on large screens, keeping the copy
            to the left half where the scrim is strongest — same pattern
            HomeTalkToUs's background-photo mode uses. */}
        <div aria-hidden className="hidden lg:block" />
      </div>
    </section>
  );
}
