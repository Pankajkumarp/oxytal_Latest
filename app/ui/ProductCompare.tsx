"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CheckCircle2, GraduationCap, Users, XCircle } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComparisonRowSkeleton,
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

type CellValue = { kind: "yes" | "no" | "text"; text?: string };

/** `comparisonRow.productAValue`/`productBValue` are free text: the literal `"yes"`/`"no"` render as a check/× icon, anything else renders as plain text. */
function resolveCellValue(value?: string): CellValue {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "yes") return { kind: "yes" };
  if (normalized === "no") return { kind: "no" };
  return { kind: "text", text: value };
}

interface CompareRow {
  id: string;
  feature: string;
  a: CellValue;
  b: CellValue;
}

function comparisonRowToRow(entry: PlainEntry<ComparisonRowSkeleton>): CompareRow {
  return {
    id: entry.sys.id,
    feature: entry.fields.feature ?? "",
    a: resolveCellValue(entry.fields.productAValue),
    b: resolveCellValue(entry.fields.productBValue),
  };
}

/** Placeholder rows, used only when `elements` has no `comparisonRow` entries yet. */
const DEFAULT_ROWS: CompareRow[] = [];

function Cell({ value }: { value: CellValue }) {
  if (value.kind === "yes") {
    return <CheckCircle2 size={18} className="text-[#1450d4]" aria-hidden />;
  }
  if (value.kind === "no") {
    return <XCircle size={18} className="text-[#c0cce0]" aria-hidden />;
  }
  return <span>{value.text}</span>;
}

/**
 * The `/products` page's "Oxyem vs Skolrup — Find Your Fit" comparison
 * table — a `composableElement` section (`subType: "productCompare"` —
 * see `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-products.html`'s `.compare-section`:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - a 2nd/3rd `dataText` entry (if present) supplies the two column
 *   headers via their own `eyebrow` field (e.g. "Oxyem"/"Skolrup") — same
 *   "reuse a secondary dataText" pattern several sibling sections use
 * - every `comparisonRow` entry among `elements` becomes one table row
 *   (via `comparisonRowToRow`) — `feature` as the row label,
 *   `productAValue`/`productBValue` each rendering as a check/× icon
 *   when set to the literal `"yes"`/`"no"`, or as plain text otherwise
 *   (the reference mixes both: most rows are yes/no, a couple like
 *   "Target Audience" show descriptive text in both columns instead)
 *
 * Renders nothing for the eyebrow, heading, column headers, or the
 * table itself when the corresponding entries/fields aren't set in
 * Contentful yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the reference's
 * own plain white background. The composableElement's own `backgroundImage`
 * field is an optional full-bleed photo, same convention as every sibling
 * section.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The table rows fade + rise into place with a
 * stagger as the table scrolls into view. Both are skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductCompare({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const columnAEntry = dataTextEntries[1];
  const columnBEntry = dataTextEntries[2];

  const rows = elements
    .filter(
      (element): element is PlainEntry<ComparisonRowSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "comparisonRow"
    )
    .map(comparisonRowToRow);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const columnALabel = columnAEntry?.fields.eyebrow;
  const columnBLabel = columnBEntry?.fields.eyebrow;

  const tableRows = rows.length ? rows : DEFAULT_ROWS;

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
  const rowsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling section).
     Skipped entirely under prefers-reduced-motion.
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
     ROW REVEAL — fade + rise with a stagger as the table scrolls into
     view. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!rowsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(rowsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(rowsRef.current!.children, {
        y: 18,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: rowsRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, rowsRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="compare"
      aria-labelledby="compare-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-white")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative z-2 mx-auto px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            {eyebrow && (
              <span
                className={cx(
                  "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                  theme?.eyebrowBg ?? "bg-blue-50",
                  theme?.eyebrowText ?? "text-blue-700"
                )}
              >
                {eyebrow}
              </span>
            )}
            {heading && (
              <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
                ref={headingRef}
                id="compare-heading"
                className={cx(
                  "mt-4 text-[26px] leading-[1.15] font-extrabold tracking-tight sm:text-[32px] md:text-[38px]",
                  theme?.heading ?? "text-gray-900"
                )}
              >
                {heading}
              </DynamicHeading>
            )}
          </div>
          <div
            className={cx(
              "rich-text text-[15px] leading-relaxed lg:col-span-5 lg:col-start-8",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>
        </div>

        {tableRows.length > 0 && (
          <div
            className={cx(
              "mt-12 overflow-hidden rounded-2xl border",
              theme?.cardBorder ?? "border-[#dce8ff]"
            )}
          >
            <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-[#050e2d]">
              <div className="p-4 text-[13px] font-bold tracking-wide text-[#7b93c8] uppercase sm:p-5">
                Capability / Feature
              </div>
              <div className="flex items-center gap-2 border-l border-white/10 p-4 text-[13px] font-bold tracking-wide text-[#5ba4fc] uppercase sm:p-5">
                <Users size={14} aria-hidden />
                {columnALabel}
              </div>
              <div className="flex items-center gap-2 border-l border-white/10 p-4 text-[13px] font-bold tracking-wide text-[#6ee8a8] uppercase sm:p-5">
                <GraduationCap size={14} aria-hidden />
                {columnBLabel}
              </div>
            </div>

            <div ref={rowsRef} className={cx(theme?.cardBg ?? "bg-white")}>
              {tableRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr] border-t border-[#f0f5ff] transition-colors duration-150 hover:bg-[#e8f1ff]/60"
                >
                  <div
                    className={cx(
                      "p-4 text-[13.5px] font-semibold sm:p-5",
                      theme?.heading ?? "text-gray-900"
                    )}
                  >
                    {row.feature}
                  </div>
                  <div
                    className={cx(
                      "flex items-center gap-2 border-l p-4 text-[13.5px] sm:p-5",
                      theme?.cardBorder ?? "border-[#f0f5ff]",
                      theme?.body ?? "text-[#3a5ba0]"
                    )}
                  >
                    <Cell value={row.a} />
                  </div>
                  <div
                    className={cx(
                      "flex items-center gap-2 border-l p-4 text-[13.5px] sm:p-5",
                      theme?.cardBorder ?? "border-[#f0f5ff]",
                      theme?.body ?? "text-[#3a5ba0]"
                    )}
                  >
                    <Cell value={row.b} />
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
