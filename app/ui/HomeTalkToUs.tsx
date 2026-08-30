"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowRight, Check } from "lucide-react";
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
  OfficeSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeServices/HomeAI/HomeProducts/HomeAboutUs use. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface StepItem {
  id: string;
  title: string;
  description?: string;
}

/** Maps a resolved `contentDetail` entry (one with a `shortDescription` set) to one numbered "how it works" step — same pillar/sector split `HomeAboutUs` already uses on the same content type. */
function contentDetailToStep(
  entry: PlainEntry<ContentDetailSkeleton>
): StepItem {
  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription,
  };
}

interface AssuranceItem {
  id: string;
  label: string;
}

/** Maps a resolved `contentDetail` entry (one with *no* `shortDescription` set — title only) to one checkmarked assurance line (e.g. "We reply within one business day"). */
function contentDetailToAssurance(
  entry: PlainEntry<ContentDetailSkeleton>
): AssuranceItem {
  return { id: entry.sys.id, label: entry.fields.title ?? "" };
}

interface OfficeLite {
  id: string;
  city: string;
  country: string;
}

function officeToLite(entry: PlainEntry<OfficeSkeleton>): OfficeLite {
  return {
    id: entry.sys.id,
    city: entry.fields.city ?? "",
    country: entry.fields.country ?? "",
  };
}

/**
 * IANA time zone by office `country` (case-insensitive) — purely a
 * geographic lookup, not editorial copy, so it lives in code rather than
 * as a Contentful field (same reasoning `resolveHeadingLevel`/
 * `resolveAlign`-style helpers elsewhere in this project keep technical
 * normalization out of the CMS). Offices whose `country` isn't in this
 * table simply don't get a "local time" row below — extend this list as
 * new office locations are added.
 */
const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  "united kingdom": "Europe/London",
  uk: "Europe/London",
  england: "Europe/London",
  // Ireland shares the UK's civil clock (GMT/BST) year-round, so it's
  // deliberately mapped to the *same* zone string as the UK rather than
  // its own "Europe/Dublin" — that's what makes a London office and a
  // Dublin office collapse into one combined "London & Dublin" row in
  // `groupOfficesByTimeZone` below, matching the reference mockup.
  // Mapping it to "Europe/Dublin" instead would show the identical time
  // in two separate rows.
  ireland: "Europe/London",
  india: "Asia/Kolkata",
};

function resolveTimeZone(country: string): string | undefined {
  return TIMEZONE_BY_COUNTRY[country.trim().toLowerCase()];
}

interface ClockGroup {
  id: string;
  label: string;
  timeZone: string;
}

/** Groups `office` entries that share the same resolved time zone into one clock row (e.g. a London office + a Dublin office both resolve to "Europe/London" and collapse into one "London & Dublin" row) — same grouping the reference mockup's own hardcoded UK/India rows do, generalized to whatever offices are actually linked. */
function groupOfficesByTimeZone(offices: OfficeLite[]): ClockGroup[] {
  const order: string[] = [];
  const citiesByZone = new Map<string, string[]>();

  offices.forEach((office) => {
    const timeZone = resolveTimeZone(office.country);
    if (!timeZone || !office.city) {
      return;
    }
    if (!citiesByZone.has(timeZone)) {
      order.push(timeZone);
      citiesByZone.set(timeZone, []);
    }
    citiesByZone.get(timeZone)!.push(office.city);
  });

  return order.map((timeZone) => ({
    id: timeZone,
    timeZone,
    label: citiesByZone.get(timeZone)!.join(" & "),
  }));
}

/** Mon–Fri 09:00–18:00 local, matching the reference mockup's own working-hours window. */
function isWorkingHours(now: Date, timeZone: string): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false,
      weekday: "short",
    }).formatToParts(now);
    let hour = 0;
    let day = "";
    parts.forEach((part) => {
      if (part.type === "hour") hour = parseInt(part.value, 10);
      if (part.type === "weekday") day = part.value;
    });
    return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(day) && hour >= 9 && hour < 18;
  } catch {
    return false;
  }
}

/**
 * One "local time right now" row — ticks its own clock client-side every
 * 30s (same interval the reference mockup's own vanilla-JS clock uses),
 * independent of every other row. Renders "—" until the first tick so
 * server and client markup match (no `Intl` call during render).
 */
function LiveClock({ group, theme }: { group: ClockGroup; theme?: SectionTheme }) {
  const [time, setTime] = useState("—");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const paint = () => {
      const now = new Date();
      try {
        setTime(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: group.timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now)
        );
        setWorking(isWorkingHours(now, group.timeZone));
      } catch {
        setTime("—");
      }
    };

    paint();
    const interval = setInterval(paint, 30000);
    return () => clearInterval(interval);
  }, [group.timeZone]);

  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span
        className={cx(
          "flex items-center gap-2 text-[13.5px]",
          theme?.body ?? "text-[#9DB2C4]"
        )}
      >
        <span
          aria-hidden
          className={cx(
            "h-1.5 w-1.5 rounded-full",
            working ? "bg-emerald-400" : "bg-white/30"
          )}
        />
        {group.label}
      </span>
      <span className="font-mono text-[14px] tracking-wide text-white">
        {time}
      </span>
    </div>
  );
}

/**
 * "Talk to Us", rendered from a `composableElement` entry (`subType:
 * "talktous"` — see `ComposableElementRenderer`). Ported from
 * `Refrence/oxytal-cta-section.html` — a dark navy "action panel" card
 * (offer + numbered steps on the left, a "book a call" action card on
 * the right), rather than the section's previous full-bleed-photo
 * layout.
 *
 * Reads a mixed roster out of the composableElement's own `elements`:
 *
 * - the 1st `dataText` entry supplies the intro copy: `eyebrow`,
 *   `heading`, and `text` (rich text) for the lede
 * - a 2nd `dataText` entry drives the action card's own copy: `eyebrow`
 *   is the "Get started" kicker above the buttons, `heading` is the
 *   "Local time right now" kicker above the clocks, `text` (rich text)
 *   is the short coverage note under the clocks
 * - a 3rd `dataText` entry's `eyebrow` is the footnote's leading text
 *   ("Looking for a role instead?")
 * - every `contentDetail` entry becomes either a numbered step (via
 *   `contentDetailToStep`) or an assurance checkmark line (via
 *   `contentDetailToAssurance`) — split purely by whether the entry has
 *   a `shortDescription` set, same convention `HomeAboutUs` uses for its
 *   pillar/sector split on this same content type
 * - `dataLink` entries: the one with `type: "primary"` is the "Book a
 *   call" button; of the rest (in order), the 1st is the secondary
 *   "Email us" button and the 2nd is the footnote's "See open
 *   positions" link
 * - every `office` entry becomes both a "local time" clock row (grouped
 *   by time zone — see `groupOfficesByTimeZone`) and one name in the
 *   footnote's location list (e.g. "London · Dublin · Chandigarh") —
 *   the *same* `office` entries `Footer`/`AboutHero`/`AboutGlobal`/
 *   `HomeAboutUs` already reuse
 * - the composableElement's own `backgroundImage` (optional — links to
 *   a `dataImage` entry) sits behind the whole section, same mechanism
 *   every sibling section uses; the dark action panel itself renders on
 *   top of it either way
 *
 * Every block above only renders when its own roster is non-empty.
 *
 * Background image + theme: same `backgroundImage`/`themeColor`/
 * `pattern`/`patternColor` mechanism every sibling section uses —
 * `resolveTheme` recolors the panel/card/buttons/steps; the accent glow
 * behind the panel and the step-number badges reuse `theme.patternColor`
 * (already a raw hex on every preset) as their own accent color,
 * falling back to the reference mockup's own cyan (`#16B9E8`) when
 * unthemed.
 *
 * Animation: the heading gets the same GSAP split-text reveal every
 * sibling section's own heading uses; the steps list and the action
 * card each fade + rise in as their own block scrolls into view.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeTalkToUs({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  const dataTextEntries = elements.filter(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );
  const copy = dataTextEntries[0];
  const actionCopy = dataTextEntries[1];
  const footnoteCopy = dataTextEntries[2];

  const linkEntries = elements.filter(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );
  const primaryLink = linkEntries.find((link) => link.fields.type === "primary");
  const secondaryLinks = linkEntries.filter((link) => link.fields.type !== "primary");
  const emailLink = secondaryLinks[0];
  const footnoteLink = secondaryLinks[1];

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const steps = contentDetailEntries
    .filter((element) => element.fields.shortDescription)
    .map(contentDetailToStep);
  const assurances = contentDetailEntries
    .filter((element) => !element.fields.shortDescription)
    .map(contentDetailToAssurance);

  const offices = elements
    .filter(
      (element): element is PlainEntry<OfficeSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "office"
    )
    .map(officeToLite);
  const clockGroups = groupOfficesByTimeZone(offices);
  const locationsLine = offices.map((office) => office.city).filter(Boolean).join(" · ");

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;

  const actionKicker = actionCopy?.fields.eyebrow;
  const clocksKicker = actionCopy?.fields.heading;
  const coverNote: ReactNode = actionCopy?.fields.text
    ? documentToReactComponents(actionCopy.fields.text)
    : undefined;

  const footnoteLead = footnoteCopy?.fields.eyebrow;

  const ctaHref = (primaryLink && resolveLinkHref(primaryLink)) ?? "";
  const ctaLabel = primaryLink?.fields.label;
  const emailHref = emailLink ? resolveLinkHref(emailLink) : undefined;
  const emailLabel = emailLink?.fields.label;
  const footnoteHref = footnoteLink ? resolveLinkHref(footnoteLink) : undefined;
  const footnoteLabel = footnoteLink?.fields.label;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so the section just shows its plain/themed page background
  // until an editor sets one — the dark action panel itself doesn't
  // depend on it either way.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to this panel's text/button/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to this section's own default look — the reference
  // mockup's dark-navy-and-cyan action panel.
  const theme = resolveTheme(entry.fields.themeColor);
  const accentHex = theme?.patternColor ?? "#16B9E8";

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const actionCardRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading splits into words on scroll-in (same
     GSAP split-text treatment as HomeServices/HomeProducts/HomeAI/
     HomeAboutUs). Skipped entirely under prefers-reduced-motion.
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
     STEPS + ACTION CARD REVEAL — the numbered steps stagger in one
     after another, and the action card fades + rises in as its own
     block, both as they scroll into view. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    const blocks = [stepsRef.current, actionCardRef.current].filter(
      (block): block is HTMLOListElement | HTMLDivElement => block !== null
    );
    if (!blocks.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(blocks, { opacity: 1, y: 0 });
      if (stepsRef.current) {
        gsap.set(stepsRef.current.children, { opacity: 1, y: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      if (stepsRef.current && steps.length) {
        gsap.from(stepsRef.current.children, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: stepsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      if (actionCardRef.current) {
        gsap.from(actionCardRef.current, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          delay: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: actionCardRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [steps.length]);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden bg-white"
      )}
    >

      <div className="container relative mx-auto px-5 py-12 md:px-10 md:py-16 lg:py-20">
        {/* =================================================
            PANEL — the dark action card itself. Always this fixed
            navy-gradient look unless an editor sets `themeColor`.
        ================================================= */}
        <div
          className={cx(
            "relative overflow-hidden rounded-[26px] p-8 shadow-[0_30px_70px_-30px_rgba(6,18,35,0.55)] md:p-12 lg:p-16",
            theme?.sectionBg ?? "bg-gradient-to-br from-[#061223] to-[#0C2138]"
          )}
        >
                <ThemePattern
        theme={theme}
        pattern={entry?.fields.pattern}
        patternColor={entry?.fields.patternColor}
      />

          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            {/* =================================================
                LEFT — offer copy + numbered steps.
            ================================================= */}
            <div>
              {eyebrow && (
                <span
                  className={cx(
                    "mb-4 flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.16em] uppercase",
                    theme?.accentText ?? "text-[#16B9E8]"
                  )}
                >
                  <span
                    aria-hidden
                    className={cx("h-0.5 w-[22px] rounded-sm", theme?.buttonBg ?? "bg-[#16B9E8]")}
                  />
                  {eyebrow}
                </span>
              )}

              <DynamicHeading
                level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
                ref={headingRef}
                className={cx(
                  "max-w-[17ch] text-[30px] leading-[1.08] font-extrabold tracking-tight sm:text-[36px] md:text-[42px]",
                  theme?.heading ?? "text-white"
                )}
              >
                {heading}
              </DynamicHeading>

              {description && (
                <div
                  className={cx(
                    "rich-text mt-4 max-w-[50ch] text-[15.5px] leading-relaxed",
                    theme?.body ?? "text-[#9DB2C4]"
                  )}
                >
                  {description}
                </div>
              )}

              {steps.length > 0 && (
                <ol ref={stepsRef} className="mt-8 list-none">
                  {steps.map((step, index) => (
                    <li
                      key={step.id}
                      className={cx(
                        "grid grid-cols-[36px_1fr] items-start gap-4 py-4",
                        index > 0 && (theme?.cardBorder ?? "border-t border-white/[0.06]")
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px]",
                          theme?.accentText ?? "text-[#16B9E8]"
                        )}
                        style={{
                          borderWidth: 1,
                          borderStyle: "solid",
                          // The translucent circular wash itself is purely
                          // decorative (like `ThemePattern`'s own use of
                          // `patternColor`), so it's fine for it to lean on
                          // the raw accent hex even though the number text
                          // above uses `theme.accentText` instead.
                          borderColor: `color-mix(in srgb, ${accentHex} 42%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${accentHex} 12%, transparent)`,
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3
                          className={cx(
                            "mt-[3px] mb-1 text-[15.5px] font-semibold",
                            theme?.heading ?? "text-white"
                          )}
                        >
                          {step.title}
                        </h3>
                        {step.description && (
                          <p
                            className={cx(
                              "text-[14px] leading-relaxed",
                              theme?.body ?? "text-[#9DB2C4]"
                            )}
                          >
                            {step.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* =================================================
                RIGHT — action card: buttons, assurances, clocks.
            ================================================= */}
            <div
              ref={actionCardRef}
              className={cx(
                "flex flex-col rounded-[20px] border p-6 md:p-8",
                theme?.cardBorder ?? "border-white/10",
                theme?.cardBg ?? "bg-white/[0.045]"
              )}
            >
              {actionKicker && (
                <p
                  className={cx(
                    "mb-4 font-mono text-[12px] tracking-[0.15em] uppercase",
                    theme?.accentText ?? "text-[#16B9E8]"
                  )}
                >
                  {actionKicker}
                </p>
              )}

              {ctaLabel && (
                <Link
                  href={ctaHref || ""}
                  className={cx(
                    "group flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5",
                    theme?.buttonBg ?? "bg-[#16B9E8]",
                    theme?.buttonText ?? "text-[#04121D]",
                    theme?.buttonHoverBg ?? "hover:brightness-110"
                  )}
                >
                  {ctaLabel}
                  <ArrowRight
                    size={16}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              )}

              {emailLabel && (
                <a
                  href={emailHref || `mailto:${emailLabel}`}
                  className={cx(
                    "mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl border px-6 py-4 text-[15px] font-medium transition-transform duration-200 hover:-translate-y-0.5",
                    theme?.cardBorder ?? "border-white/10",
                    theme?.heading ?? "text-[#EAF2F8]"
                  )}
                >
                  {emailLabel}
                </a>
              )}

              {assurances.length > 0 && (
                <ul
                  className={cx(
                    "mt-6 list-none border-t pt-6",
                    theme?.cardBorder ?? "border-white/[0.06]"
                  )}
                >
                  {assurances.map((item) => (
                    <li
                      key={item.id}
                      className={cx(
                        "mb-3 flex items-start gap-2.5 text-[13.5px] leading-relaxed last:mb-0",
                        theme?.body ?? "text-[#9DB2C4]"
                      )}
                    >
                      <Check
                        size={15}
                        aria-hidden
                        className={cx(
                          "mt-0.5 flex-shrink-0",
                          theme?.accentText ?? "text-[#16B9E8]"
                        )}
                      />
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}

              {clockGroups.length > 0 && (
                <div
                  className={cx(
                    "mt-auto border-t pt-5",
                    clockGroups.length && (assurances.length ? "" : "mt-6"),
                    theme?.cardBorder ?? "border-white/[0.06]"
                  )}
                >
                  {clocksKicker && (
                    <p
                      className={cx(
                        "mb-3.5 font-mono text-[10px] tracking-[0.15em] uppercase",
                        theme?.muted ?? "text-[#7690A6]"
                      )}
                    >
                      {clocksKicker}
                    </p>
                  )}
                  {clockGroups.map((group) => (
                    <LiveClock key={group.id} group={group} theme={theme} />
                  ))}
                  {coverNote && (
                    <div
                      className={cx(
                        "rich-text mt-3.5 text-[12.5px] leading-relaxed",
                        theme?.muted ?? "text-[#7690A6]"
                      )}
                    >
                      {coverNote}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                FOOTNOTE — leading text + link, and the office roster.
            ================================================= */}
            {(footnoteLead || locationsLine) && (
              <div
                className={cx(
                  "flex flex-wrap items-center justify-between gap-3 border-t pt-6 lg:col-span-2",
                  theme?.cardBorder ?? "border-white/10"
                )}
              >
                {footnoteLead && (
                  <p className={cx("text-[13.5px]", theme?.body ?? "text-[#9DB2C4]")}>
                    {footnoteLead}{" "}
                    {footnoteLabel && footnoteHref && (
                      <Link
                        href={footnoteHref}
                        className={cx(
                          "border-b pb-0.5 transition-colors duration-200",
                          theme?.heading ?? "text-white",
                          theme?.cardBorder ?? "border-white/10"
                        )}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.borderColor = accentHex;
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.borderColor = "";
                        }}
                      >
                        {footnoteLabel}
                      </Link>
                    )}
                  </p>
                )}
                {locationsLine && (
                  <p
                    className={cx(
                      "font-mono text-[10.5px] tracking-[0.12em] uppercase",
                      theme?.heading ?? "text-white"
                    )}
                  >
                    {locationsLine}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
