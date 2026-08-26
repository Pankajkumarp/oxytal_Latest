/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../../lib/contentfulAsset";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
} from "../../types/contentful";
import { useFadeUp, useSplitReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> =
  Entry<Skeleton, undefined>;

interface AnyEntry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
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

interface HeroContent {
  SectionFor?: string;
  eyebrow?: string;
  title?: string;
  kicker?: string;
  lede?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  note?: string;
  bottomHeading?: string;
  clients?: string[];
}



interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function DigitalCommerceHero({ entry }: Props) {
  const overrides =
    (entry?.fields.content as HeroContent | undefined) ?? {};

  const content: HeroContent = {
    ...overrides,
  };

  const backgroundImageEntry = entry?.fields.backgroundImage;

  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (
        backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>
      ).fields.image
    )
    : undefined;

  const heroTitleRef = useSplitReveal<HTMLHeadingElement>();
  const heroCopyRef = useFadeUp<HTMLDivElement>();
  const logosRef = useFadeUp<HTMLDivElement>();

  return (
    <section
      className={cx(
        "relative isolate min-h-[700px] overflow-hidden",
        "py-16 sm:py-20 md:min-h-[720px] md:py-24",
        content.SectionFor
      )}
    >
      {/* Decorative background */}
      {backgroundUrl && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 lg:left-[38%] right-0 z-[-1] overflow-hidden">
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      )}
      {/* Hero content */}
      <div className="container relative mx-auto px-5 md:px-10">
        <div
          ref={heroCopyRef}
          className="relative z-10 max-w-[720px] pt-4 md:pt-6"
        >
          {/* Eyebrow — unset simply renders nothing, no placeholder copy. */}
          {content.eyebrow && (
            <p
              className={cx(
                "mb-5 flex items-center gap-3",
                "text-[12px]",
                "uppercase tracking-[0.22em] theme-main font-extrabold"
              )}
            >
              <span  className={cx("h-px w-6 arrow-bg")}/>
              {content.eyebrow}
            </p>
          )}

          {/* Heading */}
          {content.title && (
            <h1
              ref={heroTitleRef}
              className={cx(
                "max-w-[680px]",
                "text-[28px] font-extrabold leading-[1.1]",
                "tracking-[-0.045em]",
                "sm:text-[34px]",
                "md:text-[46px]",
                "lg:text-[50px]",
                "main-Heading",
              )}
            >
              {content.title}
            </h1>
          )}

          {/* Orange kicker */}
          {content.kicker && (
            <p
              className={cx(
                "mt-7 max-w-[620px]",
                "text-[19px] font-semibold leading-[1.35]",
                "sm:text-[21px]",
                "theme-main",
              )}
            >
              {content.kicker}
            </p>
          )}

          {/* Description */}
          {content.lede && (
            <p
              className={cx(
                "mt-5 max-w-[620px]",
                "text-[16px] leading-[1.9] body-text-theme",
              )}
            >
              {content.lede}
            </p>
          )}

          {/* CTA buttons — each button only renders when it has both a
              label and an href; the row itself only renders when at
              least one of them does. */}
          {(content.ctaLabel && content.ctaHref) ||
          (content.secondaryLabel && content.secondaryHref) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {content.ctaLabel && content.ctaHref && (
                <Link
                  href={content.ctaHref}
                  className={cx(
                    "primaryButton inline-flex min-h-[56px] items-center  justify-center gap-3 rounded-[12px] px-7 text-[15px] font-bold transition-all duration-200 hover:-translate-y-0.5",
                  )}
                >
                  {content.ctaLabel}
                  <span aria-hidden className="text-lg">
                    →
                  </span>
                </Link>
              )}
              {content.secondaryLabel && content.secondaryHref && (
                <Link
                  href={content.secondaryHref}
                  className={cx(
                    "secondaryButton inline-flex min-h-[56px] items-center  justify-center gap-3 rounded-[12px] px-7 text-[15px] font-bold transition-all duration-200 hover:-translate-y-0.5",
                  )}
                >
                  {content.secondaryLabel}
                </Link>
              )}
            </div>
          ) : null}

          {/* Note */}
          {content.note && (
            <p
              className={cx(
                "mt-4 text-[13px] body-text-theme"
              )}
            >
              {content.note}
            </p>
          )}
        </div>

        {/* Client logos */}
        {content.clients && content.clients.length > 0 && (
        <div
          ref={logosRef}
          className="
            relative
            z-10
            mt-16
            border-t
            border-[#DDE2E8]
            pt-7
            md:mt-16 body-text-theme
          "
        >
          {content.bottomHeading && (
          <span
            className={cx(
              "mb-5 block text-[11px] font-semibold uppercase tracking-[0.18em]"
            )}
          >
            {content.bottomHeading}
          </span>
          )}
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-5 md:gap-x-14">
            {content.clients.map((name) => (
              <li
                key={name}
                className={cx(
                  "text-[15px] font-semibold tracking-tight body-client-theme",
                )}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>
    </section>
  );
}
