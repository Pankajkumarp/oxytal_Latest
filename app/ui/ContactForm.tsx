"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ChevronDown,
  Clock,
  Compass,
  FileSearch,
  FileText,
  Globe,
  Layers,
  Lightbulb,
  Mail,
  Phone,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Star,
  User,
  Wallet,
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

interface ProcessStep {
  title: string;
  description: string;
  iconUrl?: string;
}

interface TrustStat {
  value: string;
  label: string;
  iconUrl?: string;
}

/** Cycled by step index as a fallback when a `contentDetail` entry has no `icon` image set. */
const STEP_FALLBACK_ICONS: LucideIcon[] = [
  PhoneCall,
  Lightbulb,
  FileText,
  Rocket,
];

/** Cycled by card index as a fallback when a `statistic` entry has no `icon` image set — same roster `ContactStats` uses. */
const STAT_FALLBACK_ICONS: LucideIcon[] = [Briefcase, Globe, Star, Clock];

/** Placeholder steps, used only when `elements` has no `contentDetail` entries yet — this mockup's own 4-step timeline. */
const DEFAULT_STEPS: ProcessStep[] = [];

/** Placeholder stats, used only when `elements` has no `statistic` entries yet — this mockup's own 4-up stat row. */
const DEFAULT_STATS: TrustStat[] = [];

const PROJECT_TYPES = [
  "AI Product",
  "Web Development",
  "Mobile App",
  "Enterprise Automation",
  "UX Redesign",
  "Other",
];

const BUDGET_RANGES = ["Under $10k", "$10k – $50k", "$50k – $100k", "$100k+"];

/** Maps a resolved `contentDetail` entry to the plain `ProcessStep` shape this component renders — same mapping `ContactProcess` uses for its own timeline. */
function contentDetailToProcessStep(
  entry: PlainEntry<ContentDetailSkeleton>
): ProcessStep {
  const iconEntry = entry.fields.icon;

  return {
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription ?? "",
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/** Maps a resolved `statistic` entry to the plain `TrustStat` shape this component renders — same content type `ContactStats`/`AboutStats` reuse. */
function statisticToTrustStat(entry: PlainEntry<StatisticSkeleton>): TrustStat {
  const iconEntry = entry.fields.icon;

  return {
    value: entry.fields.value,
    label: entry.fields.label,
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/**
 * The `/contact` page's project-intake form + "Our Proven Process"
 * timeline — a `composableElement` section (`subType: "contactForm"` —
 * see `ComposableElementRenderer`):
 *
 * - the first `dataText` entry among `elements` supplies the left
 *   panel's own heading (`heading`) and intro copy (`eyebrow`)
 * - a 2nd `dataText` entry supplies the right panel's heading (e.g.
 *   "Our Proven Process") and intro copy, same `heading`/`eyebrow` split
 * - every `contentDetail` entry among `elements` becomes one numbered
 *   step in the right panel's timeline (`title`/`shortDescription`/
 *   `icon`) — same mapping `ContactProcess` uses
 * - every `statistic` entry among `elements` becomes one card in the
 *   right panel's stat row (`value`/`label`/`icon`) — same content type
 *   `ContactStats`/`AboutStats` reuse
 * - the `dataLink` entry with `type: "primary"` supplies the submit
 *   button's label
 *
 * This replaces the section's earlier "Meet Oxy" AI-assistant preview
 * panel with the process timeline + trust stats that `ContactProcess`/
 * `ContactStats` also render as their own standalone sections — when
 * this section carries that content, leave those two off the page in
 * Contentful to avoid showing it twice.
 *
 * The form's actual fields (name/company/email/phone/project
 * type/budget/message) aren't Contentful-driven — they're a fixed intake
 * form, same as HomeTalkToUs's CTA + note stay fixed alongside its
 * Contentful-driven copy. No backend/CMS is wired up to receive
 * submissions yet, so submitting just shows a local confirmation
 * message instead of sending anywhere.
 *
 * Falls back to `DEFAULT_STEPS`/`DEFAULT_STATS` and this mockup's
 * original copy when the corresponding entries aren't set yet. Themed
 * via `resolveTheme(entry.fields.themeColor)`, defaulting to the
 * `darkyellow` preset (dark cards + gold accents, matching this
 * section's own reference mockup) rather than the site's usual light
 * default when no `themeColor` is set — an explicit `themeColor` still
 * overrides it, same as every other composableElement section.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling section uses) is an
 * *optional* full-bleed section photo — when set, it covers the whole
 * section with a dark tint over it (the current theme's own `sectionBg`
 * color at reduced opacity) instead of the decorative dotted
 * `ThemePattern` backdrop, same "photo wins, tint matches the theme"
 * treatment `ContactProcess`/`AboutStats` use. The two foreground cards
 * keep their own `cardBg`/border regardless, so the photo only ever
 * shows through the gap between them and the section's outer padding.
 *
 * Motion, matching the GSAP vocabulary `ContactProcess`/`ContactStats`
 * already use on this page (all skipped under
 * `prefers-reduced-motion`):
 * - both headings split into words and rise in as the section scrolls
 *   into view
 * - the two cards fade + rise in with a slight stagger
 * - each timeline step fades + rises in with a stagger as it scrolls
 *   into view, and its icon box scales up with a soft pulsing ring on
 *   hover — the same hover treatment `ContactProcess`'s own steps use
 * - the stat row fades + rises in with a stagger, same as `ContactStats`
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ContactForm({ entry }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const formCopy = dataTextEntries[0];
  const processCopy = dataTextEntries[1];

  const contentDetailSteps = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToProcessStep);

  const statisticStats = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map(statisticToTrustStat);

  const primaryLink = elements
    .filter(
      (element): element is PlainEntry<DataLinkSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "dataLink"
    )
    .find((link) => link.fields.type === "primary");

  const formHeading = formCopy?.fields.heading;
    const formIntro =
    formCopy?.fields.eyebrow;
  const processHeading = processCopy?.fields.heading ;
    const processIntro =
    processCopy?.fields.eyebrow;
  const steps = contentDetailSteps.length ? contentDetailSteps : DEFAULT_STEPS;
  const stats = statisticStats.length ? statisticStats : DEFAULT_STATS;
  const submitLabel = primaryLink?.fields.label;

  // Un-themed, this section defaults to the `darkyellow` preset (dark
  // cards + gold accents) rather than the site's usual light default —
  // an explicit `themeColor` still wins when an editor sets one.
  const theme =
    resolveTheme(entry?.fields.themeColor) ?? resolveTheme("darkyellow")!;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  // `placeholder:` is a fixed, un-themed gray rather than `theme.muted`:
  // that field is only ever a complete, literal Tailwind class (e.g.
  // "text-gray-400") for Tailwind's static scanner to pick up — prefixing
  // it with a `placeholder:` variant at runtime would build a class name
  // string ("placeholder:text-gray-400") that never appears literally in
  // source, so Tailwind would never generate it (same reasoning
  // `app/lib/theme.ts` documents for `patternColor`).
  const inputClasses = cx(
    "w-full rounded-xl border bg-transparent py-3 pl-11 pr-4 text-[14.5px] placeholder:text-gray-400 focus:outline-none",
    theme.cardBorder,
    theme.heading
  );

  const sectionRef = useRef<HTMLElement>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const processHeadingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     HEADING REVEAL — both headings split into words and rise in
     on scroll, same GSAP split-text treatment every sibling
     section's heading uses. Skipped under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    const targets = [formHeadingRef.current, processHeadingRef.current].filter(
      (el): el is HTMLHeadingElement => el !== null
    );

    if (!targets.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1 });
      return;
    }

    const splits: SplitText[] = [];

    const ctx = gsap.context(() => {
      targets.forEach((target) => {
        splits.push(
          SplitText.create(target, {
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
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top 75%",
                  once: true,
                },
              }),
          })
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      splits.forEach((split) => split.revert());
    };
  }, []);

  /* =========================================================
     CARD REVEAL — the form + process cards fade + rise in with a
     slight stagger as the section scrolls into view. Skipped
     under prefers-reduced-motion.
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
        y: 32,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
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
     STEP REVEAL — fade + rise with a stagger as the timeline
     scrolls into view, same treatment `ContactProcess` uses for
     its own steps. Skipped under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!stepsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(stepsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(stepsRef.current!.children, {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, stepsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     STAT REVEAL — fade + rise with a stagger as the stat row
     scrolls into view, same treatment `ContactStats` uses.
     Skipped under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!statsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(statsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(statsRef.current!.children, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 92%",
          once: true,
        },
      });
    }, statsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     STEP HOVER — the icon box scales up slightly while a soft
     ring pulses outward from it once per hover, same treatment
     `ContactProcess`'s own steps use. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  const handleStepEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const step = event.currentTarget;
    const icon = step.querySelector<HTMLElement>("[data-step-icon]");
    const ring = step.querySelector<HTMLElement>("[data-step-ring]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1.1, duration: 0.4, ease: "back.out(2.5)" });
    }

    if (ring) {
      gsap.killTweensOf(ring);
      gsap.fromTo(
        ring,
        { scale: 0.8, opacity: 0.6 },
        { scale: 1.6, opacity: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  };

  const handleStepLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const step = event.currentTarget;
    const icon = step.querySelector<HTMLElement>("[data-step-icon]");
    const ring = step.querySelector<HTMLElement>("[data-step-ring]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1, duration: 0.3, ease: "power2.out" });
    }

    if (ring) {
      gsap.killTweensOf(ring);
      gsap.to(ring, { scale: 0.8, opacity: 0, duration: 0.2, ease: "power2.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact-form"
      className={cx(
        "relative overflow-hidden py-16 md:py-20",
        backgroundUrl ? "bg-cover bg-center" : theme.sectionBg
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        {backgroundUrl ? (
          <div className={cx("absolute inset-0 opacity-80", theme.sectionBg)} />
        ) : (
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        )}
      </div>

      <div className="container relative mx-auto grid gap-6 px-5 md:px-10 lg:grid-cols-2 lg:items-stretch" ref={cardsRef}>
        <div
          className={cx(
            "rounded-2xl border p-7 shadow-sm md:p-9 z-1",
            theme.cardBorder,
            theme.cardBg
          )}
        >
          <div
            className={cx(
              "flex h-14 w-14 items-center justify-center rounded-xl border",
              theme.eyebrowBg,
              theme.cardBorder,
              theme.accentText
            )}
          >
            <FileSearch size={24} aria-hidden />
          </div>

          <DynamicHeading level={resolveHeadingLevel(formCopy?.fields.headingLevel, "h2")}
            ref={formHeadingRef}
            className={cx(
              "mt-5 text-[22px] font-extrabold md:text-[24px]",
              theme.heading
            )}
          >
            {formHeading}
          </DynamicHeading>
          <p className={cx("mt-2 text-[14.5px] leading-relaxed", theme.body)}>
            {formIntro}
          </p>

          {submitted ? (
            <div
              className={cx(
                "mt-6 flex flex-col items-start gap-2 rounded-xl p-6",
                theme.eyebrowBg,
                theme.heading
              )}
            >
              <p className="text-[15px] font-bold">Thanks — got it!</p>
              <p className="text-[14px] leading-relaxed">
                Someone from our team will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <User
                    size={17}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className={inputClasses}
                  />
                </div>
                <div className="relative">
                  <Building2
                    size={17}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Mail
                    size={17}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className={inputClasses}
                  />
                </div>
                <div className="relative">
                  <Phone
                    size={17}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Layers
                    size={17}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                  <select
                    defaultValue=""
                    className={cx(inputClasses, "appearance-none pr-10")}
                  >
                    <option value="" disabled>
                      Project Type
                    </option>
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 right-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                </div>
                <div className="relative">
                  <Wallet
                    size={17}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                  <select
                    defaultValue=""
                    className={cx(inputClasses, "appearance-none pr-10")}
                  >
                    <option value="" disabled>
                      Budget Range
                    </option>
                    {BUDGET_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute top-1/2 right-4 -translate-y-1/2",
                      theme.muted
                    )}
                  />
                </div>
              </div>

              <div className="relative">
                <FileText
                  size={17}
                  aria-hidden
                  className={cx("pointer-events-none absolute top-4 left-4", theme.muted)}
                />
                <textarea
                  rows={4}
                  placeholder="Tell us about your project..."
                  className={cx(inputClasses, "resize-none")}
                />
              </div>

              <button
                type="submit"
                className={cx(
                  "mt-1 inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                  theme.buttonBg,
                  theme.buttonText,
                  theme.buttonHoverBg
                )}
              >
                {submitLabel}
                <ArrowUpRight size={16} aria-hidden />
              </button>

              <p className={cx("flex items-center gap-2 text-[12.5px]", theme.muted)}>
                <ShieldCheck size={15} aria-hidden />
                We respect your privacy. Your information is safe with us.
              </p>
            </form>
          )}
        </div>

        <div
          className={cx(
            "relative overflow-hidden rounded-2xl border p-7 md:p-9 z-1",
            theme.cardBorder,
            theme.cardBg
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
                theme.eyebrowBg,
                theme.cardBorder,
                theme.accentText
              )}
            >
              <Compass size={22} aria-hidden />
            </div>
            <div>
              <DynamicHeading level={resolveHeadingLevel(processCopy?.fields.headingLevel, "h3")}
                ref={processHeadingRef}
                className={cx("text-[19px] font-extrabold md:text-[20px]", theme.heading)}
              >
                {processHeading}
              </DynamicHeading>
              <p className={cx("mt-1 text-[14px] leading-relaxed", theme.body)}>
                {processIntro}
              </p>
            </div>
          </div>

          {steps.length > 0 && (
          <div ref={stepsRef} className="relative mt-8 space-y-8">
            {/* `border-l-2` + `theme.cardBorder` (used verbatim, not
                rewritten into a `bg-*` class) draws the connecting line —
                see the note on `inputClasses` above for why a theme class
                must stay a complete, literal string rather than being
                string-munged into a different utility at runtime. */}
            <div
              aria-hidden
              className={cx("absolute top-2 bottom-2 left-7 border-l-2", theme.cardBorder)}
            />

            {steps.map((step, index) => {
              const FallbackIcon =
                STEP_FALLBACK_ICONS[index % STEP_FALLBACK_ICONS.length];
              const stepNumber = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={step.title}
                  onMouseEnter={handleStepEnter}
                  onMouseLeave={handleStepLeave}
                  className="relative flex items-start gap-4"
                >
                  <div
                    className={cx(
                      "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold",
                      theme.cardBg,
                      theme.cardBorder,
                      theme.accentText
                    )}
                  >
                    {stepNumber}
                  </div>
                  <div className="relative mt-1 inline-flex shrink-0">
                    <span
                      data-step-ring
                      aria-hidden
                      className={cx(
                        "pointer-events-none absolute inset-0 m-auto h-11 w-11 scale-0 rounded-xl border-2 opacity-0",
                        theme.cardBorder
                      )}
                    />
                    <div
                      data-step-icon
                      className={cx(
                        "relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border",
                        theme.eyebrowBg,
                        theme.cardBorder,
                        theme.accentText
                      )}
                    >
                      {step.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                        <img
                          src={step.iconUrl}
                          alt=""
                          aria-hidden
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <FallbackIcon size={18} aria-hidden />
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className={cx("text-[15px] font-bold", theme.heading)}>
                      {step.title}
                    </p>
                    <p className={cx("mt-1 text-[13.5px] leading-relaxed", theme.body)}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {stats.length > 0 && (
          <div
            ref={statsRef}
            className={cx("mt-8 grid grid-cols-2 gap-6 border-t pt-8 sm:grid-cols-4", theme.cardBorder)}
          >
            {stats.map((stat, index) => {
              const FallbackIcon =
                STAT_FALLBACK_ICONS[index % STAT_FALLBACK_ICONS.length];

              return (
                <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={cx(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      theme.eyebrowBg,
                      theme.accentText
                    )}
                  >
                    {stat.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={stat.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={17} aria-hidden />
                    )}
                  </div>
                  <p className={cx("text-[22px] font-extrabold", theme.heading)}>
                    {stat.value}
                  </p>
                  <p className={cx("text-[12.5px] leading-tight", theme.body)}>
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
