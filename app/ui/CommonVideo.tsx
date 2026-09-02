"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { resolveTheme, SectionTheme } from "../lib/theme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export type CommonVideoContentPosition = "left" | "center" | "right";

export type CommonVideoAspectRatio = "16/9" | "21/9" | "4/3" | "1/1" | "9/16";

export type CommonVideoHeadingLevel = "h1" | "h2" | "h3" | "h4";

export type CommonVideoOverlay = "dark" | "light";

/**
 * "primary" is the filled button (`themeColor.buttonBg`/`buttonText`/
 * `buttonHoverBg`). "link" is an outline/ghost button that borrows
 * whatever text color the heading is already using (via `border-
 * current`), since there's no dedicated field for it on `SectionTheme`.
 * Named to match `dataLink.type`'s own two values ("primary"/"link"), so
 * a link entry's `type` field maps onto this with no translation needed
 * (see `PageBody`'s `dataVideo` case).
 */
export type CommonVideoButtonVariant = "primary" | "link";

export interface CommonVideoButton {
  text: string;
  /** Renders an `<a>` when set; otherwise a `<button>` that calls `onClick`. */
  href?: string;
  onClick?: () => void;
  /** Defaults to "primary". */
  variant?: CommonVideoButtonVariant;
}

export interface CommonVideoProps {
  /** Primary video source. Any browser-playable URL, e.g. a `dataVideo.videoFile` asset URL from Contentful. */
  videoSrc: string;
  /** Optional alternate source served under `md:` (768px) — matches `dataVideo.videoFileMobile`. */
  videoSrcMobile?: string;
  /** Poster frame shown before the video can play. */
  poster?: string;
  /** Accessible label for the video. Falls back to `heading`, then a generic label. */
  videoLabel?: string;
  /** Small label above the heading, e.g. "OUR STORY" (mirrors the `eyebrow` field used across Contentful content types). Always renders in the default white-on-glass pill style — no per-entry color override. */
  eyebrow?: string;
  /** Section heading. Rendering the text overlay on the video is skipped entirely when this, `description`, and the CTA are all omitted. Always renders in the default responsive size/color — no per-entry override. */
  heading?: string;
  /** Tag used for `heading`. Defaults to "h2" so the section nests correctly under a page's own `<h1>`. */
  headingLevel?: CommonVideoHeadingLevel;
  /** Always renders in the default size/color — no per-entry override. */
  description?: string;
  /**
   * Any number of CTAs, rendered side by side (wrapping on narrow
   * screens) — one entry is one button, two is two, and so on. Each
   * button's own `variant` (default "primary") picks its style; see
   * `CommonVideoButtonVariant`.
   */
  buttons?: CommonVideoButton[];
  /** Horizontal alignment of the text overlaid on the video. Defaults to "center". */
  contentPosition?: CommonVideoContentPosition;
  /** Applied to the root `<section>`. */
  className?: string;
  /** Box shape at `md:` (768px) and up. Defaults to "16/9". */
  aspectRatio?: CommonVideoAspectRatio;
  /** Box shape below `md:` — matters most when `videoSrcMobile` is a differently-shaped (e.g. portrait) video, so the box doesn't force a landscape crop onto it. Defaults to `aspectRatio`. */
  aspectRatioMobile?: CommonVideoAspectRatio;
  /** Plays the video once it scrolls into view and pauses it when it scrolls out. Defaults to true. */
  autoPlay?: boolean;
  loop?: boolean;
  /** Ignored (forced true) while `autoPlay` is true — browsers block unmuted autoplay. */
  muted?: boolean;
  controls?: boolean;
  /** Eagerly preloads the video for above-the-fold placements. Defaults to false (`preload="metadata"`). */
  priority?: boolean;
  /** Tint drawn directly over the video itself (independent of the text overlay's own scrim): "dark" lays a black scrim over it, "light" a white one. Omit for no tint at all — this never defaults to either color. */
  overlay?: CommonVideoOverlay;
  textDelay?: number;
  theme?: string;
}

const ASPECT_RATIO_CLASSES: Record<CommonVideoAspectRatio, string> = {
  "16/9": "aspect-video",
  "21/9": "aspect-[21/9]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "9/16": "aspect-[9/16]",
};

/**
 * Below `md:`, uses `aspectRatioMobile` (falling back to `aspectRatio`);
 * at `md:` and up, switches to `aspectRatio`. Matches the same 768px
 * breakpoint the `<source media="(max-width: 767px)">` swap already uses.
 */
function aspectRatioClasses(
  aspectRatio: CommonVideoAspectRatio,
  aspectRatioMobile: CommonVideoAspectRatio | undefined
) {
  const desktopClass = ASPECT_RATIO_CLASSES[aspectRatio];
  const mobileClass = ASPECT_RATIO_CLASSES[aspectRatioMobile ?? aspectRatio];

  return mobileClass === desktopClass
    ? desktopClass
    : `${mobileClass} md:${desktopClass}`;
}

/**
 * `overlay` tint classes — a bottom-to-top gradient (strongest at the
 * bottom, fading to fully transparent at the top) rather than a flat
 * tint, so it reads as a classic video-caption scrim: it darkens/lightens
 * the ground behind the bottom-aligned text overlay without dimming the
 * video's upper portion at all.
 */
const OVERLAY_CLASSES: Record<CommonVideoOverlay, string> = {
  dark: "[background:linear-gradient(90deg,rgba(42,123,155,1)_0%,rgb(82_85_83_/_74%)_50%,rgb(219_218_209)_100%)]",
  light: "bg-gradient-to-t from-white/90 via-white/30 to-transparent",
};

/** Horizontal placement of the overlay's text block *within* the video box (the overlay itself always spans the full box — see `hasContent` below). */
const CONTENT_ALIGNMENT_CLASSES: Record<CommonVideoContentPosition, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

/** Default (unthemed) colors, used for every block rendered outside a themed `composableElement` wrapper — i.e. wherever `renderBlock` isn't passed a resolved `theme`. */
const DEFAULT_BLOCK_THEME: SectionTheme = {
  sectionBg:"bg-gradient-to-br from-[#08172E] via-[#112B5C] to-[#123B5D]",
  eyebrowBg: "bg-white/90",
  eyebrowText: "text-[#0E9BC4]",
  heading: "text-white",
  body: "text-slate-300",
  muted: "text-slate-500",
  buttonBg: "bg-cyan-500",
  buttonText: "text-slate-950",
  buttonHoverBg: "hover:bg-cyan-400",
  accentText: "text-cyan-300",
  cardBg: "bg-white/5 backdrop-blur-md",
  cardBorder: "border-white/10",
  patternColor: "#7DC7C7",
  showPattern: false,
};
/**
 * A video block that can stand alone, or grow into a full "premium" section
 * with eyebrow/heading/description/CTA text rendered *directly on top of
 * the video itself* (a scrim gradient behind the text keeps it readable
 * over arbitrary video content), with GSAP-driven reveal animations,
 * whenever content props are supplied.
 *
 * @example Video only — no wrapper, no extra spacing, just the video
 * ```tsx
 * <CommonVideo videoSrc="/videos/showreel.mp4" poster="/images/showreel-poster.jpg" />
 * ```
 *
 * @example Video with a heading + description
 * ```tsx
 * <CommonVideo
 *   videoSrc="https://videos.ctfassets.net/space/asset/showreel.mp4"
 *   poster="https://images.ctfassets.net/space/asset/poster.jpg"
 *   eyebrow="OUR STORY"
 *   heading="Built by people who ship"
 *   description="A small studio-sized team that designs, builds and ships without handoffs lost in translation."
 * />
 * ```
 *
 * @example Portrait video on mobile, landscape on desktop — the box shape
 * follows `videoSrcMobile` instead of forcing a landscape crop onto it
 * ```tsx
 * <CommonVideo
 *   videoSrc="/videos/hero-landscape.mp4"
 *   videoSrcMobile="/videos/hero-portrait.mp4"
 *   aspectRatio="16/9"
 *   aspectRatioMobile="9/16"
 * />
 * ```
 *
 * @example Video with heading, description and a CTA
 * ```tsx
 * <CommonVideo
 *   videoSrc="/videos/case-study.mp4"
 *   videoSrcMobile="/videos/case-study-mobile.mp4"
 *   poster="/images/case-study-poster.jpg"
 *   eyebrow="CASE STUDY"
 *   heading="3x organic leads in 90 days"
 *   description="Northwind Labs rebuilt their funnel around how buyers actually research — here's how it played out."
 *   buttons={[{ text: "Read the case study", href: "/case-studies/northwind-labs" }]}
 *   contentPosition="left"
 * />
 * ```
 *
 * @example Video with two CTAs — a filled primary and an outline "link"
 * ```tsx
 * <CommonVideo
 *   videoSrc="/videos/products-hero.mp4"
 *   heading="Every one of these started as a problem we had."
 *   buttons={[
 *     { text: "See the four", href: "#products" },
 *     { text: "Build something like this", href: "/contact-us", variant: "link" },
 *   ]}
 * />
 * ```
 */
export default function CommonVideo({
  videoSrc,
  videoSrcMobile,
  poster,
  videoLabel,
  eyebrow,
  heading,
  headingLevel = "h2",
  description,
  buttons,
  contentPosition = "center",
  className,
  aspectRatio = "16/9",
  aspectRatioMobile,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  priority = false,
  overlay,
  textDelay,
  theme,
}: CommonVideoProps) {
  const themeColor = resolveTheme(theme) ?? DEFAULT_BLOCK_THEME;
  const resolvedButtons = buttons ?? [];
  const hasCta = resolvedButtons.length > 0;
  const hasContent = Boolean(eyebrow || heading || description || hasCta);

  // "link"-variant buttons have no dedicated theme field of their own —
  // they borrow whatever text color the heading is already using, via
  // `border-current`, so they read correctly whichever theme is in play.
  const primaryButtonClasses = cx(
    themeColor?.buttonBg ?? "bg-gradient-to-r from-[#1450d4] to-[#2d7dfa]",
    themeColor?.buttonText ?? "text-white",
    themeColor?.buttonHoverBg
  );
  const linkButtonClasses = cx(
    themeColor?.heading ?? "text-white",
    "border border-current/35 bg-transparent hover:bg-current/10"
  );

  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsWrapperRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const HeadingTag = headingLevel;

  /** Seconds the whole text overlay (eyebrow/heading/description/button) waits — after the section scrolls into view — before it reveals. The video itself isn't held back by this; it reveals on its own usual timing. */
  const TEXT_REVEAL_DELAY = textDelay || 0;

  /* =========================================================
     REVEAL ANIMATIONS (heading split-text, fade-up stagger,
     video reveal) — only for the content section.
     useLayoutEffect (not useEffect) so the hidden "from" state GSAP
     applies for the paused ScrollTrigger timeline is set before the
     browser paints — otherwise, if this section is already near/within
     the ScrollTrigger threshold on load, content flashes fully visible
     for a frame and then snaps to hidden.

     `gsap.context()`'s scope is passed as `sectionRef.current` (the
     resolved element), not the ref object itself — already
     null-checked above, and passing the concrete element means GSAP
     never needs to dereference `.current` itself later. That
     dereference is what its own `Invalid scope` console warning comes
     from, seen intermittently on this page alongside a sibling
     ScrollTrigger/SplitText section's crash.
  ========================================================= */
  useLayoutEffect(() => {
    if (!hasContent || !sectionRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            eyebrowRef.current,
            headingRef.current,
            descriptionRef.current,
            buttonsWrapperRef.current,
            videoWrapperRef.current,
          ].filter(Boolean) as Element[],
          { opacity: 1, y: 0, scale: 1 }
        );
        return;
      }

      // Each piece gets its own independent tween/ScrollTrigger (all
      // anchored to the same section+start point, cascaded via `delay`)
      // rather than being positioned relative to the heading's SplitText
      // tween inside one shared timeline. SplitText's `autoSplit` can defer
      // `onSplit` until web fonts finish loading, which happens
      // asynchronously — if that landed after this effect ran, a shared
      // timeline's relative positions (and its ScrollTrigger duration math)
      // would be built against a heading tween that doesn't exist yet, and
      // the rest of the timeline could end up never actually playing.
      // Independent tweens can't be broken by that.
      const scrollTrigger = {
        trigger: sectionRef.current,
        start: "top 75%",
        once: true,
      } as const;

      // Whole text overlay (eyebrow + description + button — heading gets
      // its own tween below since it needs SplitText) held back by
      // `TEXT_REVEAL_DELAY` once the section scrolls into view, so the
      // video plays alone first and the caption appears after it.
      const fadeTargets = [
        eyebrowRef.current,
        descriptionRef.current,
        buttonsWrapperRef.current,
      ].filter(Boolean) as Element[];

      if (fadeTargets.length) {
        gsap.from(fadeTargets, {
          y: 24,
          opacity: 0,
          duration: 0.9,
          delay: TEXT_REVEAL_DELAY,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger,
        });
      }

      if (videoWrapperRef.current) {
        gsap.from(videoWrapperRef.current, {
          y: 40,
          scale: 0.96,
          opacity: 0,
          duration: 1.1,
          delay: 0.7,
          ease: "power3.out",
          scrollTrigger,
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
              delay: TEXT_REVEAL_DELAY,
              ease: "power4.out",
              stagger: 0.06,
              scrollTrigger,
            }),
        });
      }

    }, sectionRef.current);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [hasContent, eyebrow, heading, description, buttons, TEXT_REVEAL_DELAY]);

  /* =========================================================
     VIEWPORT-TRIGGERED PLAYBACK — play once visible, pause once
     scrolled away, instead of always-on autoplay.
  ========================================================= */
  useEffect(() => {
    if (!autoPlay || !videoRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }

    const videoEl = videoRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {
            /* Autoplay can be rejected by the browser; controls (if enabled) still let the visitor start it. */
          });
        } else {
          videoEl.pause();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(videoEl);

    return () => observer.disconnect();
  }, [autoPlay]);

  const videoBlock = (
    <div
      ref={videoWrapperRef}
      className={cx(
        // `max-h` caps how tall the box can get on wide/ultra-wide screens
        // (a full-width 16:9 box gets very tall there); `object-cover` on
        // the <video> below still fills it edge-to-edge with no letterboxing
        // once the aspect-ratio's implied height gets clamped by max-h.
        "relative mx-auto w-full max-h-[100vh] overflow-hidden bg-gray-900 shadow-xl shadow-gray-900/10",
        aspectRatioClasses(aspectRatio, aspectRatioMobile)
      )}
    >
      <video
        ref={videoRef}
        poster={poster}
        muted={autoPlay ? true : muted}
        loop={loop}
        controls={controls}
        playsInline
        preload={priority ? "auto" : "metadata"}
        aria-label={videoLabel ?? heading ?? "Video"}
        className="h-full w-full object-cover"
      >
        {videoSrcMobile && (
          <source src={videoSrcMobile} media="(max-width: 767px)" />
        )}
        <source src={videoSrc} />
      </video>

      {/* Tint over the video itself — separate from the text overlay's own
          scrim above/below it. Renders nothing when `overlay` is unset, so
          a `dataVideo` entry that never sets the field looks exactly as it
          did before this prop existed. */}
      {overlay && (
        <div
          aria-hidden="true"
          className={cx("pointer-events-none absolute inset-0", OVERLAY_CLASSES[overlay])}
        />
      )}
    </div>
  );

  /* Video-only: no content wrapper, no section padding, no decorative background. */
  if (!hasContent) {
    return (
      <section ref={sectionRef} className={cx("relative", className)}>
        {videoBlock}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={cx("relative overflow-hidden", className)}
    >
        {/* Positioning context for the scrim + text overlay below — both
            are `absolute inset-0` against this box, not the video element
            itself, so they line up with the video's own aspect-ratio box
            (letterboxing-safe) regardless of screen size. */}
        <div className="relative">
          {videoBlock}


          {/* =================================================
              TEXT OVERLAY — rendered directly on top of the video
              (not a separate block above/below it). Bottom-aligned by
              default (the classic video-caption position); horizontal
              placement follows `contentPosition`.
          ================================================= */}
          <div
            className={cx(
              "absolute inset-0 flex flex-col justify-end gap-4 p-6 sm:p-10 md:gap-5 md:p-14",
              CONTENT_ALIGNMENT_CLASSES[contentPosition]
            )}
          >
            {/* Alignment applied again here, not just on the outer overlay
                above: the outer `items-*` only centers/left/right-positions
                this whole block as a unit — it doesn't reach into this
                inner flex container's own children. Without it, the
                eyebrow badge (an `inline-block w-fit` span, which resists
                the default `align-items: stretch`) falls back to
                flex-start and sits pinned to the left even when
                `contentPosition="center"`, while the heading/paragraph
                look centered anyway only because their *text* is centered
                inside a box that still spans the full stretched width. */}
            <div
              className={cx(
                "flex max-w-4xl flex-col gap-4 md:gap-5",
                CONTENT_ALIGNMENT_CLASSES[contentPosition]
              )}
            >
              {eyebrow && (
                <span
                  ref={eyebrowRef}
                  className={cx(
                    "inline-block w-fit rounded-full  px-4 py-1.75 text-xs font-bold tracking-wide",
                    themeColor?.eyebrowBg ?? "bg-white",
                  themeColor?.eyebrowText ?? "text-cyan-300"
                  )}
                >
                  {eyebrow}
                </span>
              )}

              {heading && (
                <HeadingTag
                  ref={headingRef as never}
                  className={cx(
                    "text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[42px] lg:text-[60px]",
                    themeColor.heading ?? "text-gray-200"
                  )}
                >
                  {heading}
                </HeadingTag>
              )}

              {description && (
                <p
                  ref={descriptionRef}
                  className={cx(
                    "text-[15.5px] leading-relaxed md:text-[17px]",
                    themeColor?.body ?? "text-blue-200/80"
                  )}
                >
                  {description}
                </p>
              )}

              {hasCta && (
                <div
                  ref={buttonsWrapperRef}
                  className={cx(
                    "mt-1 flex flex-wrap items-center gap-3",
                    contentPosition === "center" && "justify-center",
                    contentPosition === "right" && "justify-end"
                  )}
                >
                  {resolvedButtons.map((btn, index) => {
                    const variantClasses = btn.variant === "link" ? linkButtonClasses : primaryButtonClasses;

                    return btn.href ? (
                      <a
                        key={index}
                        href={btn.href}
                        className={cx(
                          "group lg:min-w-[185px] inline-flex w-fit items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg shadow-black/25 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
                          variantClasses
                        )}
                      >
                        {btn.text}
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </a>
                    ) : (
                      <button
                        key={index}
                        type="button"
                        onClick={btn.onClick}
                        className={cx(
                          "group lg:min-w-[185px] inline-flex w-fit items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg shadow-black/25 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
                          variantClasses
                        )}
                      >
                        {btn.text}
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
    </section>
  );
}
