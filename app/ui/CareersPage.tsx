"use client";

import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import { ArrowRight } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  CallToActionSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/CaseStudiesListing use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

interface StatItem {
  label: string;
  value: string;
}

function statisticToStatItem(entry: PlainEntry<StatisticSkeleton>): StatItem {
  return { value: entry.fields.value ?? "", label: entry.fields.label ?? "" };
}

interface ValueItem {
  id: string;
  title: string;
  description?: string;
}

interface RoleItem {
  id: string;
  title: string;
  department?: string;
  /** The role's own free-text location/type line (e.g. "Remote (US/UK) · Full-time") — reuses `contentDetail.industry`, the field the type comments already reserve for a free-text subtitle when `category` is a locked enum. */
  meta?: string;
  /** Where clicking this role card goes — reuses `contentDetail.slug` as a raw URL (e.g. the role's own listing on a job board) rather than the slugified anchor id it names elsewhere in this codebase (`ProductShowcase`, `ServicesPage`, …); an editor pastes the full apply URL straight into that one field, no separate `dataLink` entry needed. Falls back to `"#"` when unset, so a role added without a link yet doesn't throw, just goes nowhere. */
  applyHref: string;
}

/** Maps a resolved `contentDetail` entry to a `ValueItem` — `title`/`shortDescription` only, same "reuse contentDetail" pattern `HomeTalkToUs`'s feature cards use. */
function contentDetailToValueItem(entry: PlainEntry<ContentDetailSkeleton>): ValueItem {
  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    description: entry.fields.shortDescription,
  };
}

/** Maps a resolved `contentDetail` entry to a `RoleItem` — `category` (the department) and `industry` (the free-text location/type line) instead, plus `slug` as the role's own raw apply URL (see `RoleItem.applyHref`'s own doc comment for why). */
function contentDetailToRoleItem(entry: PlainEntry<ContentDetailSkeleton>): RoleItem {
  return {
    id: entry.sys.id,
    title: entry.fields.title ?? "",
    department: entry.fields.category,
    meta: entry.fields.industry,
    applyHref: entry.fields.slug || "#",
  };
}

/** Short filter-pill label for a role's department — the reference mockup's own handwritten tags ("Brand"/"Platform"/"AI"/"Strategy") are terser than the full `contentDetail.category` enum values ("Brand Experience"/"Enterprise Platform"/"AI & Automation"/"Strategy") shown on each card. Falls back to the full value for anything not in this fixed set, so a future 5th category still filters correctly, just with a longer pill. */
const DEPARTMENT_SHORT_LABEL: Record<string, string> = {
  "Brand Experience": "Brand",
  "Enterprise Platform": "Platform",
  "AI & Automation": "AI",
  Strategy: "Strategy",
};

/** Slight per-card rotation, cycled by index — the reference mockup's own "pinned to a corkboard" tilt on every note/card, alternating a few degrees left/right rather than sitting perfectly straight. */
const ROTATIONS = ["-1.1deg", "0.9deg", "-0.4deg", "1.2deg"];

/** A small red "pin" dot centered at the top of a card — the reference mockup's signature identity element. Left unthemed regardless of `themeColor` (same call `ThemePattern`'s decorative blobs make elsewhere): it's a fixed visual signature of this page's own corkboard concept, not a "chrome" color meant to shift with the brand palette. */
function PinDot() {
  return (
    <span
      aria-hidden
      className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#C43D3D] shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
    >
      <span className="absolute top-[5px] left-[5px] h-[5px] w-[5px] rounded-full bg-white/50" />
    </span>
  );
}

/**
 * One "pinned note" card — the shared visual unit every section on this
 * page is built from (hero note, stat notes, value notes, role cards, the
 * closing CTA note). `forwardRef` so a caller can attach
 * its own GSAP animation directly to the card's own element — the hero
 * note's entrance animation does this (see `CareersPage`); nothing else
 * needs a ref today, so `ref` is simply `undefined` everywhere else.
 */
const PinCard = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    rotation?: string;
    theme?: SectionTheme;
    children: ReactNode;
  }
>(function PinCard({ className, rotation, theme, children }, ref) {
  return (
    <div
      ref={ref}
      className={cx(
        "relative z-2 border rounded-[2px] p-6 shadow-[0_6px_16px_rgba(43,36,26,0.25),0_1px_0_rgba(255,255,255,0.4)_inset]",
        theme?.cardBg ?? "bg-[#FBF8F2]",
        theme?.cardBorder,
        className
      )}
      style={rotation ? { transform: `rotate(${rotation})` } : undefined}
    >
      <PinDot />
      {children}
    </div>
  );
});

/** Resting tilt for each role card, in plain degrees (GSAP's `rotate` wants a number, not a "-1.1deg" string like `ROTATIONS`/`PinCard` use) — same 4 values as `ROTATIONS`, cycled the same way by index. */
const ROLE_CARD_ROTATIONS = [-1.1, 0.9, -0.4, 1.2];

/**
 * One role card — the board's clickable unit, linking straight out to
 * that role's own `applyHref` (the first `dataLink` in its
 * `contentDetail.cta`) rather than opening an in-page apply form. Its
 * hover state (un-tilt to flat + scale up slightly, then settle back to
 * its resting tilt on leave) is GSAP-driven rather than a CSS
 * `transition`, same `gsap.to` on `mouseenter`/`mouseleave` (with GSAP
 * 3's default `overwrite: "auto"`, so a quick in/out doesn't stack
 * tweens) `CaseStudiesListing`'s own card hover uses. The resting tilt
 * itself is set once via `gsap.set` rather than baked into a CSS
 * `transform`, so the same numeric value drives both the static rest
 * state and the animated hover — matching the reference mockup's own
 * `.role-card:hover{transform:scale(1.03) rotate(0deg);}`. Skipped
 * entirely under `prefers-reduced-motion`: the card still shows its
 * resting tilt (that's a static style choice, not motion), it just
 * doesn't animate on hover.
 */
function RoleCard({
  role,
  index,
  theme,
}: {
  role: RoleItem;
  index: number;
  theme?: SectionTheme;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const restRotation = ROLE_CARD_ROTATIONS[index % ROLE_CARD_ROTATIONS.length];

  useLayoutEffect(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { rotate: restRotation });
    }
  }, [restRotation]);

  const handleEnter = () => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.to(cardRef.current, { rotate: 0, scale: 1.03, duration: 0.3, ease: "power2.out" });
  };

  const handleLeave = () => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.to(cardRef.current, { rotate: restRotation, scale: 1, duration: 0.35, ease: "power2.out" });
  };

  return (
    <Link
      ref={cardRef}
      href={role.applyHref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="block text-left"
    >
      <PinCard theme={theme} className="px-5 py-5">
        {role.department && (
          <div className={cx("mb-2.5 text-[15px] font-bold", theme?.accentText ?? "text-[#C43D3D]")}>
            {role.department}
          </div>
        )}
        <div className={cx("mb-1.5 text-[17px] font-bold", theme?.heading ?? "text-[#2B241A]")}>
          {role.title}
        </div>
        {role.meta && (
          <div className={cx("text-[13px] font-medium", theme?.muted ?? "text-[#6B5E4A]")}>
            {role.meta}
          </div>
        )}
      </PinCard>
    </Link>
  );
}

/**
 * The `/careers` page — a single `composableElement` section (`subType:
 * "careersPage"` — see `ComposableElementRenderer`), ported from
 * `Refrence/careers.html`'s corkboard/pinned-note aesthetic (cork
 * texture, tilted index-card "notes" with a red pin dot, a role board
 * with department filters):
 *
 * - the first `dataText` entry supplies the hero note's eyebrow/heading/
 *   lead paragraph
 * - `dataLink` entries: the one with `type: "primary"` becomes "View open
 *   roles" (defaults to `#roles`), any other becomes "See the work first"
 *   (defaults to `/case-studies`)
 * - every `statistic` entry becomes one stat note (`value`/`label`)
 * - every `contentDetail` entry *without* a `category` becomes one value
 *   note (`title`/`shortDescription`); every one *with* a `category`
 *   becomes one role card instead (`title`/`category` as its department/
 *   filter tag/`industry` as its free-text location+type line, `slug` as
 *   its own raw apply URL — clicking the card goes straight there, no
 *   in-page form) — the two collections share one content type and are
 *   told apart by whether `category` is set, the same "position/field
 *   tells them apart" move `AboutHero`'s multiple `dataText` entries make
 * - one `callToAction` entry supplies the closing CTA note
 * - the composableElement's own `backgroundImage` (optional, same field
 *   every other section uses) replaces the default cork texture with a
 *   full-bleed photo + scrim; `themeColor` independently recolors the
 *   cards/text/buttons (same convention as every other composableElement
 *   section) — the red pin dot itself stays fixed either way, a signature
 *   visual rather than a themed color
 *
 * Renders nothing for any piece whose Contentful field/entry is unset —
 * no hardcoded placeholder copy or roster (no default roles/values — an
 * empty board until an editor adds `contentDetail` entries).
 *
 * The heading gets the same GSAP split-text word reveal every hero on
 * this site uses. The value/role cards fade + rise with a stagger as they
 * scroll into view, and each role card also gets its own GSAP hover (see
 * `RoleCard`) — un-tilting flat and scaling up slightly, settling back to
 * its resting tilt on leave. All three are skipped under
 * `prefers-reduced-motion`. The department filter is a plain client-side
 * array filter.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function CareersPage({ entry }: Props) {
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
  const secondaryLink = linkEntries.find((link) => link !== primaryLink);

  const statEntries = elements.filter(
    (element): element is PlainEntry<StatisticSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "statistic"
  );
  const stats = statEntries.map(statisticToStatItem);

  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const values = contentDetailEntries
    .filter((detail) => !detail.fields.category)
    .map(contentDetailToValueItem);
  const roles = contentDetailEntries
    .filter((detail) => detail.fields.category)
    .map(contentDetailToRoleItem);

  const ctaEntry = elements.find(
    (element): element is PlainEntry<CallToActionSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "callToAction"
  );

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const primaryHref = primaryLink ? resolveLinkHref(primaryLink) : undefined;
  const primaryLabel = primaryLink?.fields.label;
  const secondaryHref = secondaryLink ? resolveLinkHref(secondaryLink) : undefined;
  const secondaryLabel = secondaryLink?.fields.label;

  const theme = resolveTheme(entry?.fields.themeColor);

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Every distinct department across the role cards, in first-appearance
  // order — drives the filter pills above the board.
  const departments = Array.from(
    new Set(roles.map((role) => role.department).filter((value): value is string => Boolean(value)))
  );

  const [activeFilter, setActiveFilter] = useState("all");
  const visibleRoles =
    activeFilter === "all" ? roles : roles.filter((role) => role.department === activeFilter);

  const sectionRef = useRef<HTMLElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const statsRowRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     HERO CARD REVEAL — the top pinned note drops into place on load: a
     fade + rise + gentle zoom-out (starting slightly smaller and higher,
     settling to its resting size/position), with a touch of overshoot
     (`back.out`) for a little "note landing on the board" bounce, since
     nothing here needs to look mechanically precise. No scroll trigger —
     it's already in view. Only `y`/`opacity`/`scale` are animated, not
     `rotate` — the card's own resting tilt is a static inline style (see
     `PinCard`'s `rotation` prop), and GSAP reads that as the tilt to hold
     steady throughout since this tween never touches it. Skipped
     entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!heroCardRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(heroCardRef.current, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(heroCardRef.current, {
        y: -36,
        scale: 0.92,
        opacity: 0,
        duration: 0.9,
        ease: "back.out(1.4)",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     STAT NOTES REVEAL — the small stat cards just under the hero note
     cascade in right after it (a short `delay` lets the hero card land
     first), each fading + rising + zooming out from slightly smaller,
     staggered one after another. No scroll trigger — same "already in
     view" reasoning as the hero card above, since this row sits right
     beneath it near the top of the page. Skipped entirely under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!statsRowRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(statsRowRef.current.children, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(statsRowRef.current!.children, {
        y: 24,
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        delay: 0.35,
        ease: "power3.out",
        stagger: 0.1,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     REVEAL ANIMATION — the hero heading only, splitting into words on
     load (same GSAP split-text treatment as every other hero on this
     site — no scroll trigger since it's already in view). Skipped
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
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     CARD REVEAL — the value notes and role cards each fade + rise with
     a stagger as their own row scrolls into view. Skipped entirely
     under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      if (valuesRef.current) gsap.set(valuesRef.current.children, { opacity: 1, y: 0 });
      if (rolesRef.current) gsap.set(rolesRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      if (valuesRef.current) {
        gsap.from(valuesRef.current.children, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: valuesRef.current, start: "top 90%", once: true },
        });
      }
      if (rolesRef.current) {
        gsap.from(rolesRef.current.children, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: rolesRef.current, start: "top 90%", once: true },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [activeFilter]);

  const ctaTitle = ctaEntry?.fields.title;
  // `description` is a `RichText` field on `callToAction` (see
  // app/types/contentful.ts) — same `documentToReactComponents` treatment
  // every other `callToAction.description` consumer in this project uses.
  const ctaDescription = ctaEntry?.fields.description
    ? documentToReactComponents(ctaEntry.fields.description)
    : undefined;
  const ctaLink = ctaEntry?.fields.ctaButton?.find(isEntry) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;
  const ctaHref = ctaLink ? resolveLinkHref(ctaLink) : undefined;
  const ctaLabel = ctaLink?.fields.label;
  const hasCta = Boolean(ctaTitle || ctaDescription || (ctaLink && ctaHref));

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        backgroundUrl ? "bg-cover bg-center" : (!theme && "bg-[#DCC9A8]")
      )}
      style={
        backgroundUrl
          ? { backgroundImage: `url(${backgroundUrl})` }
          :  undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative z-2 mx-auto py-16 md:py-24 lg:py-28">
        {/* =================================================
            HERO NOTE
        ================================================= */}
        <PinCard ref={heroCardRef} rotation="-0.6deg" theme={theme} className="max-w-2xl px-8 py-10 pt-11 md:px-10">
          {eyebrow && (
            <span className={cx("mb-2 block text-[15px] font-bold", theme?.accentText ?? "text-[#C43D3D]")}>
              {eyebrow}
            </span>
          )}
          {heading && (
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h1")}
              ref={headingRef}
              className={cx(
                "text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[36px] md:text-[42px]",
                theme?.heading ?? "text-[#2B241A]"
              )}
            >
              {heading}
            </DynamicHeading>
          )}
          {description && (
            <div className={cx("rich-text mt-4 text-[15.5px] leading-relaxed", theme?.body ?? "text-[#6B5E4A]")}>
              {description}
            </div>
          )}
          {(primaryHref || secondaryHref) && (
            <div className="mt-7 flex flex-wrap items-center gap-5">
              {primaryLink && primaryHref && (
                <Link
                  href={primaryHref}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-md px-5.5 py-3 text-[14.5px] font-bold transition-colors",
                    theme?.buttonBg ?? "bg-[#2B241A]",
                    theme?.buttonText ?? "text-[#FBF8F2]",
                    theme?.buttonHoverBg ?? "hover:bg-[#C43D3D]"
                  )}
                >
                  {primaryLabel}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              )}
              {secondaryLink && secondaryHref && (
                <Link
                  href={secondaryHref}
                  className={cx(
                    "border-b-[1.5px] pb-0.5 text-[14px] font-semibold",
                    theme?.body ?? "border-[#6B5E4A] text-[#6B5E4A]"
                  )}
                >
                  {secondaryLabel}
                </Link>
              )}
            </div>
          )}
        </PinCard>

        {/* =================================================
            STAT NOTES
        ================================================= */}
        {stats.length > 0 && (
          <div ref={statsRowRef} className="mt-9 flex flex-wrap gap-6">
            {stats.map((stat, index) => (
              <PinCard key={stat.label} rotation={ROTATIONS[index % ROTATIONS.length]} theme={theme} className="w-[150px] px-5 py-5">
                <div className={cx("text-[26px] font-extrabold", theme?.heading ?? "text-[#2B241A]")}>
                  {stat.value}
                </div>
                <div className={cx("mt-1.5 text-[12px] leading-snug font-semibold", theme?.body ?? "text-[#6B5E4A]")}>
                  {stat.label}
                </div>
              </PinCard>
            ))}
          </div>
        )}

        {/* =================================================
            VALUES
        ================================================= */}
        {values.length > 0 && (
          <div className="mt-20" id="values">
            <span className={cx("mb-1 block text-[15px] font-bold", theme?.accentText ?? "text-[#C43D3D]")}>
              from the whiteboard —
            </span>
            <h2 className={cx("mb-9 text-[24px] font-extrabold sm:text-[28px]", theme?.heading ?? "text-[#2B241A]")}>
              What actually matters here
            </h2>
            <div ref={valuesRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <PinCard key={value.id} rotation={ROTATIONS[index % ROTATIONS.length]} theme={theme} className="px-5 py-5">
                  <h3 className={cx("mb-2 text-[15.5px] font-bold", theme?.heading ?? "text-[#2B241A]")}>
                    {value.title}
                  </h3>
                  {value.description && (
                    <p className={cx("text-[13.5px] leading-relaxed", theme?.body ?? "text-[#6B5E4A]")}>
                      {value.description}
                    </p>
                  )}
                </PinCard>
              ))}
            </div>
          </div>
        )}

        {/* =================================================
            ROLE BOARD
        ================================================= */}
        {roles.length > 0 && (
          <div className="mt-20" id="roles">
            <span className={cx("mb-1 block text-[15px] font-bold", theme?.accentText ?? "text-[#C43D3D]")}>
              the board —
            </span>
            <h2 className={cx("mb-8 text-[24px] font-extrabold sm:text-[28px]", theme?.heading ?? "text-[#2B241A]")}>
              Where we&apos;re hiring right now
            </h2>

            {departments.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cx(
                    "rounded-full border-2 px-4.5 py-1.5 text-[14.5px] font-bold transition-colors",
                    activeFilter === "all"
                      ? cx(theme?.buttonBg ?? "bg-[#C43D3D]", "border-transparent text-white")
                      : cx(theme?.cardBg ?? "bg-[#FBF8F2]", theme?.heading ?? "border-[#2B241A] text-[#2B241A]")
                  )}
                >
                  All
                </button>
                {departments.map((department) => (
                  <button
                    key={department}
                    type="button"
                    onClick={() => setActiveFilter(department)}
                    className={cx(
                      "rounded-full border-2 px-4.5 py-1.5 text-[14.5px] font-bold transition-colors",
                      activeFilter === department
                        ? cx(theme?.buttonBg ?? "bg-[#C43D3D]", "border-transparent text-white")
                        : cx(theme?.cardBg ?? "bg-[#FBF8F2]", theme?.heading ?? "border-[#2B241A] text-[#2B241A]")
                    )}
                  >
                    {DEPARTMENT_SHORT_LABEL[department] ?? department}
                  </button>
                ))}
              </div>
            )}

            <div ref={rolesRef} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {visibleRoles.map((role, index) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  index={index}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        {/* =================================================
            CLOSING CTA NOTE
        ================================================= */}
        {hasCta && (
          <PinCard
            rotation="-0.4deg"
            theme={theme}
            className="mt-20 mb-4 flex flex-col items-start justify-between gap-6 px-8 py-9 sm:flex-row sm:items-center"
          >
            <div>
              {ctaTitle && (
                <h2 className={cx("text-[20px] font-extrabold sm:text-[24px]", theme?.heading ?? "text-[#2B241A]")}>
                  {ctaTitle}
                </h2>
              )}
              {ctaDescription && (
                <div className={cx("rich-text mt-2 max-w-[360px] text-[13.5px]", theme?.body ?? "text-[#6B5E4A]")}>
                  {ctaDescription}
                </div>
              )}
            </div>
            {ctaLink && ctaHref && (
              <Link
                href={ctaHref}
                className={cx(
                  "inline-flex w-fit shrink-0 items-center gap-2 rounded-md px-6 py-3 text-[14.5px] font-bold whitespace-nowrap transition-colors",
                  theme?.buttonBg ?? "bg-[#2B241A]",
                  theme?.buttonText ?? "text-[#FBF8F2]",
                  theme?.buttonHoverBg ?? "hover:bg-[#C43D3D]"
                )}
              >
                {ctaLabel}
                <ArrowRight size={14} aria-hidden />
              </Link>
            )}
          </PinCard>
        )}
      </div>
    </section>
  );
}
