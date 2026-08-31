"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowRight } from "lucide-react";
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
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeAI/HomeProducts/HomeAboutUs use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * "Talk to Us", rendered from a `composableElement` entry (`subType:
 * "talktous"` — see `ComposableElementRenderer`). Ported from
 * `Refrence/oxytal-cta-section_1.html` — a minimal, site-wide "let's
 * connect" panel (eyebrow, heading, one circular CTA "orb", and a quiet
 * "or email us" line), replacing this section's previous dark
 * action-panel-with-steps layout.
 *
 * Reads a small roster out of the composableElement's own `elements`:
 *
 * - the 1st `dataText` entry supplies `eyebrow` ("Work with us"),
 *   `heading`, and its trailing `highlightText` — rendered in the
 *   section's own accent/muted tone, same "title + highlightText" idiom
 *   `CareersBannerHorizon` already uses (e.g. heading "Let's discuss what
 *   you're building —" + highlightText "and what's getting in the way.")
 * - `dataLink` entries: the one with `type: "primary"` is the circular
 *   "Let's connect" CTA; the first of the rest is the "Or email …" link
 * - the first `contentDetail` entry with *no* `shortDescription` set
 *   supplies the trailing reassurance note ("We reply within one
 *   business day") next to the email link — same title-only convention
 *   `HomeAboutUs`/the previous version of this component used for
 *   assurance lines on this content type
 * - the composableElement's own `backgroundImage` (optional — links to a
 *   `dataImage` entry) is a full-bleed photo behind the whole section,
 *   same mechanism every sibling section uses; a dark scrim keeps the
 *   centered copy legible over it
 *
 * Every block above only renders when its own roster is non-empty.
 *
 * Background image + theme: same `backgroundImage`/`themeColor`/
 * `pattern`/`patternColor` mechanism every sibling section uses —
 * `resolveTheme` recolors the heading/muted text/CTA hover-fill; the
 * accent glow behind the CTA and the CTA's dashed halo/ring reuse
 * `theme.patternColor` (already a raw hex on every preset) as their own
 * accent color via a `--accent` CSS variable, falling back to the
 * reference mockup's own cyan (`#16B9E8`) when unthemed. `ThemePattern`
 * layers its own decorative grid on top, like every other section.
 *
 * Animation: the heading gets the same GSAP split-text reveal every
 * sibling section's own heading uses; the CTA + email line fade and rise
 * in together as their own block scrolls into view. Both are skipped
 * under `prefers-reduced-motion`.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeTalkToUs({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const emailLink = linkEntries.find((link) => link.fields.type !== "primary");

  // First title-only `contentDetail` (no `shortDescription`) becomes the
  // reassurance note — same title-only convention this section's assurance
  // lines used before, narrowed here to just the first one.
  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const noteText = contentDetailEntries.find(
    (element) => !element.fields.shortDescription
  )?.fields.title;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const highlightText = copy?.fields.highlightText;
    const footerText: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;

  const ctaHref = primaryLink ? resolveLinkHref(primaryLink) : undefined;
  const ctaLabel = primaryLink?.fields.label;
  const emailHref = emailLink ? resolveLinkHref(emailLink) : undefined;
  const emailLabel = emailLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so the section just shows its plain/themed ground color
  // until an editor sets one.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to this section's text/CTA colors. `undefined` for
  // an unset or unrecognized value, in which case every themed class
  // below falls back to this section's own default look — the reference
  // mockup's near-black ground and cyan accent.
  const theme = resolveTheme(entry.fields.themeColor);
  const accentHex = theme?.patternColor ?? "#16B9E8";

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ctaBlockRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     HEADING REVEAL — splits into words on scroll-in (same GSAP
     split-text treatment as HomeServices/HomeProducts/HomeAI/
     HomeAboutUs/CommonTrustedBy). Skipped under prefers-reduced-motion.
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
     CTA REVEAL — the CTA orb + email line fade and rise in together
     as their own block scrolls into view. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!ctaBlockRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(ctaBlockRef.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(ctaBlockRef.current, {
        y: 24,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ctaBlockRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative isolate overflow-hidden text-center",
        !backgroundUrl && (theme?.sectionBg ?? "bg-[#0A0F14]")
      )}
      style={{
        ...(backgroundUrl
          ? {
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }
          : {}),
        // Exposed as a CSS variable so the CTA's ring/halo/focus states
        // (defined with Tailwind arbitrary values below) can read it too,
        // same "one accent variable per section" idiom the reference
        // mockup's own `--acc` uses.
        ["--accent" as string]: accentHex,
      }}
    >
      <ThemePattern
        theme={theme}
        pattern={entry?.fields.pattern}
        patternColor={entry?.fields.patternColor}
      />

      <div className="container relative z-2 mx-auto flex flex-col items-center px-5 py-20 sm:px-10">
        {eyebrow && (
          <p
            className={cx(
              " text-xs font-bold tracking-wide uppercase",
              theme?.accentText
            )}
            style={theme?.accentText ? undefined : { color: "var(--accent)" }}
          >
            {eyebrow}
          </p>
        )}

        {heading && (
          <DynamicHeading
            level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "mt-6 mx-auto max-w-2xl text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] mb-10",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}{" "}
            {highlightText && (
              <span className={theme?.muted ?? "text-[#A9B6C0]"}>
                {highlightText}
              </span>
            )}
          </DynamicHeading>
        )}

        <div
          ref={ctaBlockRef}
          className="flex flex-col items-center"
        >
          {ctaLabel && (
            <Link
              href={ctaHref || ""}
              className={cx(
                "min-w-[200px] inline-flex relative z-2 w-fit items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                theme?.buttonBg ?? "bg-[#0B1B2B]",
                theme?.buttonText ?? "text-white",
                theme?.buttonHoverBg ?? "hover:bg-[#16324B]"
              )}
            >
              {ctaLabel} <ArrowRight size={16} aria-hidden />
            </Link>
          )}

          {(emailLabel || noteText) && (
            <div
              className={cx(
                "mt-8 max-w-2xl text-[15px] leading-[1.7] flex",
                theme?.muted ?? "text-[#6E7C87]"
              )}
            >
              {emailLabel && (
                <>
                  Or email {" "}
                  <a
                    href={emailHref || `mailto:${emailLabel}`}
                    className={cx(
                      "border-b border-white/20 pb-[2px] no-underline transition-colors duration-200 pl-2",
                      theme?.body ?? "text-[#A9B6C0]",
                      "hover:border-[var(--accent)] hover:text-white"
                    )}
                  >
                    {emailLabel}
                  </a>
                </>
              )}
              {emailLabel && footerText && (
                <span className="mx-3 inline-block opacity-40 sm:mx-3" aria-hidden>
                  ·
                </span>
              )}
              {footerText}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
