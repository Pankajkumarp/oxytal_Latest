"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution every other composableElement section uses. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/**
 * The `/service/<slug>` detail pages' proof band — a `composableElement`
 * section (`subType: "serviceProof"` — see `ComposableElementRenderer`),
 * ported from `Refrence/serviceDetail/service-0N-*.html`'s `.proof-band`:
 *
 * - the first `dataText` entry among `elements` supplies the small label
 *   (`eyebrow`, e.g. "Case study in preparation" or "Recent work") and
 *   the title next to it (`heading`, e.g. "Results from a recent
 *   engagement are being written up", or a real case study's name)
 * - an optional `dataLink` supplies a "View case study" link — when
 *   present, the right side renders as that link; when absent, it
 *   renders the reference mockup's plain "Coming soon" text instead
 *
 * Renders nothing for the label/title when no `dataText` entry (or its
 * fields) is set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * defaults to the `darkyellow` preset, same as `ServiceDetailHero`. The
 * composableElement's own `backgroundImage` field is an optional
 * full-bleed section photo, same "photo wins" treatment every sibling
 * composableElement section uses.
 *
 * This band has no heading of its own (just a label + title), so unlike
 * most sections there's no split-text reveal here — it just fades + rises
 * in as it scrolls into view, same lightweight treatment
 * `AISolutionsSpotlight`'s quote card uses.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ServiceDetailProof({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const link = elements.find(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );

  const label = copy?.fields.eyebrow;
  const title = copy?.fields.heading;

  const linkHref = link ? resolveLinkHref(link) : undefined;
  const linkLabel = link?.fields.label ?? "View case study";

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("darkyellow")!;

  const bandRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!bandRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(bandRef.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(bandRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bandRef.current,
          start: "top 90%",
          once: true,
        },
      });
    }, bandRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className={cx("relative overflow-hidden py-8", !backgroundUrl && theme.sectionBg)}
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {backgroundUrl && (
        <div className={cx("absolute inset-0 -z-10 opacity-85", theme.sectionBg)} />
      )}

      <div className="container mx-auto px-5 md:px-10">
        <div
          ref={bandRef}
          className={cx(
            "flex flex-wrap items-center justify-between gap-6 rounded-2xl border p-9",
            theme.cardBorder,
            theme.cardBg
          )}
        >
          <div className="flex items-center gap-4">
            {/* Fixed dim gray regardless of theme — a small decorative
                status dot, same "flourish stays fixed" convention every
                other section's own decorative accents use. */}
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#6E6E73]" />
            <div>
              {label && (
                <div className={cx("text-xs font-bold tracking-wide uppercase", theme.muted)}>
                  {label}
                </div>
              )}
              {title && (
                <div className={cx("mt-1 text-[17px] font-bold", theme.heading)}>{title}</div>
              )}
            </div>
          </div>

          {linkHref ? (
            <Link
              href={linkHref}
              className={cx(
                "inline-flex shrink-0 items-center gap-2 text-[14px] font-bold",
                theme.accentText
              )}
            >
              {linkLabel}
              <ArrowRight size={13} aria-hidden />
            </Link>
          ) : (
            <span className={cx("shrink-0 text-[14px] font-bold", theme.muted)}>Coming soon</span>
          )}
        </div>
      </div>
    </section>
  );
}
