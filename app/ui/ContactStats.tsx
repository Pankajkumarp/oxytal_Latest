"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import { Briefcase, Flag, Globe, Star, type LucideIcon } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
  StatisticSkeleton,
} from "../types/contentful";

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

interface TrustStat {
  value: string;
  label: string;
  iconUrl?: string;
}

/** Cycled by card index as a fallback when a `statistic` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [Briefcase, Globe, Flag, Star];

/** Maps a resolved `statistic` entry to the plain `TrustStat` shape this component renders — same content type `AboutHero`/`AboutStats` reuse. */
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
 * The `/contact` page's "Trusted by Startups & Enterprises" stat row —
 * a `composableElement` section (`subType: "contactStats"` — see
 * `ComposableElementRenderer`):
 *
 * - a `dataText` entry among `elements` supplies the heading via its own
 *   `heading` field
 * - every `statistic` entry among `elements` becomes one card
 *   (`value`/`label`/`icon`) — same content type `AboutStats` reuses,
 *   add/remove/reorder `statistic` entries in Contentful to change the
 *   roster, nothing here needs to change
 *
 * Renders nothing for the heading or the stats row when the
 * corresponding entries/fields aren't set in Contentful yet (each
 * `statistic` card still gets a cycled Lucide icon when it has no
 * `icon` image of its own).
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section. The cards fade + rise into place with a
 * stagger as the row scrolls into view, skipped under
 * `prefers-reduced-motion`.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ContactStats({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const statisticStats = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map(statisticToTrustStat);

  const heading = copy?.fields.heading;
  const stats = statisticStats;

  const theme = resolveTheme(entry?.fields.themeColor);

  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     CARD REVEAL — fade + rise with a stagger as the row scrolls
     into view. Skipped entirely under prefers-reduced-motion.
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
        stagger: 0.12,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 90%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={cx("pb-16 md:pb-20", theme?.sectionBg)}>
      <div className="container mx-auto px-5 md:px-10">
        {heading && (
          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            className={cx(
              "text-center text-[20px] font-extrabold md:text-[24px]",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>
        )}

        {stats.length > 0 && (
          <div
            ref={cardsRef}
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((stat, index) => {
              const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <div
                  key={stat.label}
                  className={cx(
                    "flex items-center gap-4 rounded-2xl border p-6 shadow-sm",
                    theme?.cardBorder ?? "border-gray-100",
                    theme?.cardBg ?? "bg-white"
                  )}
                >
                  <div
                    className={cx(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      theme?.eyebrowBg ?? "bg-emerald-50",
                      theme?.accentText ?? "text-emerald-600"
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
                      <FallbackIcon size={20} aria-hidden />
                    )}
                  </div>
                  <div>
                    <p
                      className={cx(
                        "text-[24px] font-extrabold",
                        theme?.heading ?? "text-gray-900"
                      )}
                    >
                      {stat.value}
                    </p>
                    <p
                      className={cx(
                        "text-[13px]",
                        theme?.body ?? "text-gray-500"
                      )}
                    >
                      {stat.label}
                    </p>
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
