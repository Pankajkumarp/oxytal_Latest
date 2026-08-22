"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, type Document as RichTextDocument } from "@contentful/rich-text-types";
import { ArrowRight } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/Home404/AboutHero use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface Step {
  title: string;
  /** Tag pills (from the entry's `statistics` labels) when set; mutually exclusive with `body`. */
  tags?: string[];
  /** Prose body (`shortDescription`) — the fallback when no `statistics` are set. */
  body?: string;
}

/**
 * Maps a resolved `contentDetail` entry to one numbered rail stage. A
 * `statistics` link resolves to tag pills (each statistic's `label`); with
 * none set, `shortDescription` renders as plain prose instead — no
 * explicit "which style" field, the populated one wins.
 */
function contentDetailToStep(entry: PlainEntry<ContentDetailSkeleton>): Step {
  const tags = (entry.fields.statistics ?? [])
    .filter((stat): stat is PlainEntry<StatisticSkeleton> => isEntry(stat))
    .map((stat) => stat.fields.label)
    .filter((label): label is string => Boolean(label));

  return {
    title: entry.fields.title ?? "",
    tags: tags.length ? tags : undefined,
    body: tags.length ? undefined : entry.fields.shortDescription,
  };
}

/** No hardcoded roster — an unset field on this page's Contentful entry simply renders nothing for that piece (see the page's own doc comment). */
const DEFAULT_STEPS: Step[] = [];

interface Point {
  x: number;
  y: number;
}

/**
 * Builds the rail's connecting path as a series of right-angle elbows —
 * down, across, down again — the same "staircase" shape as
 * `Refrence/section-redesign.html`'s hand-drawn `#railPath` (its own
 * corners sit ~30% of the way down each hop, e.g. its stage 1→2 elbow
 * turns at y=130 between y=60 and y=290), just generated from however
 * many stage points there actually are instead of 3 fixed coordinates.
 */
function buildStepPath(points: Point[]): string {
  if (points.length < 2) {
    return "";
  }

  return points.slice(1).reduce((d, point, i) => {
    const from = points[i];
    const cornerY = from.y + (point.y - from.y) * 0.3;

    return `${d} L ${from.x} ${cornerY} L ${point.x} ${cornerY} L ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

/**
 * Renders `dataText.text` as the hero's lede + supporting copy: its first
 * paragraph gets the bold "lede" treatment (`Refrence/section-redesign.html`'s
 * `.lede`), every paragraph after it renders as dimmer body copy (`.body-copy`)
 * — both live in the one rich text field, split by paragraph position rather
 * than a second Contentful field.
 */
function renderHeroCopy(doc: RichTextDocument, theme: SectionTheme) {
  let paragraphIndex = 0;

  return documentToReactComponents(doc, {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_node, children) => {
        const isLede = paragraphIndex === 0;
        paragraphIndex += 1;

        return isLede ? (
          <p className={cx("text-[15.5px] leading-relaxed", theme.body)}>{children}</p>
        ) : (
          <p className={cx("text-[15.5px] leading-relaxed", theme.body)}>{children}</p>
        );
      },
    },
  });
}

/**
 * The `/landing-page` hero — a `composableElement` section (`subType:
 * "landingHero"` — see `ComposableElementRenderer`), redesigned after
 * `Refrence/section-redesign.html`'s "Digital Strategy & Consultancy"
 * mockup (a copy column + a connected, numbered process rail), replacing
 * this section's earlier floating-callouts-over-image treatment:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading (`highlightText` renders as the accent-colored trailing word),
 *   and the lede + body copy — both live in `text` (rich text): its first
 *   paragraph renders as the bold lede, every paragraph after it as dimmer
 *   body copy (see `renderHeroCopy`)
 * - every `dataLink` entry among `elements`: the one with `type: "primary"`
 *   becomes the solid CTA button, any other becomes the ghost text link
 * - every `contentDetail` entry among `elements`, in order, becomes one
 *   numbered stage on the rail (no fixed count — the mockup's own 3 stages
 *   are just however many entries an editor adds): `title` is the stage
 *   heading, and its body renders as tag pills when `statistics` is set
 *   (each statistic's `label`, matching the mockup's stage 2) or as plain
 *   prose from `shortDescription` otherwise (matching stages 1 and 3) —
 *   see `contentDetailToStep`
 *
 * The mockup's decorative image and standalone badge-pill row have no
 * equivalent here — this redesign has neither, so a bare `dataImage`/
 * `statistic` entry among `elements` (outside a `contentDetail`'s own
 * `statistics`) simply isn't used by this component.
 *
 * Nothing here is hardcoded: an unset eyebrow/heading/CTA/stage simply
 * doesn't render (see each piece's own conditional below) rather than
 * falling back to placeholder copy — this section renders however much
 * (or little) content its Contentful entry actually has. With zero
 * `contentDetail` stages, the rail column doesn't render at all and the
 * copy column spans the full width.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`, defaulting to the
 * `dark` preset (the mockup's own navy background) rather than the site's
 * usual light default. Motion: the eyebrow/copy/CTAs fade + rise in as a
 * staggered group, the heading splits into words on scroll-in (this
 * site's standard heading reveal), and the rail's own right-angle
 * staircase path (see `buildStepPath`) "draws in" via an animated
 * stroke-dashoffset, with a glow dot looping along it afterward — a
 * distinct flavor from every sibling section's card-hover vocabulary,
 * since this section has no cards of its own. All skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingHero({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLink = linkEntries.find((link) => link.fields.type !== "primary");

  const contentDetailSteps = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToStep);
  const steps = contentDetailSteps.length ? contentDetailSteps : DEFAULT_STEPS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const highlightText = copy?.fields.highlightText;

  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("dark")!;

  const description: ReactNode = copy?.fields.text
    ? renderHeroCopy(copy.fields.text, theme)
    : null;

  const primaryHref = primaryLink ? resolveLinkHref(primaryLink) : undefined;
  const secondaryHref = secondaryLink ? resolveLinkHref(secondaryLink) : undefined;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL, same
  // pattern every sibling composableElement section uses. Optional: no
  // placeholder fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const copyGroupRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pathFillRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [stepPoints, setStepPoints] = useState<Point[]>([]);

  /* =========================================================
     COPY REVEAL — eyebrow, copy and CTAs fade + rise in as one
     staggered group while the heading splits into words separately
     (this site's standard heading reveal). Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      if (copyGroupRef.current) gsap.set(copyGroupRef.current.children, { opacity: 1, y: 0 });
      if (headingRef.current) gsap.set(headingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      if (copyGroupRef.current) {
        gsap.from(copyGroupRef.current.children, {
          y: 18,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.15,
        });
      }

      if (headingRef.current) {
        split = SplitText.create(headingRef.current, {
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
              stagger: 0.05,
            }),
        });
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     RAIL MEASURE — reads each numbered badge's own on-screen center
     (already reflecting its row's staircase indent, set via inline
     `marginLeft` below) so the connecting path can be generated to
     actually meet them, rather than guessing fixed pixel coordinates
     the way the static mockup's `#railPath` does. Re-measures if the
     stage count changes; doesn't track window resize, same tradeoff
     the rest of this codebase's one-shot layout effects make.
  ========================================================= */
  useLayoutEffect(() => {
    const container = railRef.current;
    const badges = badgeRefs.current.filter((el): el is HTMLSpanElement => el !== null);

    if (!container || badges.length < 2) {
      setStepPoints([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();

    setStepPoints(
      badges.map((badge) => {
        const rect = badge.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      })
    );
  }, [steps.length]);

  const stepPathD = useMemo(() => buildStepPath(stepPoints), [stepPoints]);

  /* =========================================================
     RAIL DRAW-IN — the staircase path "draws in" from the first
     stage badge to the last, like the mockup's own path animation,
     then a glow dot loops along it. Skipped under
     prefers-reduced-motion (the path just renders complete, no dot).
  ========================================================= */
  useLayoutEffect(() => {
    const path = pathFillRef.current;

    if (!stepPathD || !path) {
      return;
    }

    const length = path.getTotalLength();

    if (prefersReducedMotion()) {
      gsap.set(path, { strokeDasharray: "none", strokeDashoffset: 0 });
      return;
    }

    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });
      tl.to(path, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" });

      const glow = glowRef.current;
      if (glow) {
        tl.to(glow, { opacity: 1, duration: 0.2 }, "-=0.1").add(() => {
          const dummy = { t: 0 };
          gsap.to(dummy, {
            t: 1,
            duration: 2.6,
            ease: "none",
            repeat: -1,
            onUpdate: () => {
              const point = path.getPointAtLength(dummy.t * length);
              glow.setAttribute("cx", String(point.x));
              glow.setAttribute("cy", String(point.y));
            },
          });
        });
      }
    });

    return () => ctx.revert();
  }, [stepPathD]);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative flex min-h-screen items-center overflow-hidden",
        backgroundUrl ? "bg-cover bg-center" : theme.sectionBg
      )}
      style={
        backgroundUrl
          ? {
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
          : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div
        className={cx(
          "container relative z-2 mx-auto grid gap-10 px-5 py-16 md:items-center md:px-10 md:py-24",
          steps.length ? "md:grid-cols-[1.05fr_0.95fr]" : "md:grid-cols-1"
        )}
      >
        <div>
          <div ref={copyGroupRef} className="flex flex-col items-start gap-5">
            {eyebrow && (
              <span
                className={cx(
                  "inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase",
                  theme.eyebrowBg,
                  theme.eyebrowText,
                  theme.cardBorder
                )}
              >
                {eyebrow}
              </span>
            )}

            {heading && (
              <DynamicHeading
                level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
                ref={headingRef}
                className={cx(
                  "max-w-xl text-[34px] leading-[1.2] font-extrabold tracking-tight sm:text-[40px] md:text-[50px]",
                  theme.heading
                )}
              >
                {heading}
                {highlightText && (

                  <span className={theme.accentText}>{highlightText}</span>

                )}
              </DynamicHeading>
            )}

            {description && (
              <div
                className={cx(
                  "rich-text flex max-w-xl flex-col gap-2",
                  theme?.body ?? "text-gray-500"
                )}
              >
                {description}
              </div>
            )}

            {(primaryHref || secondaryHref) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {primaryHref && primaryLink && (
                  <Link
                    href={primaryHref}
                    className={cx(
                      "inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                      theme.buttonBg,
                      theme.buttonText,
                      theme.buttonHoverBg
                    )}
                  >
                    {primaryLink.fields.label}
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                )}

                {secondaryHref && secondaryLink && (
                  <Link
                    href={secondaryHref}
                    className={cx("inline-flex w-fit items-center gap-1 px-2 py-3.5 text-[15px] font-semibold", theme.heading)}
                  >
                    {secondaryLink.fields.label}
                    <span aria-hidden>›</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            PROCESS RAIL — one numbered stage per `contentDetail`
            entry, each indented a little further than the last (the
            mockup's own staircase offset) and connected by a
            right-angle elbow path that draws in on mount, with a
            glow dot looping along it afterward. Renders nothing when
            no stages are set (see `steps.length` guard above).
        ================================================= */}
        {steps.length > 0 && (
          <div ref={railRef} className="relative">
            {stepPathD && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden
              >
                <path
                  d={stepPathD}
                  fill="none"
                  stroke={theme.patternColor}
                  strokeOpacity={0.25}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  ref={pathFillRef}
                  d={stepPathD}
                  fill="none"
                  stroke={theme.patternColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {stepPoints.map((point, index) => (
                  <circle key={index} cx={point.x} cy={point.y} r={5} fill={theme.patternColor} />
                ))}
                <circle
                  ref={glowRef}
                  r={5}
                  fill="#fff"
                  opacity={0}
                  style={{ filter: `drop-shadow(0 0 6px ${theme.patternColor})` }}
                />
              </svg>
            )}

            <div className="flex flex-col gap-10">
              {steps.map((step, index) => (
                <div
                  key={`${step.title}-${index}`}
                  className="relative flex items-start gap-4"
                  style={{ marginLeft: `${Math.min(index, 3) * 32}px` }}
                >
                  <span
                    ref={(el) => {
                      badgeRefs.current[index] = el;
                    }}
                    className={cx(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-semibold",
                      theme.eyebrowBg,
                      theme.accentText,
                      theme.cardBorder
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className={cx("flex-1 rounded-2xl border p-4", theme.cardBg, theme.cardBorder)}>
                    {step.title && (
                      <h4 className={cx("mb-1.5 text-base font-bold", theme.heading)}>{step.title}</h4>
                    )}

                    {step.tags ? (
                      <div className="flex flex-wrap gap-2">
                        {step.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cx(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              theme.eyebrowBg,
                              theme.accentText,
                              theme.cardBorder
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      step.body && (
                        <p className={cx("text-sm leading-relaxed", theme.body)}>{step.body}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
