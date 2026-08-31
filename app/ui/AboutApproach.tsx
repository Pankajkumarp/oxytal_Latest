"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Boxes, Headphones, Rocket, Target, type LucideIcon } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import styles from "./AboutApproach.module.css";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
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

/** One highlight stat badge shown in the center card — e.g. "70% Efficiency Gain". Same shape `HomeCaseStudies` maps `statistic` entries to. */
interface StatItem {
  value: string;
  label: string;
}

interface ApproachItem {
  id: string;
  num: string;
  title: string;
  description: string;
  iconUrl?: string;
  /** Up to 3 highlight stats for this step, from its own linked `statistic` entries (`contentDetail.statistics`) — same field/reuse pattern `HomeCaseStudies` uses for its case-study cards. Empty when none are linked; the center card simply doesn't render a stats row in that case. */
  stats: StatItem[];
}

/** Cycled by item index as a fallback when a `contentDetail` entry has no `icon` image set — same pattern HomeServices/AboutServices use. Chosen to echo `Refrence/focus_journey_gsap.html`'s own 4 step emoji (🎯 discovery, 🚀 accelerate, 🧊 agile build, 🎧 support) in this project's Lucide vocabulary. */
const FALLBACK_ICONS: LucideIcon[] = [Target, Rocket, Boxes, Headphones];

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet. */
const DEFAULT_APPROACH: ApproachItem[] = [];

/** The reference's own 4 fixed corner slots (`data-position="one"|"two"|"three"|"four"` — top-left, top-right, bottom-left, bottom-right), in the same order its 4 `<article class="side-card">`s appear. Index-matched to `timelineSteps`. */
const SIDE_POSITIONS = ["one", "two", "three", "four"] as const;

/** How much of a step's `description` a side card shows — they're small (see `AboutApproach.module.css`'s own width per breakpoint) and just hint at the step, unlike the center card, which always shows the full description. */
const SIDE_DESCRIPTION_LIMIT = 55;

/** Truncates `text` to at most `limit` characters, breaking at the last whole word rather than mid-word, with a trailing "…" when it was actually cut. Returns `text` unchanged when it already fits. */
function truncateDescription(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }

  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Maps a resolved `contentDetail` entry (plus its array position) to one `ApproachItem` — `title`/`shortDescription` as the name/description, `icon` (falls back to a cycled Lucide icon) as the glyph, the array position (zero-padded) as the step number, and up to 3 linked `statistics` entries as highlight stat badges. */
function contentDetailToApproachItem(
  entry: PlainEntry<ContentDetailSkeleton>,
  index: number
): ApproachItem {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
      (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
    )
    : undefined;

  const stats: StatItem[] = (entry.fields.statistics ?? [])
    .filter(isEntry)
    .map((statEntry) => {
      const statistic = statEntry as unknown as PlainEntry<StatisticSkeleton>;

      return {
        value: statistic.fields.value ?? "",
        label: statistic.fields.label ?? "",
      };
    })
    .slice(0, 3);

  return {
    id: entry.sys.id,
    num: String(index + 1).padStart(2, "0"),
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl,
    stats,
  };
}

/** The mockup's own dark navy gradient — used as the un-themed default background, same identity `AboutHero` uses on its own section. */
const NAVY_GRADIENT = "linear-gradient(160deg, #050e2d, #0a2885 55%, #081a5a)";

/**
 * The About page's "Approach" section — a `composableElement` section
 * (`subType: "aboutApproach"` — see `ComposableElementRenderer`), split
 * out of `AboutPage` the same way `AboutHero`/`AboutStats`/`AboutStory`/
 * `AboutServices` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one step (via
 *   `contentDetailToApproachItem`) — `title`/`shortDescription` as the
 *   name/description, `icon` (falls back to a cycled Lucide icon) as the
 *   glyph, its position in `elements` (zero-padded, e.g. "01") as the
 *   step number, and up to 3 of its own linked `statistics` entries as
 *   highlight stat badges (value/label, e.g. "70% Efficiency Gain") shown
 *   in the centre card between the description and the meter — same
 *   `statistics` field/reuse pattern `HomeCaseStudies` uses for its
 *   case-study cards, empty when none are linked, no placeholder; add/
 *   remove/reorder `contentDetail` entries in Contentful to change the
 *   roster, nothing here needs to change
 *
 * The eyebrow/heading/description render exactly what's in Contentful
 * (simply omitted when unset), themed via `resolveTheme(entry.fields.
 * themeColor)` like every other composableElement section — the
 * un-themed fallback is the mockup's own dark navy gradient
 * (`NAVY_GRADIENT`) with white/cyan text. The composableElement's own
 * `backgroundImage` field (a `dataImage` entry link, same as every
 * sibling section) is an optional full-bleed background behind that;
 * `ThemePattern`'s dotted backdrop only shows when there's no background
 * photo.
 *
 * CARDS — a faithful port of `Refrence/focus_journey_gsap.html`'s "focus
 * journey" layout (see `AboutApproach.module.css` for the ported
 * stylesheet): a large "in focus" center card (icon/title/description/a
 * filling progress meter) surrounded by a decorative halo and a rotating
 * orbit ring with a pulsing light, with up to the first 4 steps as
 * clickable corner "side cards" connected to the centre by diagonal
 * lines. This is a fixed 4-slot design (like the reference itself, whose
 * own 4 stages are hardcoded) — a 5th+ `contentDetail` entry simply isn't
 * rendered, and with fewer than 4 an unused corner's side card (and its
 * connector line) is simply absent, no placeholder.
 *
 * Two things happen at once, mostly independently (same as the
 * reference, which doesn't coordinate them either):
 *
 * - an auto-looping GSAP timeline (`repeat: -1`) cycles the centre
 *   through every step in order: fades the previous step's number/icon/
 *   title/description out and the next one in (staggered, with a small
 *   rotate+scale flourish on the icon), "breathes" the centre card while
 *   its meter fills, and dims every side card except whichever one is
 *   coming up next. The orbit ring keeps spinning and its light keeps
 *   pulsing throughout, on their own separate infinite tweens
 * - clicking a side card jumps the centre straight to that step: an
 *   instant (unanimated) content swap — exactly like the reference's own
 *   `setContent`, which overwrites `textContent` synchronously rather
 *   than fading — plus the same meter-refill/centre-bounce/other-cards-
 *   dim flourish the auto-loop uses. It doesn't pause or resync the
 *   auto-loop (the reference doesn't either), so the loop simply
 *   continues on its own schedule after a click
 *
 * Unlike the reference, which autoplays forever from page load (a
 * standalone demo page), all three animations (the auto-loop, the orbit
 * spin, and the light pulse) are played/paused by a `ScrollTrigger` as
 * this section enters/leaves the viewport — this lives partway down a
 * real page and shouldn't keep animating indefinitely off-screen. The
 * whole thing is skipped under `prefers-reduced-motion`: every step's
 * content and every side card render at full opacity with the meter
 * already full, and the orbit light is hidden (`AboutApproach.module.
 * css`'s own reduced-motion block), matching the reference's own
 * reduced-motion override.
 *
 * Because each step's number/icon/title/description needs its own
 * always-present DOM node for GSAP to animate (rather than the
 * reference's single node whose `textContent` gets overwritten — this is
 * React, not the reference's plain-DOM script), every step's content
 * renders as its own absolutely-stacked `.centerContentLayer` layer, and
 * only the active one is un-hidden (`aria-hidden`, kept in sync with the
 * animation) at a time — see `AboutApproach.module.css`'s own doc
 * comment for that and the rest of this port's structural deviations.
 *
 * The heading above all of this still gets the same GSAP split-text
 * scroll-reveal every other section's heading uses.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutApproach({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailSteps = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map((detailEntry, index) => contentDetailToApproachItem(detailEntry, index));

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const steps = contentDetailSteps.length ? contentDetailSteps : DEFAULT_APPROACH;
  // Fixed 4-slot design — see the component doc comment above.
  const timelineSteps = steps.slice(0, 4);

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text colors (the eyebrow/heading/
  // description above the journey only — the journey's own cards keep
  // the reference's fixed light palette regardless, see
  // `AboutApproach.module.css`'s doc comment). `undefined` for an unset
  // or unrecognized value, in which case every themed class below falls
  // back to the mockup's own dark navy gradient + white/cyan text
  // (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern AboutHero/AboutStats/AboutStory/AboutServices use). Optional
  // here: no placeholder fallback, so it's simply absent until an editor
  // sets one — wins over both the gradient and the theme when set.
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

  const stageRef = useRef<HTMLDivElement>(null);
  const centerCardRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numberRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const statsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sideCardRefs = useRef<(HTMLElement | null)[]>([]);
  const pipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const orbitPathRef = useRef<HTMLDivElement>(null);
  const orbitLightRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     HomeAI/HomeServices/AboutHero/AboutStory/AboutServices). Skipped
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

  /** Toggles the pip at `index` active — shared by the auto-loop and the click handler (see `jumpToStage`). */
  function setActivePip(index: number) {
    pipRefs.current.forEach((pip, i) => {
      pip?.classList.toggle(styles.stepPipActive, i === index);
    });
  }

  /**
   * Marks the side card at `index` "selected" (its own distinct
   * background/border/scale — see `.sideCard.selected` in
   * `AboutApproach.module.css`) — whichever step is currently shown
   * large in the centre, so its own corner card reads as the one
   * currently "in focus". Shared by the auto-loop and the click
   * handler. Also clears any inline opacity/scale a *previous* dim/
   * emphasis tween left on the newly-selected card (see the auto-loop's
   * own per-side-card tween below, which skips the currently-selected
   * card for the same reason) — an inline style otherwise outranks the
   * `.selected` class's own opacity/transform and would mask it.
   */
  function setSideSelected(index: number) {
    sideCardRefs.current.forEach((card, i) => {
      if (!card) {
        return;
      }

      card.classList.toggle(styles.selected, i === index);

      if (i === index) {
        gsap.set(card, { clearProps: "opacity,scale" });
      }
    });
  }

  /**
   * Side-card click handler — jumps the centre straight to `index`. An
   * instant (unanimated) content swap, exactly like the reference's own
   * `setContent` (which overwrites `textContent` synchronously, no
   * fade), plus the same meter-refill/centre-bounce/other-cards-dim
   * flourish the auto-loop itself uses for each step. Doesn't touch the
   * auto-loop timeline — like the reference, a click doesn't pause or
   * resync it, so the loop just continues on its own schedule.
   */
  function jumpToStage(index: number) {
    if (prefersReducedMotion()) {
      return;
    }

    timelineSteps.forEach((_, i) => {
      const active = i === index;

      gsap.set(
        [numberRefs.current[i], titleRefs.current[i], textRefs.current[i], statsRefs.current[i]].filter(
          Boolean
        ),
        { opacity: active ? 1 : 0, y: 0 }
      );
      gsap.set(iconRefs.current[i], {
        opacity: active ? 1 : 0,
        scale: active ? 1 : 0.82,
        rotate: 0,
      });
      layerRefs.current[i]?.setAttribute("aria-hidden", active ? "false" : "true");
    });

    setActivePip(index);
    setSideSelected(index);

    const meter = meterRef.current;
    if (meter) {
      gsap.to(meter, { width: "0%", duration: 0.2, ease: "power2.in" }).then(() => {
        gsap.to(meter, { width: "100%", duration: 1.5, ease: "power2.inOut" });
      });
    }

    const center = centerCardRef.current;
    if (center) {
      gsap.to(center, { scale: 0.95, opacity: 0.8, duration: 0.2, ease: "power2.in" }).then(() => {
        gsap.to(center, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" });
      });
    }

    sideCardRefs.current.forEach((card, i) => {
      if (!card || i === index) {
        return;
      }
      gsap.to(card, { opacity: 0.48, scale: 0.96, duration: 0.35, ease: "power2.out" });
    });
  }

  /* =========================================================
     FOCUS JOURNEY ANIMATION — see the component doc comment above for
     the full behavior. Skipped entirely under prefers-reduced-motion,
     which instead just settles every step's content/side card at full
     opacity with the meter already full (the orbit light is hidden via
     `AboutApproach.module.css`'s own reduced-motion rule).
  ========================================================= */
  useLayoutEffect(() => {
    if (!stageRef.current || timelineSteps.length === 0) {
      return;
    }

    const center = centerCardRef.current;
    const meter = meterRef.current;
    const orbit = orbitPathRef.current;
    const orbitLight = orbitLightRef.current;

    if (!center || !meter || !orbit || !orbitLight) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(
        [
          ...numberRefs.current,
          ...titleRefs.current,
          ...textRefs.current,
          ...statsRefs.current,
          ...iconRefs.current,
        ].filter(Boolean),
        { opacity: 1, y: 0, scale: 1, rotate: 0 }
      );
      layerRefs.current.forEach((layer) => layer?.setAttribute("aria-hidden", "false"));
      gsap.set(meter, { width: "100%" });
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const total = timelineSteps.length;

    /* =========================================================
       INITIAL STATE — only step 0's content/side-card weighting is
       visible; everything else starts hidden/dimmed, matching the JSX's
       own SSR-safe inline defaults (this just re-confirms them under
       GSAP's ownership before the timeline plays).
    ========================================================= */
    gsap.set(
      [...numberRefs.current, ...titleRefs.current, ...textRefs.current, ...statsRefs.current].filter(
        Boolean
      ),
      { opacity: 0, y: -8 }
    );
    gsap.set(iconRefs.current.filter(Boolean), { opacity: 0, scale: 0.82, rotate: 8 });
    gsap.set(
      [
        numberRefs.current[0],
        titleRefs.current[0],
        textRefs.current[0],
        statsRefs.current[0],
      ].filter(Boolean),
      { opacity: 1, y: 0 }
    );
    gsap.set(iconRefs.current[0], { opacity: 1, scale: 1, rotate: 0 });
    gsap.set(meter, { width: "0%" });

    setSideSelected(0);

    const initialNextIndex = 1 % total;
    sideCardRefs.current.forEach((card, i) => {
      if (!card || i === 0) {
        return;
      }
      gsap.set(card, {
        opacity: i === initialNextIndex ? (isMobile ? 0.7 : 0.78) : isMobile ? 0.4 : 0.48,
        scale: i === initialNextIndex ? 1.03 : 0.96,
      });
    });

    /* Ambient motion — spins/pulses forever, independent of the step
       cycle below (same as the reference). */
    const orbitSpin = gsap.to(orbit, {
      rotation: 360,
      duration: isMobile ? 20 : 16,
      repeat: -1,
      ease: "none",
    });

    const orbitPulse = gsap.to(orbitLight, {
      scale: 1.7,
      opacity: 0.45,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const outDuration = isMobile ? 0.14 : 0.18;
    const outStagger = isMobile ? 0.01 : 0.02;
    const introDuration = isMobile ? 0.32 : 0.38;
    const introStagger = isMobile ? 0.04 : 0.05;
    const iconInDuration = isMobile ? 0.42 : 0.5;
    const breatheScale = isMobile ? 1.015 : 1.025;
    const meterFillDuration = isMobile ? 1.5 : 1.65;
    const sideDuration = isMobile ? 0.32 : 0.38;

    const master = gsap.timeline({ repeat: -1, repeatDelay: isMobile ? 0.45 : 0.55, paused: true });

    timelineSteps.forEach((_, index) => {
      const number = numberRefs.current[index];
      const title = titleRefs.current[index];
      const text = textRefs.current[index];
      const stats = statsRefs.current[index];
      const icon = iconRefs.current[index];

      if (!number || !title || !text || !stats || !icon) {
        return;
      }

      master.call(() => {
        setActivePip(index);
        setSideSelected(index);
        layerRefs.current[index]?.setAttribute("aria-hidden", "false");
      });

      if (index > 0) {
        const prevIndex = index - 1;

        master
          .to(
            [
              numberRefs.current[prevIndex],
              titleRefs.current[prevIndex],
              textRefs.current[prevIndex],
              statsRefs.current[prevIndex],
            ].filter(Boolean),
            { opacity: 0, y: 8, duration: outDuration, stagger: outStagger, ease: "power2.in" }
          )
          .to(
            iconRefs.current[prevIndex],
            { opacity: 0, scale: 0.8, rotate: -8, duration: outDuration, ease: "power2.in" },
            "<"
          )
          .call(() => {
            layerRefs.current[prevIndex]?.setAttribute("aria-hidden", "true");
          });
      }

      master.set([number, title, text, stats], { opacity: 0, y: -8 });
      master.set(icon, { opacity: 0, scale: 0.82, rotate: 8 });

      master
        .to([number, title, text, stats], {
          opacity: 1,
          y: 0,
          duration: introDuration,
          stagger: introStagger,
          ease: "power3.out",
        })
        .to(icon, { opacity: 1, scale: 1, rotate: 0, duration: iconInDuration, ease: "back.out(1.6)" }, "<");

      master
        .to(center, { scale: breatheScale, y: -5, duration: 0.4, ease: "power2.out" })
        .to(meter, { width: "100%", duration: meterFillDuration, ease: "power2.inOut" }, "<")
        .to(center, { scale: 1, y: 0, duration: 0.45, ease: "power2.inOut" });

      // The side card whose stage is coming up next gets emphasized;
      // every other side card dims — cycles all the way around as the
      // loop advances. The currently-*selected* card (this step's own —
      // see `setSideSelected` above) is skipped entirely: its look is
      // owned by the `.selected` CSS class, not an inline GSAP tween.
      const nextIndex = (index + 1) % total;

      sideCardRefs.current.forEach((card, cardIndex) => {
        if (!card || cardIndex === index) {
          return;
        }

        master.to(
          card,
          {
            opacity: cardIndex === nextIndex ? (isMobile ? 0.7 : 0.78) : isMobile ? 0.4 : 0.48,
            scale: cardIndex === nextIndex ? 1.03 : 0.96,
            duration: sideDuration,
            ease: "power2.out",
          },
          "-=.35"
        );
      });

      master.to({}, { duration: 0.25 });
      master.to(meter, { width: "0%", duration: 0.22, ease: "power2.in" });
    });

    // A soft final blip keeps the loop from feeling like it "restarts"
    // abruptly when it wraps back to step 0.
    master
      .to(center, { scale: 0.985, opacity: 0.92, duration: 0.3 })
      .to(center, { scale: 1, opacity: 1, duration: 0.3 });

    const trigger = ScrollTrigger.create({
      trigger: stageRef.current,
      start: "top 85%",
      end: "bottom 15%",
      onEnter: () => {
        master.play();
        orbitSpin.play();
        orbitPulse.play();
      },
      onEnterBack: () => {
        master.play();
        orbitSpin.play();
        orbitPulse.play();
      },
      onLeave: () => {
        master.pause();
        orbitSpin.pause();
        orbitPulse.pause();
      },
      onLeaveBack: () => {
        master.pause();
        orbitSpin.pause();
        orbitPulse.pause();
      },
    });

    return () => {
      trigger.kill();
      master.kill();
      orbitSpin.kill();
      orbitPulse.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on `timelineSteps.length` (the fixed-slot count), not the `timelineSteps` array itself, which gets a new identity every render (`steps.slice(0, 4)`) and would rebuild the whole timeline on every render instead of only when the step count actually changes.
  }, [timelineSteps.length]);

  return (
    <section
      ref={sectionRef}
      id="approach"
      aria-labelledby="approach-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-16",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "")
      )}
      style={backgroundStyle}
    >

      <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      <div className="container relative mx-auto px-5 md:px-10">
        <div className="max-w-xl">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-white/10",
                theme?.eyebrowText ?? "text-cyan-300"
              )}
            >
              {eyebrow}
            </span>
          )}
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            id="approach-heading"
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

        {/* =================================================
            FOCUS JOURNEY — see the component doc comment above.
        ================================================= */}
        {timelineSteps.length > 0 && (
          <div ref={stageRef} className={cx("relative", styles.focusStage)}>
            <div aria-hidden className={styles.halo} />

            <div ref={orbitPathRef} aria-hidden className={styles.orbitPath}>
              <div ref={orbitLightRef} className={styles.orbitLight} />
            </div>

            {timelineSteps.length > 0 && (
              <span aria-hidden className={cx(styles.connector, styles.connectorLeftTop)} />
            )}
            {timelineSteps.length > 1 && (
              <span aria-hidden className={cx(styles.connector, styles.connectorRightTop)} />
            )}
            {timelineSteps.length > 2 && (
              <span aria-hidden className={cx(styles.connector, styles.connectorLeftBottom)} />
            )}
            {timelineSteps.length > 3 && (
              <span aria-hidden className={cx(styles.connector, styles.connectorRightBottom)} />
            )}

            {timelineSteps.map((step, index) => (
              <article
                key={step.id}
                ref={(el) => {
                  sideCardRefs.current[index] = el;
                }}
                data-position={SIDE_POSITIONS[index]}
                className={cx(styles.sideCard, index === 0 && styles.selected)}
                onClick={() => jumpToStage(index)}
              >
                <div className={styles.sideNumber}>{step.num}</div>
                <span className="block">{step.title}</span>
                <p>{truncateDescription(step.description, SIDE_DESCRIPTION_LIMIT)}</p>
              </article>
            ))}

            <article ref={centerCardRef} className={styles.centerCard}>
              <div className={styles.centerContentStack}>
                {timelineSteps.map((step, index) => {
                  const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
                  const isActive = index === 0;
                  const hiddenStyle = isActive
                    ? undefined
                    : { opacity: 0, transform: "translateY(-8px)" };

                  return (
                    <div
                      key={step.id}
                      ref={(el) => {
                        layerRefs.current[index] = el;
                      }}
                      className={styles.centerContentLayer}
                      aria-hidden={!isActive}
                    >
                      <div
                        ref={(el) => {
                          numberRefs.current[index] = el;
                        }}
                        className={styles.centerNumber}
                        style={hiddenStyle}
                      >
                        {step.num} / {String(timelineSteps.length).padStart(2, "0")}
                      </div>

                      <div
                        ref={(el) => {
                          iconRefs.current[index] = el;
                        }}
                        className={styles.centerIcon}
                        style={
                          isActive
                            ? undefined
                            : { opacity: 0, transform: "scale(0.82) rotate(8deg)" }
                        }
                      >
                        {step.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                          <img
                            src={step.iconUrl}
                            alt=""
                            aria-hidden
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <FallbackIcon size={26} aria-hidden />
                        )}
                      </div>

                      <div
                        ref={(el) => {
                          titleRefs.current[index] = el;
                        }}
                        className="text-[21px] font-bold leading-[1.5]"
                        style={hiddenStyle}
                      >
                        {step.title}
                      </div>

                      <p
                        ref={(el) => {
                          textRefs.current[index] = el;
                        }}
                        style={hiddenStyle}
                      >
                        {step.description}
                      </p>

                      {/* Always rendered (even with no `stats`, as an
                          empty — and so invisible, zero-height — row) so
                          `statsRefs.current[index]` is never null: the
                          animation code above groups this ref alongside
                          number/title/text/icon unconditionally. */}
                      <div
                        ref={(el) => {
                          statsRefs.current[index] = el;
                        }}
                        className={styles.centerStats}
                        style={hiddenStyle}
                      >
                        {step.stats.map((stat) => (
                          <span key={stat.label}
                            className={cx(
                              "inline-block w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wide",
                              theme?.eyebrowBg ?? "bg-white/10",
                              theme?.eyebrowText ?? "text-cyan-300"
                            )}
                          >
                            {stat.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.centerMeter}>
                <span ref={meterRef} className={styles.centerMeterFill} />
              </div>
            </article>

            <div className={styles.stepPips} aria-hidden>
              {timelineSteps.map((step, index) => (
                <span
                  key={step.id}
                  ref={(el) => {
                    pipRefs.current[index] = el;
                  }}
                  className={cx(styles.stepPip, index === 0 && styles.stepPipActive)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
