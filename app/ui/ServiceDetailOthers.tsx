"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
  ServiceCardSkeleton,
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

/**
 * The fixed 2-digit position each of the 6 service disciplines gets in
 * this cross-link grid (e.g. "01") — cosmetic only, so it's a small
 * lookup by title rather than a Contentful field, same convention
 * `AISolutionsDifferentiators`' `LETTERS` lookup uses for its own
 * position badges. An entry whose title isn't in this list (a discipline
 * added later) just renders with no number rather than throwing.
 */
const SERVICE_NUMBERS: Record<string, string> = {
  "Digital Strategy & Consultancy": "01",
  "User Experience & Design": "02",
  "Software Development": "03",
  "Cloud & Migration": "04",
  "Enterprise System Integration": "05",
  "Application Support": "06",
};

/**
 * The `/service/<slug>` detail pages' "explore the rest" cross-link grid
 * — a `composableElement` section (`subType: "serviceOthers"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/serviceDetail/service-0N-*.html`'s `.other-grid`:
 *
 * - the first `dataText` entry among `elements` supplies the section tag
 *   (`eyebrow`, e.g. "// the other five") and heading (`heading`)
 * - every `serviceCard` entry among `elements` becomes one card
 *   (`title`/`slug`) — an editor links the *other* 5 services' own
 *   `serviceCard` entries here (excluding this page's own service),
 *   reusing `serviceCard` instead of a dedicated content type, same
 *   pattern `AISolutionsCapabilities` uses. Add/remove/reorder
 *   `serviceCard` entries in Contentful to change the roster
 *
 * Falls back to rendering nothing (just the heading) when no
 * `serviceCard` entries are linked yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * defaults to the `darkyellow` preset, same as `ServiceDetailHero`. The
 * composableElement's own `backgroundImage` field is an optional
 * full-bleed section photo, same "photo wins" treatment every sibling
 * composableElement section uses.
 *
 * Animation: the heading gets the same GSAP split-text scroll-reveal
 * every other section's own heading uses; the card grid fades + rises in
 * with a stagger as it scrolls into view.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ServiceDetailOthers({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const others = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map((card) => ({
      title: card.fields.title ?? "",
      href: card.fields.slug ? `/service/${card.fields.slug}` : "/services",
    }));

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const intro: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const theme = resolveTheme(entry?.fields.themeColor) ?? resolveTheme("darkyellow")!;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!gridRef.current || !others.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(gridRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(gridRef.current!.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 90%",
          once: true,
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, [others.length]);

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden py-16 md:py-20",
        !backgroundUrl && theme.sectionBg
      )}
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 md:px-10">
        <div className="max-w-xl">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme.eyebrowBg,
                theme.eyebrowText
              )}
            >
              {eyebrow}
            </span>
          )}

          {heading && (
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              className={cx(
                "mt-3.5 text-[26px] leading-[1.18] font-bold tracking-tight sm:text-[32px] md:text-[38px]",
                theme.heading
              )}
            >
              {heading}
            </DynamicHeading>
          )}

          {intro && <div className={cx("rich-text mt-4 text-[15px] leading-relaxed", theme.body)}>{intro}</div>}
        </div>

        {others.length > 0 && (
          <div
            ref={gridRef}
            className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {others.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className={cx(
                  "block rounded-2xl border p-6 hover:-translate-y-1",
                  theme.cardBorder,
                  theme.cardBg,
                  "hover:opacity-90"
                )}
              >
                <div className={cx("font-mono text-xs font-bold", theme.accentText)}>
                  {SERVICE_NUMBERS[service.title] ?? ""}
                </div>
                <div className={cx("mt-2.5 text-[15.5px] leading-tight font-bold", theme.heading)}>
                  {service.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
