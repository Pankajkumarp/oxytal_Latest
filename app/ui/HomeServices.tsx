/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";

import Link from "next/link";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Navigation,
  Pagination,
  A11y,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  documentToReactComponents,
} from "@contentful/rich-text-react-renderer";

import {
  Entry,
  EntrySkeletonType,
} from "contentful";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cx } from "@/app/lib/cx";

import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataLinkSkeleton,
  DataTextSkeleton,
  ServiceCardSkeleton,
} from "../types/contentful";

import { getAssetUrl } from "../lib/contentfulAsset";
import {
  resolveTheme,
  type SectionTheme,
} from "../lib/theme";

import { resolveHeadingLevel } from "../lib/headingLevel";

import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";

/* =========================================================
   GSAP
========================================================= */

if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    SplitText
  );
}

/* =========================================================
   REDUCED MOTION
========================================================= */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

/* =========================================================
   CONTENTFUL TYPES
========================================================= */

type PlainEntry<
  Skeleton extends EntrySkeletonType
> = Entry<Skeleton, undefined>;

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

/* =========================================================
   CONTENTFUL HELPERS
========================================================= */

function isEntry(
  value: unknown
): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (
      value as {
        sys: unknown;
      }
    ).sys === "object"
  );
}

function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage
    ? `/${link.fields.linkedPage}`
    : undefined;
}

/* =========================================================
   ACCENTS
========================================================= */

type Accent =
  | "blue"
  | "green"
  | "purple"
  | "orange";

const ACCENT_STYLES: Record<
  Accent,
  {
    gradient: string;
    iconBg: string;
    accentText: string;
  }
> = {
  blue: {
    gradient:
      "bg-gradient-to-br from-[#5b6fd8] to-[#8fa0f2]",
    iconBg: "bg-blue-50",
    accentText: "text-blue-600",
  },

  green: {
    gradient:
      "bg-gradient-to-br from-[#2fa88a] to-[#7cd6b4]",
    iconBg: "bg-emerald-50",
    accentText: "text-emerald-600",
  },

  purple: {
    gradient:
      "bg-gradient-to-br from-[#6c4fd6] to-[#a17ae8]",
    iconBg: "bg-violet-50",
    accentText: "text-violet-600",
  },

  orange: {
    gradient:
      "bg-gradient-to-br from-[#e07a2c] to-[#f4ab5f]",
    iconBg: "bg-orange-50",
    accentText: "text-orange-600",
  },
};

const ACCENT_CYCLE: Accent[] = [
  "blue",
  "green",
  "purple",
  "orange",
];

function resolveAccentColor(
  value?: string
): Accent | undefined {
  const normalized =
    value?.trim().toLowerCase();

  return normalized === "blue" ||
    normalized === "green" ||
    normalized === "purple" ||
    normalized === "orange"
    ? normalized
    : undefined;
}

/* =========================================================
   SERVICE CARD
========================================================= */

interface ServiceCard {
  number: string;
  name: string;
  description?: string;
  href: string;
  accent: Accent;
  iconUrl?: string;
  heroImageUrl?: string;
}

/* =========================================================
   CONTENTFUL -> SERVICE CARD
========================================================= */

function serviceCardEntryToCard(
  entry: PlainEntry<ServiceCardSkeleton>,
  index: number
): ServiceCard {
  const iconEntry =
    entry.fields.icon;

  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
      (
        iconEntry as unknown as PlainEntry<DataImageSkeleton>
      ).fields.image
    )
    : undefined;

  const heroImageEntry =
    entry.fields.heroImage;

  const heroImageUrl = isEntry(
    heroImageEntry
  )
    ? getAssetUrl(
      (
        heroImageEntry as unknown as PlainEntry<DataImageSkeleton>
      ).fields.image
    )
    : undefined;

  const ctaLink = isEntry(
    entry.fields.cta
  )
    ? (
      entry.fields.cta as unknown as PlainEntry<DataLinkSkeleton>
    )
    : undefined;

  const href =
    (ctaLink &&
      resolveLinkHref(ctaLink)) ??
    (entry.fields.slug
      ? `/service/${entry.fields.slug}`
      : "/services");

  return {
    number: String(index + 1).padStart(
      2,
      "0"
    ),

    name: entry.fields.title,

    description:
      entry.fields.shortDescription,

    href,

    accent:
      resolveAccentColor(
        entry.fields.accentColor
      ) ??
      ACCENT_CYCLE[
      index % ACCENT_CYCLE.length
      ],

    iconUrl,

    heroImageUrl,
  };
}

/* =========================================================
   SERVICE CARD VIEW
========================================================= */

function ServiceCardView({
  service,
  theme,
}: {
  service: ServiceCard;
  index: number;
  theme?: SectionTheme;
}) {
  const accent =
    ACCENT_STYLES[service.accent];

  return (
    <Link
      href={service.href}
      className={cx(
        "service-card group relative flex h-full flex-col overflow-hidden rounded-2xl border",
        theme?.cardBorder ??
        "border-gray-100",

        theme?.cardBg ??
        "bg-white"
      )}
    >
      {/* =====================================================
          IMAGE
      ===================================================== */}

      <div
        className={cx(
          "relative aspect-[4/5] w-full bg-cover bg-center bg-section-card",
          !service.heroImageUrl &&
          accent.gradient
        )}
        style={
          service.heroImageUrl
            ? {
              backgroundImage: `url(${service.heroImageUrl})`,
            }
            : undefined
        }
      >
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="flex flex-1 flex-col gap-2 p-3 py-5 absolute bg-white w-full bottom-0 text-section-card">
        <div className="flex items-start gap-3">
          {service.iconUrl && (
            <img
              src={service.iconUrl}
              alt=""
              className="mt-1 h-8 w-8 object-contain"
            />
          )}

          <h3
            className={cx(
              "pt-1.5 text-[20px] font-bold leading-snug uppercase",
              theme?.heading ??
              "text-gray-900"
            )}
          >
            {service.name}
          </h3>
        </div>

        {service.description && (
          <p
            className={cx(
              "flex-1 text-[15.6px] leading-relaxed  short-discription-card",
              theme?.body ??
              "text-gray-500"
            )}
          >
            {service.description}
          </p>
        )}

        <span
          className={cx(
            "inline-flex items-center gap-1.5 text-[14px] font-semibold",
            accent.accentText
          )}
        >
          Learn More

          <ArrowRight
            size={15}
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   PROPS
========================================================= */

interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

/* =========================================================
   HOME SERVICES
========================================================= */

export default function HomeServices({
  entry,
}: Props) {
  const elements =
    entry.fields.elements ?? [];

  /* =======================================================
     CONTENTFUL COPY
  ======================================================= */

  const copy = elements.find(
    (
      element
    ): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) &&
      element.sys.contentType.sys.id ===
      "dataText"
  );

  /* =======================================================
     CTA
  ======================================================= */

  const ctaLinkEntry = elements.find(
    (
      element
    ): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) &&
      element.sys.contentType.sys.id ===
      "dataLink"
  );

  /* =======================================================
     SERVICE CARDS
  ======================================================= */

  const serviceCardEntries =
    elements
      .filter(
        (
          element
        ): element is PlainEntry<ServiceCardSkeleton> =>
          isEntry(element) &&
          element.sys.contentType.sys.id ===
          "serviceCard"
      )
      .map(serviceCardEntryToCard);

  const eyebrow =
    copy?.fields.eyebrow;

  const heading =
    copy?.fields.heading;

  const description: ReactNode =
    copy?.fields.text
      ? documentToReactComponents(
        copy.fields.text
      )
      : undefined;

  const services =
    serviceCardEntries.length
      ? serviceCardEntries
      : [];

  const ctaHref =
    (ctaLinkEntry &&
      resolveLinkHref(
        ctaLinkEntry
      )) ??
    "/service";

  const ctaLabel =
    ctaLinkEntry?.fields.label;

  /* =======================================================
     THEME
  ======================================================= */

  const theme = resolveTheme(
    entry.fields.themeColor
  );

  /* =======================================================
     BACKGROUND IMAGE
  ======================================================= */

  const backgroundImageEntry =
    entry.fields.backgroundImage;

  const backgroundUrl = isEntry(
    backgroundImageEntry
  )
    ? getAssetUrl(
      (
        backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>
      ).fields.image
    )
    : undefined;

  /* =======================================================
     REFS
  ======================================================= */

  const sectionRef =
    useRef<HTMLElement>(null);

  const headingRef =
    useRef<HTMLHeadingElement>(null);

  /* =======================================================
     HEADING REVEAL
  ======================================================= */

  useLayoutEffect(() => {
    if (!headingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(
        headingRef.current,
        {
          opacity: 1,
        }
      );

      return;
    }

    let split:
      | SplitText
      | undefined;

    const ctx = gsap.context(
      () => {
        split = SplitText.create(
          headingRef.current!,
          {
            type: "words",
            mask: "words",
            autoSplit: true,

            onSplit: (self) =>
              gsap.from(
                self.words,
                {
                  yPercent: 115,
                  rotate: 3,
                  opacity: 0,
                  duration: 1,
                  ease: "power4.out",
                  stagger: 0.06,

                  scrollTrigger: {
                    trigger:
                      sectionRef.current,
                    start: "top 75%",
                    once: true,
                  },
                }
              ),
          }
        );
      },
      sectionRef
    );

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =======================================================
     REDUCED MOTION
  ======================================================= */

  const reducedMotion =
    prefersReducedMotion();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",

        !backgroundUrl &&
        (theme?.sectionBg ??
          "bg-gray-50/60")
      )}
      style={
        backgroundUrl
          ? {
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: "cover",
            backgroundRepeat:
              "no-repeat",
            backgroundPosition:
              "center",
          }
          : undefined
      }
    >
      {/* =====================================================
          BACKGROUND PATTERN
      ===================================================== */}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-1"
      >
        <ThemePattern
          theme={theme}
          pattern={
            entry?.fields.pattern
          }
          patternColor={
            entry?.fields.patternColor
          }
        />
      </div>

      <div className="container relative z-10 mx-auto px-5 py-16 md:px-10 md:py-20 lg:py-20">
        {/* ===================================================
            INTRO
        =================================================== */}

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          {eyebrow && (
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",

                theme?.eyebrowBg ??
                "bg-emerald-50",

                theme?.eyebrowText ??
                "text-emerald-700"
              )}
            >
              {eyebrow}
            </span>
          )}

          <DynamicHeading
            level={resolveHeadingLevel(
              copy?.fields
                .headingLevel,
              "h2"
            )}
            ref={headingRef}
            className={cx(
              "text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[34px] md:text-[40px]",

              theme?.heading ??
              "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

          {description && (
            <div
              className={cx(
                "rich-text max-w-xl text-[15.5px] leading-relaxed md:text-[17px]",

                theme?.body ??
                "text-gray-500"
              )}
            >
              {description}
            </div>
          )}
        </div>

        {/* ===================================================
            SWIPER
        =================================================== */}

        <div className="relative z-20 mt-7">
          <Swiper
            modules={[
              Navigation,
              Pagination,
              Autoplay,
              A11y,
            ]}

            /*
             * Loop only when there are enough cards.
             */
            loop={
              services.length > 3
            }

            /*
             * IMPORTANT:
             *
             * Desktop has 3 cards.
             * centeredSlides makes the active slide
             * sit in the middle.
             */
            centeredSlides={true}

            /*
             * One slide moves at a time.
             */
            slidesPerGroup={1}

            /*
             * Smooth transition.
             */
            speed={
              reducedMotion
                ? 0
                : 750
            }

            grabCursor={
              !reducedMotion
            }

            watchSlidesProgress

            observer

            observeParents

            slidesPerView={1}

            spaceBetween={20}

            navigation={{
              prevEl:
                ".services-swiper-prev",

              nextEl:
                ".services-swiper-next",
            }}

            pagination={{
              clickable: true,
            }}

            autoplay={
              !reducedMotion
                ? {
                  delay: 5000,
                  disableOnInteraction:
                    false,
                  pauseOnMouseEnter:
                    true,
                }
                : false
            }

            /*
             * Responsive layout
             */
            breakpoints={{
              /*
               * Small mobile
               */
              0: {
                slidesPerView: 1,
                centeredSlides:
                  false,
                spaceBetween: 16,
              },

              /*
               * Mobile
               */
              640: {
                slidesPerView: 1,
                centeredSlides:
                  false,
                spaceBetween: 20,
              },

              /*
               * Tablet
               */
              768: {
                slidesPerView: 2,
                centeredSlides:
                  false,
                spaceBetween: 24,
              },

              /*
               * Desktop
               *
               * 3 cards visible.
               * Middle card = active.
               */
              1024: {
                slidesPerView: 3,
                centeredSlides:
                  true,
                spaceBetween: 24,
              },

              /*
               * Large desktop
               */
              1280: {
                slidesPerView: 3,
                centeredSlides:
                  true,
                spaceBetween: 28,
              },
            }}

            className="services-swiper"
          >
            {services.map(
              (
                service,
                index
              ) => (
                <SwiperSlide
                  key={
                    service.number
                  }
                  className="!h-auto"
                >
                  <ServiceCardView
                    service={
                      service
                    }
                    index={
                      index
                    }
                    theme={
                      theme
                    }
                  />
                </SwiperSlide>
              )
            )}
          </Swiper>

          {/* =================================================
              PREVIOUS BUTTON
          ================================================= */}

          {services.length > 1 && (
            <button
              type="button"
              aria-label="Previous service"
              className={cx(
                "services-swiper-prev absolute left-0 top-1/2 z-30 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-gray-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-50 md:flex",

                theme?.cardBorder ??
                "border-gray-100"
              )}
            >
              <ChevronLeft
                size={20}
                aria-hidden
              />
            </button>
          )}

          {/* =================================================
              NEXT BUTTON
          ================================================= */}

          {services.length > 1 && (
            <button
              type="button"
              aria-label="Next service"
              className={cx(
                "services-swiper-next absolute right-0 top-1/2 z-30 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-gray-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-50 md:flex",

                theme?.cardBorder ??
                "border-gray-100"
              )}
            >
              <ChevronRight
                size={20}
                aria-hidden
              />
            </button>
          )}
        </div>

        {/* ===================================================
            CTA
        =================================================== */}

        {ctaLabel && (
          <div className="mt-10 flex justify-center md:mt-12">
            <Link
              href={ctaHref}
              className={cx(
                "inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",

                theme?.buttonBg ??
                "bg-emerald-600",

                theme?.buttonText ??
                "text-white",

                theme?.buttonHoverBg ??
                "hover:bg-emerald-500"
              )}
            >
              {ctaLabel}

              <ArrowRight
                size={17}
                aria-hidden
              />
            </Link>
          </div>
        )}
      </div>

      {/* =====================================================
          SWIPER CSS
      ===================================================== */}

      <style jsx global>{`
      .service-card{
  transition:
    transform .8s ease;
      }
    .service-card:hover {
  transform: translateY(-10px) scale(1.01);
}
.short-discription-card {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition:
    opacity 0.5s ease,
    max-height 1s ease;
}

.service-card:hover .short-discription-card {
  opacity: 1;
  max-height: 200px;
}
.text-section-card {
  transition: background 0.5s ease;
}

.service-card:hover .text-section-card {
  background: transparent;
}
        .services-swiper {
          width: 100%;
          overflow-x: hidden;
          overflow-y: visible !important;
          padding: 40px 4px 58px;
        }
        .services-swiper .swiper-wrapper {
          align-items: stretch;
          transition-timing-function:
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            );
        }
        .services-swiper .swiper-slide {
          height: auto;
          transition:
            transform 0.4s ease,
            opacity 0.4s ease;
        }
        .services-swiper .swiper-slide > a {
  height: 100%;
  transform-origin: center bottom;
  scale: 0.94;
}
.services-swiper .swiper-slide-active > a {
  scale: 1.04;
}
        .services-swiper .swiper-pagination {
          position: absolute;
          left: 0 !important;
          right: 0 !important;
          bottom: 10px !important;
          width: 100% !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
        }
        .services-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 !important;
          opacity: 1;
          border-radius: 999px;
          background: #d9dee5;
          transition:
            width 0.3s ease,
            background 0.3s ease,
            transform 0.3s ease;
        }
        .services-swiper .swiper-pagination-bullet-active {
          width: 24px;
          background: #007595;
        }
        .services-swiper-prev, .services-swiper-next {
          transition:
            scale 0.25s ease,
            background-color 0.25s ease,
            box-shadow 0.25s ease;
        }
        .services-swiper-prev:hover, .services-swiper-next:hover {
          scale: 1.08;
        }
        @media (max-width: 767px) {
          .services-swiper {
            padding-left: 4px;
            padding-right: 4px;
            padding-bottom: 52px;
          }
          .services-swiper .swiper-slide > a {
            scale: 1;
            opacity: 1;
          }
          .services-swiper .swiper-slide-active > a {
            scale: 1;
            box-shadow: none;
          }
          .services-swiper-prev, .services-swiper-next {
            display: none;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .services-swiper .swiper-slide > a {
            scale: 1;
            opacity: 1;
          }
          .services-swiper .swiper-slide-active > a {
            scale: 1;
            box-shadow: none;
          }
        }
      `}</style>
    </section>
  );
}