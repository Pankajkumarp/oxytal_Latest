"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Entry, EntrySkeletonType } from "contentful";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
} from "../types/contentful";
import ThemePattern from "./ThemePattern";

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

interface ContactMethod {
  title: string;
  detail: string;
  iconUrl?: string;
}

/** Cycled by card index as a fallback when a `contentDetail` entry has no `icon` image set — same "cycle a fixed Lucide roster" pattern HomeServices/HomeTalkToUs use. */
const FALLBACK_ICONS: LucideIcon[] = [Mail, Phone, MessageCircle, MapPin];

/** Placeholder roster, used only when the `composableElement`'s `elements` has no `contentDetail` entries yet — the mockup's own 4-up row. */
const DEFAULT_CONTACT_METHODS: ContactMethod[] = [];

/** Maps a resolved `contentDetail` entry to the plain `ContactMethod` shape this component renders — same "reuse contentDetail for a generic title/description/icon card" pattern ServicesAiLayer/HomeTalkToUs use. */
function contentDetailToContactMethod(
  entry: PlainEntry<ContentDetailSkeleton>
): ContactMethod {
  const iconEntry = entry.fields.icon;

  return {
    title: entry.fields.title ?? "",
    detail: entry.fields.shortDescription ?? "",
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/**
 * The `/contact` page's contact-method row (Email / Call / WhatsApp /
 * Office) — a `composableElement` section (`subType: "contactInfo"` —
 * see `ComposableElementRenderer`):
 *
 * - every `contentDetail` entry among `elements` becomes one card
 *   (`title`/`shortDescription`/`icon`) — add/remove/reorder
 *   `contentDetail` entries in Contentful to change the roster, nothing
 *   here needs to change
 *
 * Falls back to `DEFAULT_CONTACT_METHODS` (with a cycled Lucide icon per
 * card) when `elements` has no `contentDetail` entries yet.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling section uses) is an
 * *optional* full-bleed section photo — when set, it covers the whole
 * section behind the cards, with a semi-opaque white tint over it (same
 * "photo wins, tint keeps content readable" treatment `AboutStats` uses)
 * since the cards themselves are opaque and only the gutters between/
 * around them would otherwise show a busy, distracting photo. With no
 * `backgroundImage` set, the section falls back to its themed/default
 * background instead, with `ThemePattern`'s dotted backdrop when the
 * theme opts into it.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section. The cards fade + rise into place with a
 * stagger as the row scrolls into view, skipped under
 * `prefers-reduced-motion`.
 *
 * Each card also gets its own GSAP hover — the icon "pops" (a quick
 * bounce scale/rotate) and the arrow glyph slides up-right while
 * switching to the theme's accent color, both reverting on mouse-leave —
 * on top of the plain CSS `hover:-translate-y-1 hover:shadow-lg` lift
 * every card already has. The GSAP half is skipped under
 * `prefers-reduced-motion` (the CSS lift/shadow still applies either
 * way, same convention `AboutGlobal`'s card hover uses).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function ContactInfoCards({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const contentDetailMethods = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToContactMethod);

  const methods = contentDetailMethods.length
    ? contentDetailMethods
    : DEFAULT_CONTACT_METHODS;

  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;

  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     CARD REVEAL — fade + rise with a stagger as the row scrolls
     into view (same load treatment several sibling sections use).
     Skipped entirely under prefers-reduced-motion.
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
        stagger: 0.5,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 90%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD HOVER — the icon "pops" with a quick bounce scale/rotate
     and the arrow glyph slides up-right while switching to the
     theme's accent color; both revert on mouse-leave. Re-entering a
     card kills any tween in progress first so rapid hovering never
     stacks/queues animations. Skipped under prefers-reduced-motion
     (the plain CSS `hover:-translate-y-1 hover:shadow-lg` lift still
     applies either way).
  ========================================================= */
  const accentColor = theme?.patternColor ?? "#059669";

  const handleCardEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-info-icon]");
    const arrow = card.querySelector<HTMLElement>("[data-info-arrow]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, {
        scale: 1.15,
        rotate: 6,
        duration: 0.5,
        ease: "back.out(2.5)",
      });
    }

    if (arrow) {
      gsap.killTweensOf(arrow);
      gsap.to(arrow, {
        x: 3,
        y: -3,
        color: accentColor,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const icon = card.querySelector<HTMLElement>("[data-info-icon]");
    const arrow = card.querySelector<HTMLElement>("[data-info-arrow]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.4, ease: "power2.out" });
    }

    if (arrow) {
      gsap.killTweensOf(arrow);
      gsap.to(arrow, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        // Removes the inline `color` this tween set, once it finishes,
        // so the arrow reverts to its Tailwind class color (`theme?.muted`
        // below) instead of getting stuck on the accent color.
        clearProps: "color",
      });
    }
  };

  return (
    <section
      className={cx(
        "relative overflow-hidden py-16 md:py-20 lg:py-24",
        backgroundUrl ? "bg-cover bg-center" : theme?.sectionBg
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />

      </div>

      <div
        ref={cardsRef}
        className="container relative z-2 mx-auto grid gap-5 px-5 sm:grid-cols-2 md:px-10 lg:grid-cols-4"
      >
        {methods.map((method, index) => {
          const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

          return (
            <div
              key={method.title}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              className={cx(
                "flex items-start justify-between gap-4 rounded-2xl border p-6 shadow-md hover:-translate-y-1 hover:shadow-lg",
                theme?.cardBorder ?? "border-gray-100",
                theme?.cardBg ?? "bg-white"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  data-info-icon
                  className={cx(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    theme?.eyebrowBg ?? "bg-emerald-50",
                    theme?.accentText ?? "text-emerald-600"
                  )}
                >
                  {method.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={method.iconUrl}
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
                      "text-[15px] font-bold",
                      theme?.heading ?? "text-gray-900"
                    )}
                  >
                    {method.title}
                  </p>
                  <p
                    className={cx(
                      "mt-0.5 text-[13.5px]",
                      theme?.body ?? "text-gray-500"
                    )}
                  >
                    {method.detail}
                  </p>
                </div>
              </div>
              <ArrowUpRight
                data-info-arrow
                size={16}
                aria-hidden
                className={cx("mt-1 shrink-0", theme?.muted ?? "text-gray-300")}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
