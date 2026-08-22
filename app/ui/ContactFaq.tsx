"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock,
  Headphones,
  MessageCircle,
  Sparkles,
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

interface FaqItem {
  question: string;
  answer: string;
  iconUrl?: string;
}

/** Cycled by card index as a fallback when a `contentDetail` entry has no `icon` image set — matches this mockup's own icon per question. */
const FAQ_FALLBACK_ICONS: LucideIcon[] = [
  Clock,
  Briefcase,
  Sparkles,
  Headphones,
  CalendarDays,
];

/** Maps a resolved `contentDetail` entry to the plain `FaqItem` shape this component renders — `title` as the question, `shortDescription` as the answer, `icon` same as every other contentDetail-driven roster. */
function contentDetailToFaqItem(
  entry: PlainEntry<ContentDetailSkeleton>
): FaqItem {
  const iconEntry = entry.fields.icon;

  return {
    question: entry.fields.title ?? "",
    answer: entry.fields.shortDescription ?? "",
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/**
 * The `/contact` page's "Common Questions" accordion — a
 * `composableElement` section (`subType: "contactFaq"` — see
 * `ComposableElementRenderer`):
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow
 *   badge (`eyebrow`, e.g. "FAQ"), heading (`heading`), and intro
 *   paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one question
 *   (`title` as the question, `shortDescription` as the answer, `icon`
 *   optional) — add/remove/reorder `contentDetail` entries in Contentful
 *   to change the roster, nothing here needs to change
 * - a 2nd `dataText` entry supplies the bottom "Still have a question?"
 *   CTA card's own heading (`heading`) and short body copy (`eyebrow`)
 * - the `dataLink` entry among `elements` supplies that CTA card's
 *   button label + href
 *
 * Renders nothing for the heading/intro, the question list, or the
 * bottom CTA copy when the corresponding entries/fields aren't set in
 * Contentful yet (each question still gets a cycled Lucide icon when
 * it has no `icon` image of its own). Themed via
 * `resolveTheme(entry.fields.themeColor)`,
 * defaulting to the `yellow` preset (soft cream background, gold accents,
 * matching this section's own reference mockup) rather than the site's
 * usual light default when no `themeColor` is set — an explicit
 * `themeColor` still overrides it, same as every other composableElement
 * section.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling section uses) is an
 * *optional* full-bleed section photo — when set, it covers the whole
 * section with a tint over it (the current theme's own `sectionBg` color
 * at reduced opacity) instead of the decorative dotted `ThemePattern`
 * backdrop, same "photo wins, tint matches the theme" treatment
 * `ContactProcess`/`ContactForm` use.
 *
 * Motion, matching the GSAP vocabulary the rest of this page uses (all
 * skipped under `prefers-reduced-motion`):
 * - the eyebrow badge fades in, the heading splits into words and rises
 *   in, and the intro paragraph fades + rises in as the section scrolls
 *   into view
 * - each question card fades + rises in with a stagger as the grid
 *   scrolls into view
 * - opening/closing a question smoothly animates its answer's height +
 *   opacity instead of an instant show/hide — the first question starts
 *   open, same as the reference mockup
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ContactFaq({ entry }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const headingCopy = dataTextEntries[0];
  const ctaCopy = dataTextEntries[1];

  const contentDetailFaqs = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToFaqItem);

  const ctaLink = elements.find(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );

  // "FAQ" is a generic structural badge label (like Footer's column
  // titles), not invented marketing copy, so it keeps its default.
  const eyebrow = headingCopy?.fields.eyebrow ?? "FAQ";
  const heading = headingCopy?.fields.heading;
  const intro: ReactNode = headingCopy?.fields.text
    ? documentToReactComponents(headingCopy.fields.text)
    : null;
  const faqs = contentDetailFaqs;
  const ctaHeading = ctaCopy?.fields.heading;
  const ctaBody = ctaCopy?.fields.eyebrow;
  // "Contact Us" is a generic CTA button label (like a nav item), not
  // invented marketing copy, so it keeps its default.
  const ctaLabel = ctaLink?.fields.label ?? "Contact Us";
  const ctaHref = ctaLink?.fields.externalUrl ?? "#contact-form";

  // Un-themed, this section defaults to the `yellow` preset (soft cream
  // background + gold accents) rather than the site's usual light
  // default — an explicit `themeColor` still wins when an editor sets one.
  const theme =
    resolveTheme(entry?.fields.themeColor) ?? resolveTheme("yellow")!;

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

  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isFirstAccordionRun = useRef(true);

  /* =========================================================
     HEADER REVEAL — the eyebrow badge + intro paragraph fade in
     while the heading splits into words and rises, all as the
     section scrolls into view. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    const fadeTargets = [eyebrowRef.current, introRef.current].filter(
      (el): el is HTMLElement => el !== null
    );

    if (prefersReducedMotion()) {
      if (fadeTargets.length) gsap.set(fadeTargets, { opacity: 1, y: 0 });
      if (headingRef.current) gsap.set(headingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      if (fadeTargets.length) {
        gsap.from(fadeTargets, {
          y: 16,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
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
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                once: true,
              },
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
     CARD REVEAL — fade + rise with a stagger as the question
     grid scrolls into view. Skipped under prefers-reduced-motion.
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
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
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
     ACCORDION — smoothly animates each answer's height + opacity
     open/closed instead of an instant show/hide (the answer stays
     mounted at all times so its height can be measured/animated).
     The very first run (mount) snaps straight to the initial
     `openIndex` state with no transition; every toggle after that
     animates. Skipped (snaps instantly) under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();

    answerRefs.current.forEach((el, index) => {
      if (!el) {
        return;
      }

      const isOpen = index === openIndex;

      if (reduced || isFirstAccordionRun.current) {
        gsap.set(el, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 });
        return;
      }

      gsap.to(el, {
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
        duration: 0.35,
        ease: "power2.inOut",
      });
    });

    isFirstAccordionRun.current = false;
  }, [openIndex, faqs.length]);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-20",
        backgroundUrl ? "bg-cover bg-center" : theme.sectionBg
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {backgroundUrl ? (
          <div className={cx("absolute inset-0 opacity-80", theme.sectionBg)} />
        ) : (
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
        )}
      </div>

      <div className="container relative mx-auto px-5 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span
            ref={eyebrowRef}
            className={cx(
              "inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide",
              theme.eyebrowBg,
              theme.eyebrowText,
              theme.cardBorder
            )}
          >
            <CircleHelp size={14} aria-hidden />
            {eyebrow}
          </span>

          {heading && (
            <DynamicHeading level={resolveHeadingLevel(headingCopy?.fields.headingLevel, "h2")}
              ref={headingRef}
              className={cx(
                "mt-4 text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
                theme.heading
              )}
            >
              {heading}
            </DynamicHeading>
          )}

          {intro && (
            <div
              ref={introRef}
              className={cx("rich-text mt-4 text-[15px] leading-relaxed", theme.body)}
            >
              {intro}
            </div>
          )}
        </div>

        {faqs.length > 0 && (
        <div
          ref={cardsRef}
          className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2"
        >
          {faqs.map((faq, index) => {
            const FallbackIcon =
              FAQ_FALLBACK_ICONS[index % FAQ_FALLBACK_ICONS.length];
            const isOpen = index === openIndex;

            return (
              <div
                key={faq.question}
                className={cx(
                  "self-start rounded-2xl border shadow-sm",
                  theme.cardBorder,
                  theme.cardBg
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span
                    className={cx(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      theme.eyebrowBg,
                      theme.accentText
                    )}
                  >
                    {faq.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                      <img
                        src={faq.iconUrl}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <FallbackIcon size={19} aria-hidden />
                    )}
                  </span>
                  <span className={cx("flex-1 text-[15px] font-bold", theme.heading)}>
                    {faq.question}
                  </span>
                  <span
                    className={cx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                      theme.cardBorder
                    )}
                  >
                    <ChevronDown
                      size={17}
                      aria-hidden
                      className={cx(
                        "shrink-0 transition-transform duration-300",
                        theme.muted,
                        isOpen && "rotate-180"
                      )}
                    />
                  </span>
                </button>

                <div
                  ref={(el) => {
                    answerRefs.current[index] = el;
                  }}
                  className="overflow-hidden px-5"
                >
                  <p
                    className={cx(
                      // pl-[60px] lines the answer up under the question
                      // text: the 44px (h-11) icon circle + the button's
                      // 16px (gap-4) gap before it.
                      "pb-4 pl-[60px] text-[13.5px] leading-relaxed",
                      theme.body
                    )}
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {(ctaHeading || ctaBody || ctaLabel) && (
          <div
            className={cx(
              "mx-auto mt-10 flex max-w-4xl flex-col items-center gap-4 rounded-2xl border p-6 sm:flex-row sm:justify-between",
              theme.eyebrowBg,
              theme.cardBorder
            )}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <span
                className={cx(
                  "hidden h-11 w-11 shrink-0 items-center justify-center rounded-full sm:flex",
                  theme.cardBg,
                  theme.accentText
                )}
              >
                <MessageCircle size={19} aria-hidden />
              </span>
              <div>
                {ctaHeading && (
                  <p className={cx("text-[15px] font-bold", theme.heading)}>
                    {ctaHeading}
                  </p>
                )}
                {ctaBody && (
                  <p className={cx("mt-0.5 text-[13.5px]", theme.body)}>{ctaBody}</p>
                )}
              </div>
            </div>

            {ctaLabel && (
              <a
                href={ctaHref}
                className={cx(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-6 py-2.5 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5",
                  theme.cardBg,
                  theme.cardBorder,
                  theme.heading
                )}
              >
                {ctaLabel}
                <ArrowUpRight size={15} aria-hidden />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
