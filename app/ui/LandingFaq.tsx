"use client";

import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { resolveTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
} from "../types/contentful";
import { getAssetUrl } from "../lib/contentfulAsset";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
}

/** No hardcoded roster — see this component's own doc comment. */
const DEFAULT_FAQS: FaqItem[] = [];

/** Maps a resolved `contentDetail` entry to one Q&A row — `title` as the question, `shortDescription` as the answer. */
function contentDetailToFaq(entry: PlainEntry<ContentDetailSkeleton>): FaqItem {
  return {
    question: entry.fields.title ?? "",
    answer: entry.fields.shortDescription ?? "",
  };
}

/**
 * The `/landing-page` "Common questions" accordion — a
 * `composableElement` section (`subType: "landingFaq"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-landing-page.html`'s `.faq-list`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow/
 *   heading
 * - every `contentDetail` entry among `elements` becomes one question
 *   (`title` as the question, `shortDescription` as the answer) — unlike
 *   `ContactFaq`, there's no icon per question or bottom "still have a
 *   question?" CTA card, matching the reference mockup's own plainer
 *   list
 *
 * Renders nothing when `elements` has no `contentDetail` entries — no
 * hardcoded placeholder roster (`DEFAULT_FAQS` is intentionally empty,
 * unlike `ContactFaq`'s own fallback list).
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`. The first question
 * starts open, same as the reference; opening/closing smoothly animates
 * height + opacity instead of an instant show/hide (skipped, snapping
 * instantly, under `prefers-reduced-motion`) — same mechanism
 * `ContactFaq` uses, kept consistent since an accordion's open/close
 * motion isn't really a "hover" a page should vary per section.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function LandingFaq({ entry }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailFaqs = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToFaq);
  const faqs = contentDetailFaqs.length ? contentDetailFaqs : DEFAULT_FAQS;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const discrption: ReactNode = copy?.fields.text
        ? documentToReactComponents(copy.fields.text)
        : null;

  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isFirstRun = useRef(true);

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();

    answerRefs.current.forEach((el, index) => {
      if (!el) return;

      const isOpen = index === openIndex;

      if (reduced || isFirstRun.current) {
        gsap.set(el, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 });
        return;
      }

      gsap.to(el, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0, duration: 0.35, ease: "power2.inOut" });
    });

    isFirstRun.current = false;
  }, [openIndex, faqs.length]);

  if (!eyebrow && !heading && !faqs.length) {
    return null;
  }

  return (
    <section className={cx("relative overflow-hidden py-16 md:py-20", backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white"))} style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                            <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
                          </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        {(eyebrow || heading || discrption) && (
          <div className="text-center max-w-3xl mx-auto">
            {eyebrow && (
              <span className={cx("inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", theme?.eyebrowBg ?? "bg-blue-50", theme?.eyebrowText ?? "text-blue-700")}>
                <HelpCircle size={13} aria-hidden />
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")} className={cx("mt-3.5 text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]", theme?.heading ?? "text-gray-900")}>
                {heading}
              </DynamicHeading>
            )}
            {discrption && (
            <div className={cx("rich-text mt-3 text-[15px] leading-relaxed", theme?.body ?? "text-gray-500")}>{discrption}</div>
          )}
          </div>
        )}

        {faqs.length > 0 && (
          <div className={cx("mx-auto mt-10 max-w-3xl divide-y", theme?.cardBorder ?? "divide-gray-100")}>
            {faqs.map((faq, index) => {
              const isOpen = index === openIndex;

              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className={cx("text-[17px] font-bold", theme?.heading ?? "text-gray-900")}>{faq.question}</span>
                    <ChevronDown size={19} aria-hidden className={cx("shrink-0 transition-transform duration-300", theme?.accentText ?? "text-blue-600", isOpen && "rotate-180")} />
                  </button>

                  <div ref={(el) => { answerRefs.current[index] = el; }} className="overflow-hidden">
                    <p className={cx("pb-5 max-w-2xl text-[14px] leading-relaxed", theme?.body ?? "text-gray-500")}>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
