"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution every other composableElement section uses. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * Pipeline step nodes for the static rail diagram below — position (`x`,
 * as a percentage of the 1000-wide viewBox) and label only; whether a
 * node is an automated agent step or a human approval gate drives its own
 * fixed styling in the SVG markup itself (see `PIPELINE_NODES` usage).
 * Ported 1:1 from `Refrence/oxytal-ai-solutions-forgepipeline-section.html`
 * — this whole diagram is the section's "static middle content", not
 * sourced from Contentful.
 */
const PIPELINE_NODES: Array<{ x: number; label: string; gate: boolean }> = [
  { x: 60, label: "Requirement", gate: false },
  { x: 185, label: "Architecture", gate: false },
  { x: 310, label: "Review", gate: true },
  { x: 435, label: "Build", gate: false },
  { x: 560, label: "Test", gate: false },
  { x: 685, label: "Fix", gate: false },
  { x: 810, label: "Approve", gate: true },
  { x: 935, label: "Deploy", gate: true },
];

const PIPELINE_STATS: Array<{ value: string; label: string }> = [
  { value: "14 min", label: "Requirement to open pull request" },
  { value: "8", label: "Specialised agents in the pipeline" },
  { value: "3", label: "Points where it stops for a person" },
  { value: "100%", label: "Audit coverage across every decision" },
];

const PIPELINE_PROOFS: Array<{ kicker: string; title: string; body: string }> = [
  {
    kicker: "Proves — approval gates",
    title: "It cannot deploy on its own",
    body: "Architecture, code review and deployment each stop and wait. Not a setting that can be switched off — the pipeline has no path past a person at those three points.",
  },
  {
    kicker: "Proves — evaluation ships with it",
    title: "Every decision is on the record",
    body: "Each handoff carries a timestamp, the agent version, the token cost and who approved it. When something is wrong you can see exactly where it went wrong, and what it cost to get there.",
  },
  {
    kicker: "Proves — we stay past launch",
    title: "We're the ones inconvenienced by it",
    body: "ForgePipeline runs Oxytal's delivery work. We find the failure modes before a client does, because we're the ones held up when it misbehaves.",
  },
];

/**
 * The `/ai-solutions` page's ForgePipeline proof section — a
 * `composableElement` section (`subType: "aiForgePipeline"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-ai-solutions-forgepipeline-section.html`'s `.forge`
 * panel. A deliberately standalone component (not a change to any
 * sibling `AISolutions*` section) so the existing `/ai-solutions` blocks
 * are untouched.
 *
 * Only the top eyebrow/heading and the bottom CTA row are Contentful-
 * driven, same "dataText for copy, dataLink for buttons" convention every
 * sibling composableElement section uses:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow
 *   (`eyebrow`, falling back to "// proof") and heading (`heading`,
 *   rendered only when actually set)
 * - `dataLink` entries: the one with `type: "primary"` becomes the solid
 *   button, any other becomes the outlined "ghost" button — same
 *   primary/secondary split `AISolutionsHero` uses for its own two CTAs
 *
 * Everything between them — the "running in production" badge, the two
 * lede paragraphs, the eight-node pipeline rail diagram, the four-cell
 * stat strip, and the three proof cards — is this section's static
 * middle content: fixed copy ported directly from the reference mockup,
 * not read from any Contentful field. `PIPELINE_NODES`/`PIPELINE_STATS`/
 * `PIPELINE_PROOFS` above hold that content.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`, same as every
 * sibling composableElement section; un-themed, this section falls back
 * to the reference mockup's own dark violet gradient rather than the
 * site's usual light default, since that's this section's own identity
 * (the "the agent system we trust most" dark panel). The composableElement's
 * own `backgroundImage` field is an optional full-bleed section photo
 * that replaces the gradient outright, same "photo wins" treatment every
 * sibling composableElement section uses. The pipeline diagram/stat/proof
 * colors (violet accent, amber gate markers, green "live" dot) stay fixed
 * regardless of theme — they're part of the static middle content, not
 * re-themed like the heading/eyebrow/buttons are.
 *
 * Animation: the heading gets the same GSAP split-text scroll-reveal
 * every other section's own heading uses; the rail/stats/proofs block
 * fades + rises in as a single group as it scrolls into view; each proof
 * card gets its own corner-glow-bloom + title-nudge hover (see PROOF CARD
 * HOVER below) — deliberately not the lift+shadow hover every sibling
 * composableElement section's own cards use. All of it is skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsForgePipeline({ entry }: Props) {
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

  const eyebrow = copy?.fields.eyebrow ?? "// proof";
  const heading = copy?.fields.heading;

  const primaryHref = primaryLink && resolveLinkHref(primaryLink);
  const primaryLabel = primaryLink?.fields.label;
  const secondaryHref = secondaryLink && resolveLinkHref(secondaryLink);
  const secondaryLabel = secondaryLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL, same
  // pattern every sibling composableElement section uses.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Un-themed, this section defaults to the reference mockup's own dark
  // violet gradient — an explicit `themeColor` still wins when an editor
  // sets one, same convention every sibling composableElement section's
  // own dark default uses.
  const theme = resolveTheme(entry?.fields.themeColor);

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     HEADING REVEAL — splits into words on scroll-in, same GSAP
     vocabulary every other section's own heading uses. Skipped under
     prefers-reduced-motion.
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
     BODY REVEAL — the pipeline rail, stat strip and proof cards fade +
     rise in together as one group once they scroll into view. Skipped
     under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!bodyRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(bodyRef.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(bodyRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bodyRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, bodyRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     PROOF CARD HOVER — shared by both the stat-strip cells and the proof
     cards below them (anything with a `[data-proof-glow]`/
     `[data-proof-title]` pair). Deliberately not the lift+shadow
     treatment every sibling composableElement section's own card hover
     uses. Instead, a soft radial glow (tinted in the section's own
     accent — `patternColor`, falling back to a pale cyan) blooms in from
     the card's top-left corner, and its title/value nudges right
     slightly — the card itself never moves. Skipped entirely under
     `prefers-reduced-motion`.
  ========================================================= */
  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const glow = card.querySelector<HTMLElement>("[data-proof-glow]");
    const title = card.querySelector<HTMLElement>("[data-proof-title]");

    if (glow) {
      gsap.to(glow, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
      });
    }

    if (title) {
      gsap.to(title, { x: 6, duration: 0.4, ease: "power2.out" });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const glow = card.querySelector<HTMLElement>("[data-proof-glow]");
    const title = card.querySelector<HTMLElement>("[data-proof-title]");

    if (glow) {
      gsap.to(glow, { opacity: 0, scale: 0.5, duration: 0.4, ease: "power2.out" });
    }

    if (title) {
      gsap.to(title, { x: 0, duration: 0.4, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-20",
        !backgroundUrl &&
          (theme?.sectionBg ?? "bg-[linear-gradient(160deg,#08061A,#15113A)]")
      )}
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* Decorative radial glow — fixed regardless of theme, same "flourish
          stays fixed" convention every other section's own decorative
          accents use (see app/lib/theme.ts). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[44%] -right-[18%] z-0 h-[560px] w-[560px] rounded-full opacity-70 sm:h-[720px] sm:w-[720px] md:h-[900px] md:w-[900px]"
        style={{
          background:
            "radial-gradient(circle, rgba(91,75,224,.30), transparent 64%)",
        }}
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern
          theme={theme}
          pattern={entry?.fields.pattern}
          patternColor={entry?.fields.patternColor}
        />
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        {eyebrow && (
          <p
             className={cx(
                "mb-5 w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide relative z-2 block",
                theme?.eyebrowBg,
                theme?.eyebrowText
              )}
          >
            {eyebrow}
          </p>
        )}

        {/* "Running in production today" live badge — static, part of this
            section's fixed middle content, not sourced from Contentful. */}
        <span className="mb-[22px] inline-flex items-center gap-[9px] rounded-full border border-[#3DD68C]/[0.34] bg-[#3DD68C]/[0.09] px-[14px] py-[7px] font-bold text-[10.5px] tracking-[0.12em] text-[#3DD68C] uppercase">
          <span
            aria-hidden
            className="h-[7px] w-[7px] animate-dot-pulse rounded-full bg-[#3DD68C]"
          />
          Running in production today
        </span>

        {heading && (
          <DynamicHeading
            level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] max-w-2xl",
              theme?.heading ?? "text-white"
            )}
          >
            {heading}
          </DynamicHeading>
        )}

        <div ref={bodyRef}>
          {/* Two static lede paragraphs — fixed copy, part of this
              section's middle content. */}
          <p
          className={cx(
              "mt-5 rich-text max-w-3xl text-[15.5px] leading-[1.8] md:text-[17px] z-2",
              theme?.body ?? "text-[#4A5570]"
            )}
            >
            Most firms will demo an agent on your data. We run ours on{" "}
            <strong className="font-extrabold">our own delivery</strong> —
            which means when it gets something wrong, it&apos;s our code, our
            client and our deadline. That&apos;s a different level of
            confidence from a pilot, and it&apos;s why the design principles
            on this page aren&apos;t theoretical.
          </p>

          <p
          className={cx(
              "mt-3.5 rich-text max-w-3xl text-[15.5px] leading-[1.8] md:text-[17px] z-2",
              theme?.body ?? "text-[#4A5570]"
            )}>
            <strong className="font-extrabold">ForgePipeline</strong>{" "}
            takes a requirement from Confluence through architecture, code,
            review, testing and deployment to a reviewed pull request. Eight
            specialised agents, every handoff logged, and a full stop at
            every decision a person should be making.
          </p>

          {/* =================================================
              PIPELINE RAIL — static SVG diagram, horizontally scrollable
              on narrow viewports rather than shrinking illegibly.
          ================================================= */}
          <div className="mt-9 overflow-x-auto rounded-[20px] border border-white/12 bg-white/[0.035] p-6 sm:mt-11 md:p-9">
            <svg
              viewBox="0 0 1000 190"
              role="img"
              aria-label="Eight agents run in sequence from requirement to deployment, with human approval gates at architecture, code review and deployment."
              className="block h-auto w-full min-w-[760px]"
            >
              <line
                x1="60"
                y1="86"
                x2="940"
                y2="86"
                stroke="#cbf9fc"
                strokeWidth="2"
              />

              {PIPELINE_NODES.filter((node) => !node.gate).map((node) => (
                <circle key={node.label} cx={node.x} cy="86" r="13" fill="#a298f4" />
              ))}

              {PIPELINE_NODES.filter((node) => node.gate).map((node) => (
                <g key={node.label}>
                  <circle
                    cx={node.x}
                    cy="86"
                    r="14"
                    fill="#08061A"
                    stroke="#14b8a6"
                    strokeWidth="2.6"
                  />
                  <circle cx={node.x} cy="86" r="4.5" fill="#14b8a6" />
                </g>
              ))}

              <g
                fontFamily="var(--font-poppins), sans-serif"
                fontSize="11"
                fill="#112B5C"
                textAnchor="middle"
                fontWeight={600}
              >
                {PIPELINE_NODES.map((node) => (
                  <text key={node.label} x={node.x} y="126">
                    {node.label}
                  </text>
                ))}
              </g>

              <g fontFamily="ui-monospace, monospace" fontSize="8.5" textAnchor="middle">
                {PIPELINE_NODES.map((node) => (
                  <text
                    key={node.label}
                    x={node.x}
                    y="144"
                    fill={node.gate ? "#14b8a6" : "#8B85B0"}
                  >
                    {node.gate ? "YOU" : "agent"}
                  </text>
                ))}
              </g>

              <g
                fontFamily="ui-monospace, monospace"
                fontSize="9.5"
                textAnchor="middle"
              >
                <text x="372" y="42" fill="#a298f4">
                  CONFLUENCE → GITHUB
                </text>
                <text x="872" y="42" fill="#14b8a6">
                  STOPS AND WAITS
                </text>
              </g>
              <path
                d="M310 60v12M810 60v12M935 60v12"
                stroke="#14b8a6"
                strokeWidth="1.4"
                strokeDasharray="3 4"
              />

              <rect
                x="60"
                y="162"
                width="880"
                height="22"
                rx="7"
                fill="rgba(255,255,255,.05)"
                stroke="rgba(255,255,255,.10)"
              />
              <text
                x="500"
                y="177"
                fontFamily="ui-monospace, monospace"
                fontSize="9"
                fill="#8B85B0"
                textAnchor="middle"
              >
                EVERY STEP LOGGED · TIMESTAMP · AGENT VERSION · TOKEN COST · WHO
                APPROVED
              </text>
            </svg>
          </div>

          {/* =================================================
              STAT STRIP — static 4-cell grid. Same corner-glow-bloom +
              value-nudge hover as the proof cards below (see PROOF CARD
              HOVER) — `handleCardEnter`/`handleCardLeave` just look for
              `[data-proof-glow]`/`[data-proof-title]` inside whichever
              card fired the event, so it works unchanged here too.
          ================================================= */}
          <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-t-[15px] sm:mt-11 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE_STATS.map((stat) => (
              <div key={stat.label}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "relative z-2 overflow-hidden px-6 py-7 border",
                theme?.cardBg ?? "bg-white",
                theme?.cardBorder ?? "border-gray-200",
              )}>
                <div
                  aria-hidden
                  data-proof-glow
                  className="pointer-events-none absolute -top-16 -left-16 z-0 h-48 w-48 scale-50 rounded-full opacity-0 blur-2xl"
                  style={{
                    background: `radial-gradient(circle, ${entry?.fields.patternColor ?? "#CEFAFE"}80, transparent 70%)`,
                  }}
                />

                <div
                data-proof-title
                className={cx(
                "relative z-1 text-[26px] leading-none font-bold tracking-tight text-[#A99AFF] sm:text-[30px] md:text-[34px]",
                theme?.eyebrowText
              )}>
                  {stat.value}
                </div>
                <div
                className={cx(
              "relative z-1 mt-2.5 text-[13.5px] leading-[1.5]",
              theme?.body ?? "text-[#4A5570]"
            )}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* =================================================
              PROOF CARDS — static 3-up grid, visually the continuation of
              the stat strip above it (shared border, no top radius/border).
          ================================================= */}
          <div className="grid grid-cols-1 overflow-hidden rounded-b-[15px] border-t-0 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE_PROOFS.map((proof) => (
              <div key={proof.title}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "relative z-2 overflow-hidden px-6 py-7 border",
                theme?.cardBg ?? "bg-white",
                theme?.cardBorder ?? "border-gray-200",
              )}>
                {/* Radial glow, animated in from the card's top-left corner
                    on hover — see PROOF CARD HOVER above. Starts hidden
                    and scaled down; GSAP handles the reveal. */}
                <div
                  aria-hidden
                  data-proof-glow
                  className="pointer-events-none absolute -top-16 -left-16 z-0 h-48 w-48 scale-50 rounded-full opacity-0 blur-2xl"
                  style={{
                    background: `radial-gradient(circle, ${entry?.fields.patternColor ?? "#CEFAFE"}80, transparent 70%)`,
                  }}
                />

                <span
                className={cx(
                "relative z-1 mb-3 block text-[12px] font-bold text-[#A99AFF] uppercase",
                theme?.eyebrowText
              )}>
                  {proof.kicker}
                </span>
                <h3
                data-proof-title
                className={cx(
              "relative z-1 text-[20px] leading-[1.35] font-bold tracking-tight",
              theme?.heading ?? "text-[#4A5570]"
            )}>
                  {proof.title}
                </h3>
                <p
                className={cx(
              "relative z-1 mt-2.5 text-[14px] leading-[1.66]",
              theme?.body ?? "text-[#4A5570]"
            )}>
                  {proof.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {(primaryLabel || secondaryLabel) && (
          <div className="mt-9 flex flex-wrap items-center gap-3 sm:mt-11">
            {primaryLabel && (
              <Link
                href={primaryHref ?? "#"}
                className={cx(
                  "inline-flex w-fit relative z-2 items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme?.buttonBg ?? "bg-[#2F5CFF]",
                  theme?.buttonText ?? "text-white",
                  theme?.buttonHoverBg ?? "hover:bg-[#1E3FCC]"
                )}
              >
                {primaryLabel}
                <ArrowRight size={15} aria-hidden />
              </Link>
            )}
            {secondaryLabel && (
              <Link
                href={secondaryHref ?? "#"}
                target={secondaryHref?.startsWith("http") ? "_blank" : undefined}
                rel={
                  secondaryHref?.startsWith("http") ? "noopener" : undefined
                }
                className={cx(
                  "inline-flex w-fit relative z-2 items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-xs bg-white  transition-all duration-300 hover:-translate-y-0.5  hover:bg-[#112B5C] hover:text-[#ffffff]"
                )}
              >
                {secondaryLabel}
                <ArrowUpRight size={15} aria-hidden />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
