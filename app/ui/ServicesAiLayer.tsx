"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
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
  ContentDetailSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
} from "../types/contentful";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<
  Skeleton,
  undefined
>;

interface AnyEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
}

function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

interface LayerItem {
  heading: string;
  description: string;
}

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ServicesAiLayer({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) &&
      element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailItems = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) &&
        element.sys.contentType.sys.id === "contentDetail"
    )
    .map(
      (detailEntry): LayerItem => ({
        heading: detailEntry.fields.title ?? "",
        description: detailEntry.fields.shortDescription ?? "",
      })
    );

  const items = contentDetailItems;

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;

  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  /*
   * Background image
   */
  const backgroundImageEntry = entry?.fields.backgroundImage;

  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (
          backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>
        ).fields.image
      )
    : undefined;

  /*
   * Theme
   */
  const theme = resolveTheme(entry?.fields.themeColor);

  /*
   * Refs
   */
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /*
   * =========================================================
   * HEADING REVEAL
   *
   * Split the heading first.
   * Then create the GSAP animation separately.
   *
   * This avoids creating ScrollTrigger from inside SplitText's
   * onSplit callback.
   * =========================================================
   */
useLayoutEffect(() => {
  const heading = headingRef.current;
  const section = sectionRef.current;

  if (!heading || !section) {
    return;
  }

  if (prefersReducedMotion()) {
    gsap.set(heading, {
      opacity: 1,
    });
    return;
  }

  const ctx = gsap.context(() => {
    const split = SplitText.create(heading, {
      type: "words",
      mask: "words",
    });

    // Set the initial state without creating ScrollTrigger
    gsap.set(split.words, {
      yPercent: 115,
      rotate: 3,
      opacity: 0,
    });

    // Create ScrollTrigger separately
    ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(split.words, {
          yPercent: 0,
          rotate: 0,
          opacity: 1,
          duration: 1,
          ease: "power4.out",
          stagger: 0.06,
          overwrite: true,
        });
      },
    });
  }, section);

  return () => {
    ctx.revert();
  };
}, []);

  /*
   * =========================================================
   * CARD REVEAL
   *
   * Cards fade and rise into view as the section enters
   * the viewport.
   * =========================================================
   */
  useLayoutEffect(() => {
    const cards = cardsRef.current;

    if (!cards) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cards.children, {
        opacity: 1,
        y: 0,
      });

      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cards.children, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.15,

        scrollTrigger: {
          trigger: cards,
          start: "top 85%",
          once: true,
        },
      });
    }, cards);

    return () => {
      ctx.revert();
    };
  }, []);

  /*
   * =========================================================
   * CARD HOVER
   * =========================================================
   */
  const handleCardEnter = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const bar = card.querySelector<HTMLElement>("[data-ai-bar]");

    gsap.to(card, {
      y: -6,
      duration: 0.3,
      ease: "power2.out",
    });

    if (bar) {
      gsap.to(bar, {
        scaleY: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  };

  const handleCardLeave = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const bar = card.querySelector<HTMLElement>("[data-ai-bar]");

    gsap.to(card, {
      y: 0,
      duration: 0.35,
      ease: "power2.out",
    });

    if (bar) {
      gsap.to(bar, {
        scaleY: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl &&
          (theme?.sectionBg ?? "bg-white")
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
      {/*
       * Decorative background
       */}
      <ThemePattern
        theme={theme}
        pattern={entry?.fields.pattern}
        patternColor={entry?.fields.patternColor}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {backgroundUrl ? (
          <div className="absolute inset-0 bg-white/90" />
        ) : (
          <>
            <div className="absolute inset-x-0 top-1/2 h-[70%] -translate-y-1/2 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,theme(colors.emerald.100),transparent)] opacity-70" />

            <div className="absolute top-1/4 -left-16 hidden h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl animate-float-slow sm:block" />

            <div className="absolute -right-10 bottom-1/4 hidden h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl animate-float-slower md:block" />
          </>
        )}
      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-24 lg:py-28">
        {/*
         * =================================================
         * INTRO
         * =================================================
         */}
        <div className="flex max-w-2xl flex-col items-start gap-5 text-left">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-emerald-50",
                theme?.eyebrowText ?? "text-emerald-700"
              )}
            >
              {eyebrow}
            </span>
          )}

          {heading && (
            <DynamicHeading
              level={resolveHeadingLevel(
                copy?.fields.headingLevel,
                "h2"
              )}
              ref={headingRef}
              className={cx(
                "text-[28px] leading-[1.1] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
                theme?.heading ?? "text-gray-900"
              )}
            >
              {heading}
            </DynamicHeading>
          )}

          {description && (
            <div
              className={cx(
                "rich-text max-w-xl text-[15.5px] leading-relaxed md:text-[17px]",
                theme?.body ?? "text-gray-500"
              )}
            >
              {description}
            </div>
          )}
        </div>

        {/*
         * =================================================
         * GRID
         * =================================================
         */}
        {items.length > 0 && (
          <div
            ref={cardsRef}
            className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3"
          >
            {items.map((item) => (
              <div
                key={item.heading}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className={cx(
                  "relative z-1 overflow-hidden rounded-2xl border p-7",
                  theme?.cardBorder ?? "border-gray-100",
                  theme?.cardBg ?? "bg-white"
                )}
              >
                <span
                  data-ai-bar
                  aria-hidden
                  className={cx(
                    "absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-current",
                    theme?.accentText ?? "text-emerald-500"
                  )}
                />

                <h3
                  className={cx(
                    "text-[16px] font-bold",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  {item.heading}
                </h3>

                <p
                  className={cx(
                    "mt-2 text-[14px] leading-relaxed",
                    theme?.body ?? "text-gray-500"
                  )}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}