"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
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
import styles from "./AboutWhy.module.css";

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
/*
 * ── "AI & Agentic Engineering" band ──────────────────────────────────
 * The closing `.band.band--rule` block from `Refrence/oxytal-about.html`,
 * always rendered directly after this component's "Why Choose Us"
 * section (both come from the *same* `composableElement` entry — see
 * `AboutWhy` below; there's no on/off switch, no second entry).
 *
 * `themeColor`/`backgroundImage` are the *same* fields "Why Choose Us"
 * already resolves (`theme`/`backgroundUrl` below) — set once on the one
 * `composableElement` entry, applied to both sections. Each still keeps
 * its own distinct *un-themed* fallback look when neither is set:
 * `NAVY_GRADIENT` for "Why Choose Us", `AI_LAB_DEFAULT_BG` (the
 * reference's own near-black) for this band.
 *
 * Its own eyebrow/heading/intro paragraph come from a 3rd `dataText`
 * entry among `elements` (`aiLabCopy` below) — falls back to the
 * reference's own original copy when that entry isn't set yet, so it
 * renders unchanged until an editor adds one. Everything else in this
 * band — the 3 story paragraphs, the ForgePipeline demo list, and the 4
 * "what it builds" cards — stays static: decorative/illustrative
 * content, not the kind of thing worth modeling as Contentful fields for
 * a single fixed section. Same "faithfulness over consistency" call
 * `AIPipelineDemo`/`ServicesPage` make for their own bespoke mockup
 * ports. Styled via `AboutWhy.module.css` since its CSS counters,
 * keyframe animations, and fixed palette don't map cleanly onto
 * Tailwind utilities.
 */
const aiLabArchivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
});
const aiLabPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});
const aiLabPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-sans",
});

const AI_LAB_DEFAULT_HEADING = "AI & Agentic Engineering";
/** The 6 ForgePipeline stages, verbatim from the reference's own `#pipeDemo` markup — stays static; it's a decorative auto-cycling demo, not editorial copy. */
const AI_LAB_PIPELINE_STEPS = [
  "Requirements Agent",
  "Design Agent",
  "Development Agent",
  "Code Review Agent",
  "Testing Agent",
  "Deploy Agent",
];

/** The "What the AI Lab builds" 4-up grid, verbatim from the reference's own `.steps` block — stays static, same reasoning as `AI_LAB_PIPELINE_STEPS`. */

/** Un-themed default background for the AI Lab band — the reference's own near-black `--ink`, distinct from the "Why Choose Us" section's own `NAVY_GRADIENT` default. */
const AI_LAB_DEFAULT_BG = "#0e0e0f";

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
 *
 * The "AI & Agentic Engineering" band described in the doc comment just
 * above `AI_LAB_PIPELINE_STEPS` always renders directly after this
 * section's own `</section>` — same entry, always both, no switch. Its
 * ForgePipeline demo list auto-cycles which step is "active" every 2.2s
 * (frozen under `prefers-reduced-motion`), and the whole band fades +
 * rises in once as it scrolls into view, same GSAP idiom as everything
 * else in this file.
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
  // The 2nd `dataText`'s own `text` field is the "Why Choose Us"
  // pull-quote callout body.
  const quoteEntry = dataTextEntries[1];
  // The 3rd `dataText` (optional) supplies the AI Lab band's own
  // eyebrow/heading/intro paragraph — falls back to the reference's
  // original copy (`AI_LAB_DEFAULT_*`) when it isn't set yet.
  const aiLabCopy = dataTextEntries[2];

  const contentDetailItems = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToWhyItem);

  const eyebrow = copy?.fields.eyebrow;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;
  const quoteText = quoteEntry?.fields.heading;

  const aiLabHeading = aiLabCopy?.fields.heading ?? AI_LAB_DEFAULT_HEADING;

  const items = contentDetailItems.length ? contentDetailItems : DEFAULT_WHY;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to this section's own un-themed default (today's
  // look, unchanged). One `themeColor`/`backgroundImage` set on this one
  // `composableElement` entry applies to *both* "Why Choose Us" and the
  // AI Lab band below — each still keeps its own distinct un-themed
  // fallback (`NAVY_GRADIENT` vs `AI_LAB_DEFAULT_BG`) so they don't look
  // identical until an editor actually sets a theme.
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


  const aiLabBackgroundStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})` }
    : theme
      ? undefined
      : { background: AI_LAB_DEFAULT_BG };

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const aiLabSectionRef = useRef<HTMLElement>(null);
  const aiLabHeadingRef = useRef<HTMLHeadingElement>(null);
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
     AI LAB HEADING REVEAL — same GSAP split-text treatment as the
     "Why Choose Us" heading above, on the AI Lab band's own heading/
     section refs. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!aiLabHeadingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(aiLabHeadingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(aiLabHeadingRef.current!, {
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
              trigger: aiLabSectionRef.current,
              start: "top 75%",
              once: true,
            },
          }),
      });
    }, aiLabSectionRef);

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
     BUILD CARD HOVER — the "what the AI Lab builds" cards lift with a
     soft amber-tinted shadow while their number badge pops with a
     slight overshoot rotate, GSAP rather than CSS so both animate in
     lockstep off one trigger (same reasoning LIST ITEM HOVER above
     gives for its own row + icon pair). Distinct from every other
     hover in this file — the pipeline steps glow in place without
     moving, the pull-quote card doesn't animate at all, and the old
     "Why Choose Us" list rows nudge sideways instead of lifting.
     Skipped under prefers-reduced-motion.
  ========================================================= */
  const handleBuildCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const numBadge = card.querySelector<HTMLElement>("[data-build-num]");

    gsap.to(card, {
      y: -8,
      boxShadow:
        "0 24px 48px -28px rgba(255,196,81,0.35), 0 14px 30px -16px rgba(0,0,0,0.5)",
      duration: 0.4,
      ease: "power2.out",
    });

    if (numBadge) {
      gsap.to(numBadge, { scale: 1.15, rotate: -8, duration: 0.4, ease: "back.out(2)" });
    }
  };

  const handleBuildCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const numBadge = card.querySelector<HTMLElement>("[data-build-num]");

    gsap.to(card, { y: 0, duration: 0.35, ease: "power2.out", clearProps: "boxShadow" });

    if (numBadge) {
      gsap.to(numBadge, { scale: 1, rotate: 0, duration: 0.35, ease: "power2.out" });
    }
  };

  /* =========================================================
     AI LAB PIPELINE CYCLE — advances the ForgePipeline demo's "active"
     step every 2.2s, wrapping back to the start, same interval the
     reference's own `tick()` uses (see the `AI_LAB_*` constants above
     this component). Skipped entirely under prefers-reduced-motion —
     stays frozen at the initial state.
  ========================================================= */
  const [aiLabActive, setAiLabActive] = useState(3);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const id = setInterval(() => {
      setAiLabActive((current) => (current + 1) % AI_LAB_PIPELINE_STEPS.length);
    }, 2200);

    return () => clearInterval(id);
  }, []);

  return (
      <section
        ref={aiLabSectionRef}
        id="ai-lab"
        aria-labelledby="ai-lab-heading"
        className={cx(
          styles.band,
          aiLabArchivo.variable,
          aiLabPlexMono.variable,
          aiLabPlexSans.variable,
          "relative overflow-hidden",
          backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
        )}
        style={aiLabBackgroundStyle}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        </div>

        <div className={cx(styles.inner, "container relative z-2")}>
          <span
            className={cx(
              "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide z-2",
              theme?.eyebrowBg ?? "bg-white/10",
              theme?.eyebrowText ?? "text-cyan-300"
            )}
          >
            {eyebrow}
          </span>
          <DynamicHeading
            level={resolveHeadingLevel(aiLabCopy?.fields.headingLevel, "h2")}
            ref={aiLabHeadingRef}
            id="ai-lab-heading"
            className={cx(
              "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] z-2",
              theme?.heading ?? "text-white"
            )}
          >
            {aiLabHeading}
          </DynamicHeading>

          <div className={styles.story}>
            <div
              className={cx(
                "rich-text max-w-2xl mt-4 text-[15px] leading-relaxed z-2",
                theme?.body ?? "text-blue-200/75"
              )}
            >
              {description}
            </div>

            <figure
              className={cx(
                styles.pull,
                theme?.cardBg ?? "bg-[#0a2885]/45",
                theme?.cardBorder ?? "border-blue-600",
              )}>
              <div aria-hidden className={styles.pullDots} />
              <div className={styles.pullInner}>
                <div className={styles.pullLabel}>ForgePipeline · Live run</div>
                <div className={styles.pipeline}>
                  {AI_LAB_PIPELINE_STEPS.map((name, index) => {
                    const done = index < aiLabActive;
                    const running = index === aiLabActive;
                    const queuedLabel =
                      index > aiLabActive
                        ? index === aiLabActive + 1
                          ? "Queued"
                          : "Gate"
                        : null;

                    return (
                      <div
                        key={name}
                        className={cx(
                          styles.pstep,
                          done && styles.pdone,
                          running && styles.prun
                        )}
                        style={
                          !done && !running
                            ? { opacity: index === aiLabActive + 1 ? 0.4 : 0.25 }
                            : undefined
                        }
                      >
                        <span className={styles.pnum}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={styles.pname}>{name}</span>
                        {done && <span className={styles.ptick}>✓</span>}
                        {running && <span className={styles.pspin} />}
                        {queuedLabel && (
                          <span className={styles.pqueued}>{queuedLabel}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className={styles.shimmer} />
              </div>
              <figcaption className={styles.pullCaption}>
                Requirement to pull request · 14 minutes · 8 AI agents · 0
                critical findings
              </figcaption>
            </figure>
          </div>

          <p className={cx(
            "mt-4 mb-2 text-[20px] leading-[1.15] font-extrabold tracking-tightz-2",
            theme?.heading ?? "text-white"
          )}>
            {quoteText}
          </p>
          <div className={styles.steps}>
            {items.map((item, index) => (
              <div key={item.title}
              onMouseEnter={handleBuildCardEnter}
              onMouseLeave={handleBuildCardLeave}
              className={cx(
                "relative p-5 z-2 rounded-2xl border",
                theme?.cardBg ?? "bg-white",
                theme?.cardBorder ?? "border-gray-200",
              )}
              >
                <span
                data-build-num
                className={cx(
              "flex items-center justify-center rounded-full h-8 w-8 text-xs font-bold tracking-wide z-2 mb-2",
              theme?.eyebrowBg ?? "bg-white/10",
              theme?.eyebrowText ?? "text-cyan-300"
            )}>0{1 + index}</span>
                <h3
                className={cx(
              "text-[16px] font-bold",
              theme?.heading ?? "text-white"
            )}>
                  {item.title}
                </h3>
                <p 
                className={cx(
                "mt-1.5 text-[13.5px] leading-relaxed ",
                theme?.body ?? "text-blue-200/75"
              )}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
}
