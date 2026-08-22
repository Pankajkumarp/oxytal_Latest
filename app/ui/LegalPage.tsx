"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
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

/**
 * A plain legal/policy page (Privacy Policy, Terms & Conditions, …) — a
 * `composableElement` section (`subType: "legalPage"` — see
 * `ComposableElementRenderer`), reused as-is for every document of this
 * kind rather than one bespoke component per policy, since the only
 * thing that differs between them is the copy:
 *
 * - the first `dataText` entry supplies the eyebrow/heading/lead
 *   paragraph, same as every other hero on this site
 * - a second `dataText` entry supplies the document itself — its own
 *   `eyebrow` field becomes the "Last updated" caption above the body,
 *   and its `text` (rich text — headings, paragraphs, lists, a
 *   horizontal rule, all already allowed by `dataText.text`'s own
 *   validation) becomes the body, rendered with the shared `.rich-text`
 *   styling (see app/globals.css) every other `dataText` block on this
 *   site already uses
 * - `backgroundImage`/`themeColor` work the same as every other
 *   composableElement section; unlike most hero-style sections, this one
 *   defaults to a plain white/slate identity (its own reference-free
 *   "default" — a dense legal document reads best on a plain page, not a
 *   dark navy hero), overridable via `themeColor` like everywhere else
 *
 * Renders nothing for the eyebrow/heading when the corresponding entry
 * fields aren't set yet — there's no placeholder heading or document
 * body, since publishing placeholder legal text would be actively
 * misleading.
 *
 * The heading gets the same GSAP split-text word reveal every hero on
 * this site uses (no scroll trigger — it's already in view), skipped
 * under `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LegalPage({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const heroCopy = dataTextEntries[0];
  const bodyCopy = dataTextEntries[1];

  const eyebrow = heroCopy?.fields.eyebrow;
  const heading = heroCopy?.fields.heading;
  const lead = heroCopy?.fields.text
    ? documentToReactComponents(heroCopy.fields.text)
    : null;

  const lastUpdated = bodyCopy?.fields.eyebrow;
  const body = bodyCopy?.fields.text
    ? documentToReactComponents(bodyCopy.fields.text)
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

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on load
     (same GSAP split-text treatment as every other hero on this site —
     no scroll trigger since it's already in view). Skipped entirely
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
        "relative overflow-hidden",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        {backgroundUrl && <div className="absolute inset-0 bg-white/90" />}
      </div>

      <div className="container mx-auto max-w-3xl px-5 py-16 md:px-10 md:py-24">
        {eyebrow && (
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide",
              theme?.eyebrowBg ?? "bg-slate-100",
              theme?.eyebrowText ?? "text-slate-700"
            )}
          >
            {eyebrow}
          </span>
        )}

        {heading && (
          <DynamicHeading level={resolveHeadingLevel(heroCopy?.fields.headingLevel, "h1")}
            ref={headingRef}
            className={cx(
              "mt-6 text-[32px] leading-[1.1] font-extrabold tracking-tight sm:text-[42px] md:text-[52px]",
              theme?.heading ?? "text-slate-900"
            )}
          >
            {heading}
          </DynamicHeading>
        )}

        {lead && (
          <div className={cx("rich-text mt-5 text-[15px] leading-relaxed md:text-[16px]", theme?.body ?? "text-slate-500")}>
            {lead}
          </div>
        )}

        {lastUpdated && (
          <p className={cx("mt-8 text-[13px] font-semibold", theme?.muted ?? "text-slate-400")}>
            {lastUpdated}
          </p>
        )}

        {body && (
          <div
            className={cx(
              "rich-text mt-6 text-[15px] leading-relaxed md:text-[15.5px]",
              theme?.body ?? "text-slate-700"
            )}
          >
            {body}
          </div>
        )}
      </div>
    </section>
  );
}
