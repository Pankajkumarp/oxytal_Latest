"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  LayoutTemplate,
  Sparkles,
  type LucideIcon,
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
import { resolveTheme, type SectionTheme } from "../lib/theme";
import { resolveHeadingLevel } from "../lib/headingLevel";
import DynamicHeading from "./DynamicHeading";
import ThemePattern from "./ThemePattern";

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody uses for `dataLink`/`callToAction`. */
function resolveLinkHref(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

type Accent = "blue" | "green" | "purple" | "orange";

/** Per-card accent — independent of the section's own `themeColor`, same "each card picks its own color, the section theme doesn't override it" treatment `AboutProducts` uses for its `accent` field. */
const ACCENT_STYLES: Record<
  Accent,
  { gradient: string; iconBg: string; accentText: string }
> = {
  blue: {
    gradient: "bg-gradient-to-br from-[#5b6fd8] to-[#8fa0f2]",
    iconBg: "bg-blue-50",
    accentText: "text-blue-600",
  },
  green: {
    gradient: "bg-gradient-to-br from-[#2fa88a] to-[#7cd6b4]",
    iconBg: "bg-emerald-50",
    accentText: "text-emerald-600",
  },
  purple: {
    gradient: "bg-gradient-to-br from-[#6c4fd6] to-[#a17ae8]",
    iconBg: "bg-violet-50",
    accentText: "text-violet-600",
  },
  orange: {
    gradient: "bg-gradient-to-br from-[#e07a2c] to-[#f4ab5f]",
    iconBg: "bg-orange-50",
    accentText: "text-orange-600",
  },
};

/** Cycled by card index as a fallback when a `serviceCard` entry has no `accentColor` set. */
const ACCENT_CYCLE: Accent[] = ["blue", "green", "purple", "orange"];

/** Normalizes `serviceCard.accentColor` (free text in Contentful — case/whitespace can vary) to one of the 4 supported accents. Returns `undefined` for an unset or unrecognized value, so the caller can fall back to cycling by card position instead — same convention `contentDetail.accentColor`/`AboutProducts` use. */
function resolveAccentColor(value?: string): Accent | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized === "blue" ||
    normalized === "green" ||
    normalized === "purple" ||
    normalized === "orange"
    ? normalized
    : undefined;
}

/** Cycled by card index as a fallback when a `serviceCard` entry has no `icon` image set. */
const FALLBACK_ICONS: LucideIcon[] = [ClipboardCheck, LayoutTemplate, Code2];

interface ServiceCard {
  number: string;
  name: string;
  description?: string;
  href: string;
  accent: Accent;
  /** Resolved image URL from the `serviceCard`'s `icon` field. Falls back to a fixed Lucide icon (cycled by card index) when omitted. */
  iconUrl?: string;
  /** Resolved image URL from the `serviceCard`'s `heroImage` field. Falls back to a colored gradient block (from `accent`) when omitted. */
  heroImageUrl?: string;
}

/** Maps a resolved `serviceCard` entry to the plain `ServiceCard` shape this component renders. */
function serviceCardEntryToCard(
  entry: PlainEntry<ServiceCardSkeleton>,
  index: number
): ServiceCard {
  const iconEntry = entry.fields.icon;
  const iconUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const heroImageEntry = entry.fields.heroImage;
  const heroImageUrl = isEntry(heroImageEntry)
    ? getAssetUrl(
        (heroImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields
          .image
      )
    : undefined;

  // `serviceCard.cta` is a single dataLink reference (not an array, unlike
  // contentDetail's `cta`) — resolve it directly.
  const ctaLink = isEntry(entry.fields.cta)
    ? (entry.fields.cta as unknown as PlainEntry<DataLinkSkeleton>)
    : undefined;
  const href =
    (ctaLink && resolveLinkHref(ctaLink)) ??
    (entry.fields.slug ? `/service/${entry.fields.slug}` : "/services");

  return {
    number: String(index + 1).padStart(2, "0"),
    name: entry.fields.title,
    description: entry.fields.shortDescription,
    href,
    accent:
      resolveAccentColor(entry.fields.accentColor) ??
      ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    iconUrl,
    heroImageUrl,
  };
}

/**
 * Placeholder roster, used only when the `composableElement`'s `elements`
 * has no `serviceCard` entries yet. Swap/add real services in Contentful
 * by adding `serviceCard` entries — nothing here needs to change.
 */
const DEFAULT_SERVICES: ServiceCard[] = [];

/**
 * One service card in the `ServiceCarousel` below — an illustration (or a
 * colored gradient block, from `service.accent`, when there's no
 * `heroImage`) with a numbered badge, over a white body with the service's
 * icon/title/description and a "Learn More" link. `theme` only reaches
 * the card's own body chrome (background/border/text) — the illustration
 * gradient and every accent color stay independent of the section's
 * `themeColor`, same "each card keeps its own accent" treatment
 * `AboutProducts` uses.
 *
 * Hovering (GSAP, not a CSS transition) lifts the whole card a few
 * pixels with a deeper shadow while the illustration underneath it zooms
 * in slightly — the zoom is clipped to the card's own rounded frame (the
 * outer `Link` already has `overflow-hidden`), so it never spills over
 * onto neighboring cards the way scaling the whole card up would.
 * Reverses on mouse-leave. Skipped entirely under
 * `prefers-reduced-motion`.
 */
function ServiceCardView({
  service,
  index,
  theme,
}: {
  service: ServiceCard;
  index: number;
  theme?: SectionTheme;
}) {
  const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  const accent = ACCENT_STYLES[service.accent];
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.killTweensOf([cardRef.current, imageRef.current]);
    gsap.to(cardRef.current, {
      y: -8,
      boxShadow: "0 20px 35px -15px rgba(0, 0, 0, 0.12)",
      zIndex: 10,
      duration: 0.4,
      ease: "power2.out",
    });
    gsap.to(imageRef.current, {
      scale: 1.12,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  const handleLeave = () => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.killTweensOf([cardRef.current, imageRef.current]);
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      duration: 0.35,
      ease: "power2.out",
      onComplete: () => gsap.set(cardRef.current, { zIndex: "auto" }),
    });
    gsap.to(imageRef.current, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  return (
    <Link
      ref={cardRef}
      href={service.href}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={cx(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border",
        theme?.cardBorder ?? "border-gray-100",
        theme?.cardBg ?? "bg-white"
      )}
    >
      <div
        ref={imageRef}
        className={cx(
          "relative aspect-[4/3] w-full bg-cover bg-center",
          !service.heroImageUrl && accent.gradient
        )}
        style={
          service.heroImageUrl
            ? { backgroundImage: `url(${service.heroImageUrl})` }
            : undefined
        }
      >
        <span
          className={cx(
            "absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm",
            accent.accentText
          )}
        >
          {service.number}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <div
            className={cx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              accent.iconBg,
              accent.accentText
            )}
          >
            {service.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for external/Contentful assets in this project
              <img
                src={service.iconUrl}
                alt=""
                aria-hidden
                className="h-5 w-5 object-contain"
              />
            ) : (
              <FallbackIcon size={20} aria-hidden />
            )}
          </div>
          <h3
            className={cx(
              "pt-1.5 text-[24px] leading-snug font-bold max-w-[300px]",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {service.name}
          </h3>
        </div>

        {service.description && (
          <p
            className={cx(
              "flex-1 text-[14px] leading-relaxed",
              theme?.body ?? "text-gray-500"
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

/**
 * "What We Do" — rendered from a `composableElement` entry (`subType:
 * "service"` — see `ComposableElementRenderer`):
 *
 * - one `dataText` entry among `elements` supplies the eyebrow/heading/
 *   description copy
 * - one top-level `dataLink` entry among `elements` supplies the
 *   "Explore all services" CTA button, shown centered below the carousel
 * - every `serviceCard` entry among `elements` becomes one slide in the
 *   carousel below (via `serviceCardEntryToCard`) — each card's own
 *   `heroImage` (illustration) and `accentColor` ("blue"/"green"/
 *   "purple"/"orange", cycled by position when unset) are independent of
 *   the section's `themeColor` — add/remove `serviceCard` entries in
 *   Contentful to change the roster, nothing here needs to change
 *
 * Falls back to `DEFAULT_SERVICES` / a hardcoded `/services` CTA when
 * `elements` aren't set yet.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling section uses) is an
 * *optional* full-bleed section photo — when set, it covers the whole
 * section with a light scrim over it instead of the decorative dotted
 * `ThemePattern`/gradient-blob backdrop, same "photo wins" treatment
 * `HomeCaseStudies` uses.
 *
 * The cards are an Embla carousel (loops, autoplays — paused on hover,
 * skipped under reduced-motion) with prev/next arrows and dot indicators,
 * 1 card per view on mobile / 2 on tablet / 3 on desktop+, same setup
 * `HomeCaseStudies`' own card row uses; arrows/dots only render when
 * there's more than one snap point for the current viewport. The heading
 * still gets the GSAP split-text scroll reveal every sibling section's
 * heading uses.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function HomeServices({ entry }: Props) {
  const elements = entry.fields.elements ?? [];

  // One `dataText` entry among `elements` supplies the eyebrow/heading/description copy.
  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  // One top-level `dataLink` entry among `elements` supplies the "Explore
  // all services" CTA button (distinct from each serviceCard's own `cta`).
  const ctaLinkEntry = elements.find(
    (element): element is PlainEntry<DataLinkSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataLink"
  );

  // Every `serviceCard` entry among `elements` becomes one carousel slide.
  const serviceCardEntries = elements
    .filter(
      (element): element is PlainEntry<ServiceCardSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "serviceCard"
    )
    .map(serviceCardEntryToCard);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description: ReactNode = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : undefined;
  const services = serviceCardEntries.length
    ? serviceCardEntries
    : DEFAULT_SERVICES;
  const ctaHref = (ctaLinkEntry && resolveLinkHref(ctaLinkEntry)) ?? "/service";
  const ctaLabel = ctaLinkEntry?.fields.label;

  // Resolves `themeColor` (e.g. "dark", "blue", "emerald" — see
  // app/lib/theme.ts) to its text/button/card colors. `undefined` for an
  // unset or unrecognized value, in which case every themed class below
  // falls back to this section's existing default (today's plain look).
  const theme = resolveTheme(entry.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRowRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as
     CommonTrustedBy/HomeProducts). Nothing else in this section
     animates. Skipped entirely under prefers-reduced-motion.
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
     CARD ROW REVEAL — the cards fade + scale in (from 0.9x, not from
     off-position) with a stagger the first time the row scrolls into
     view — a "grow into place" feel rather than rising from below. This
     is separate from the "settle pop" below: this one plays once, on
     scroll-in; that one replays every time the carousel actually moves.
     Animates each card element directly, not `cardsRowRef`'s own
     `children` (the slide wrappers) — those have one-sided `pl-6` gap
     padding, so scaling them from their own "center center" would make
     the visible card drift sideways instead of growing in place, same
     issue the earlier center-emphasis experiment hit. Skipped entirely
     under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRowRef.current) {
      return;
    }

    const cardEls = cardsRowRef.current.querySelectorAll<HTMLElement>("a");

    if (prefersReducedMotion()) {
      gsap.set(cardEls, { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardEls, {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: cardsRowRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardsRowRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARDS CAROUSEL — Embla Carousel, same setup as HomeCaseStudies'
     card row: loops, autoplays (paused on hover/interaction, skipped
     under reduced-motion), 1 card per view on mobile / 2 on tablet / 3 on
     desktop+ via each slide's own responsive flex-basis below.
  ========================================================= */
  const carouselPlugins = useMemo(
    () =>
      !prefersReducedMotion()
        ? [
            Autoplay({
              delay: 5000,
              stopOnMouseEnter: true,
              stopOnInteraction: false,
            }),
          ]
        : [],
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    carouselPlugins
  );

  const [, rerenderCarousel] = useReducer((tick: number) => tick + 1, 0);

  /* =========================================================
     SETTLE POP — a real GSAP animation tied to the carousel actually
     moving (arrows, dots, autoplay, or a drag), rather than trying to
     replace Embla's own scroll physics with a GSAP-driven tween: that
     approach means fighting Embla's internal engine for control of the
     same transform on every drag/autoplay tick, which is exactly what
     made the earlier "center card" experiment fragile. Instead, once a
     transition lands (Embla's "select"), the cards now in view pop in
     from slightly faded/shrunk back to normal with a quick stagger —
     visible GSAP motion on every slide change, without touching how
     Embla itself scrolls. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const handleSelect = () => {
      rerenderCarousel();

      if (prefersReducedMotion()) {
        return;
      }

      const slideNodes = emblaApi.slideNodes();
      const targets = emblaApi
        .slidesInView()
        // The card element itself, not `slideNodes[slideIndex]` (the
        // slide wrapper) — the wrapper has one-sided `pl-6` gap padding,
        // so scaling it from its own "center center" would make the
        // visible card drift sideways instead of popping in place, same
        // issue the earlier center-emphasis experiment hit.
        .map((slideIndex) =>
          slideNodes[slideIndex]?.querySelector<HTMLElement>("a")
        )
        .filter((node): node is HTMLElement => Boolean(node));

      if (!targets.length) {
        return;
      }

      gsap.fromTo(
        targets,
        { opacity: 0.5, scale: 0.94 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
          overwrite: "auto",
        }
      );
    };

    emblaApi.on("select", handleSelect);
    emblaApi.on("reInit", handleSelect);

    return () => {
      emblaApi.off("select", handleSelect);
      emblaApi.off("reInit", handleSelect);
    };
  }, [emblaApi, rerenderCarousel]);

  const carouselSnaps = emblaApi?.scrollSnapList() ?? [];
  const carouselSelectedIndex = emblaApi?.selectedScrollSnap() ?? 0;

  return (
    <section
      ref={sectionRef}
      className={cx(
        "relative overflow-hidden",
        !backgroundUrl && (theme?.sectionBg ?? "bg-gray-50/60")
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
      {/* =================================================
          DECORATIVE BACKGROUND — same treatment as CommonTrustedBy's,
          for a consistent premium-section feel. A light scrim over the
          background image instead when there is one, so the intro copy
          and cards stay readable.
      ================================================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
            <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container mx-auto px-5 py-16 md:px-10 md:py-20 lg:py-20">
        {/* =================================================
            INTRO — eyebrow + heading on the left, description on the
            right; no hero image up here (each card carries its own
            illustration instead — see the carousel below).
        ================================================= */}

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
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

          <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
            ref={headingRef}
            className={cx(
              "text-[28px] leading-[1.1] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {heading}
          </DynamicHeading>

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
        {/* =================================================
            SERVICE CARDS — Embla carousel, 1 slide per view on
            mobile / 2 on tablet / 3 on desktop+ (each slide's flex-basis
            below), looping. Works for any number of services.
        ================================================= */}
        <div className="relative mt-14 md:mt-16  z-2">
          {/* `py-8 -my-8` gives the hover lift/shadow room to breathe:
              `overflow-hidden` clips at this element's own padding edge,
              not its margin edge, so the padding here is genuine buffer
              space a card can grow into on hover without being clipped —
              32px comfortably covers the -8px lift plus the visual reach
              of the hover shadow's blur. The matching negative margin
              cancels that padding back out so the row still sits exactly
              where it did before (no gap added above/below it).
              Horizontal clipping at the very left/right edge is left
              as-is, same accepted tradeoff `HomeCaseStudies`' own
              hover-lift cards already have. */}
          <div className="-my-8 overflow-hidden py-8" ref={emblaRef}>
            <div ref={cardsRowRef} className="-ml-6 flex">
              {services.map((service, index) => (
                <div
                  key={service.number}
                  className="flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  <ServiceCardView
                    service={service}
                    index={index}
                    theme={theme}
                  />
                </div>
              ))}
            </div>
          </div>

          {carouselSnaps.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                aria-label="Previous service"
                className="absolute top-1/2 left-0 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50 md:flex"
              >
                <ChevronLeft size={18} aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                aria-label="Next service"
                className="absolute top-1/2 right-0 z-20 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50 md:flex"
              >
                <ChevronRight size={18} aria-hidden />
              </button>

              <div className="mt-8 flex items-center justify-center gap-2">
                {carouselSnaps.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    className={cx(
                      "h-2 rounded-full transition-all duration-300",
                      dotIndex === carouselSelectedIndex
                        ? cx("w-6", theme?.buttonBg ?? "bg-emerald-600")
                        : "w-2 bg-gray-200 hover:bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {ctaLabel && (
          <div className="mt-10 flex justify-center md:mt-12">
            <Link
              href={ctaHref}
              className={cx(
                "inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                theme?.buttonBg ?? "bg-emerald-600",
                theme?.buttonText ?? "text-white",
                theme?.buttonHoverBg ?? "hover:bg-emerald-500"
              )}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
