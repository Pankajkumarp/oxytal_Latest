"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
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
  DataLinkSkeleton,
  DataTextSkeleton,
} from "../types/contentful";
import Link from "next/link";

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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/HomeAI/AboutHero use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string | undefined {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : undefined;
}

/** Derives 1–2 initials from a name (e.g. "Chief Executive" → "CE") — used as the avatar fallback when a `contentDetail` entry has no `icon` image set. */
function initialsFromName(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("");

  return initials.slice(0, 2).toUpperCase();
}

interface SocialLink {
  label: string;
  href: string;
  iconUrl?: string;
}

interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  socials: SocialLink[];
}

/** Placeholder roster, used only when `elements` has no `contentDetail` entries yet — the original mockup's 4-person team grid. */
const DEFAULT_LEADERS: Leader[] = [];

/** Maps a resolved `contentDetail` entry to one `Leader` — `title` as the name, `badge` as the role, `shortDescription` as the bio, `icon` as the avatar photo (falls back to initials derived from the name), and every `dataLink` in `cta` as one social link — its own `icon` field supplies the glyph (same pattern `Footer`'s social links use), falling back to the link's `label` initials when unset. */
function contentDetailToLeader(entry: PlainEntry<ContentDetailSkeleton>): Leader {
  const iconEntry = entry.fields.icon;
  const avatarUrl = isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  const socials = (entry.fields.cta ?? [])
    .filter(isEntry)
    .map((link) => {
      const dataLink = link as unknown as PlainEntry<DataLinkSkeleton>;
      const iconEntry = dataLink.fields.icon;

      return {
        label: dataLink.fields.label,
        href: resolveLinkHref(dataLink) ?? "#",
        iconUrl: isEntry(iconEntry)
          ? getAssetUrl(
              (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields
                .image
            )
          : undefined,
      };
    });

  return {
    id: entry.sys.id,
    name: entry.fields.title ?? "",
    role: entry.fields.badge ?? "",
    bio: entry.fields.shortDescription ?? "",
    avatarUrl,
    socials,
  };
}

/**
 * The About page's "Leadership" section — a `composableElement` section
 * (`subType: "aboutLeadership"` — see `ComposableElementRenderer`), split
 * out of `AboutPage` the same way `AboutHero`/`AboutStats`/`AboutStory`/
 * `AboutServices`/`AboutApproach`/`AboutProducts` were:
 *
 * - the first `dataText` entry among `elements` supplies the eyebrow,
 *   heading, and intro paragraph (`text`, rich text)
 * - every `contentDetail` entry among `elements` becomes one team member
 *   card (via `contentDetailToLeader`) — see that function's own comment
 *   for the full field mapping; add/remove/reorder `contentDetail`
 *   entries in Contentful to change the roster, nothing here needs to
 *   change
 *
 * Falls back to `DEFAULT_LEADERS` and the original hardcoded heading/
 * copy when the corresponding entries aren't set yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * plain gray/white/blue look, so it renders the same as before this
 * existed until an editor sets a `themeColor`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field every sibling About section uses) is an
 * *optional* full-bleed section background — no placeholder fallback, so
 * the section just shows its themed background color until an editor
 * sets one. `ThemePattern`'s dotted backdrop only renders when there's
 * no background photo, same call every sibling section makes.
 *
 * The heading gets the same GSAP split-text scroll-reveal every other
 * section's heading uses. The leader cards get their own scroll-triggered
 * reveal too — a fade + rise, one card at a time, staggered apart, same
 * load treatment `AboutCulture`'s value cards use.
 *
 * Each card is now a big full-bleed photo tile (avatar photo, or the
 * initials gradient when there's no photo) rather than a small circular
 * avatar sitting above a permanently-visible bio — name and role sit in
 * a scrim at the bottom of the photo, and the bio + social links stay
 * collapsed until hover, then expand open over the photo (a CSS
 * grid-rows `0fr → 1fr` trick, so it animates smoothly without knowing
 * the content's height up front). That collapse/expand is plain CSS
 * (`group`/`group-hover`), so it still works with JS hover with no
 * special-casing under `prefers-reduced-motion` — it's a discrete
 * disclosure, not a continuous motion effect. Layered on top of that,
 * the card *also* keeps a GSAP hover distinct from Culture's (card lift
 * + icon spin): it tilts on its X/Y axes to follow the cursor while the
 * photo tilts the opposite way and zooms in, giving a subtle "magnetic
 * card" feel (`handleCardMove`/`handleCardLeave`) — skipped under
 * `prefers-reduced-motion` (the card falls back to a plain CSS
 * `hover:shadow-2xl` in that case).
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutLeadership({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const contentDetailLeaders = elements
    .filter(
      (element): element is PlainEntry<ContentDetailSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
    )
    .map(contentDetailToLeader);

  const eyebrow = copy?.fields.eyebrow;
  const heading = copy?.fields.heading;
  const description = copy?.fields.text
    ? documentToReactComponents(copy.fields.text)
    : null;

  const leaders = contentDetailLeaders.length
    ? contentDetailLeaders
    : DEFAULT_LEADERS;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this section's text/card colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own plain gray/white/blue look
  // (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling About section uses). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REVEAL ANIMATION — the heading only, splitting into words on
     scroll-in (same GSAP split-text treatment as every sibling About
     section). Skipped entirely under prefers-reduced-motion.
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
     CARD REVEAL — the leader cards fade + rise into place with a
     stagger as the grid scrolls into view (same load treatment
     AboutCulture's value cards use — no hover animation here, just the
     load-in). Skipped entirely under prefers-reduced-motion.
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
        y: 36,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.7,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     HOVER — a 3D "tilt" instead of Culture's card-lift + icon-spin: the
     card tilts on its X/Y axes to follow the cursor (a subtle magnetic-
     card feel) while lifting slightly and picking up a soft brand-blue
     glow, and the big avatar photo tilts the opposite way and zooms in,
     so it reads as sitting just above the card surface (a bit more zoom
     than before now that the photo fills the whole card). The name/role/
     bio/social reveal itself is plain CSS (`group-hover`, see the JSX
     below) — this tilt is a separate, purely decorative layer on top of
     it. GSAP rather than CSS because it's reacting continuously to
     cursor position (`onMouseMove`), not just a fixed enter/leave state.
     Skipped under prefers-reduced-motion — the card keeps its plain CSS
     `hover:shadow-2xl` in that case (the CSS reveal still works either
     way).
  ========================================================= */
  const handleCardMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relY = (event.clientY - bounds.top) / bounds.height - 0.5;

    gsap.to(card, {
      rotateY: relX * 16,
      rotateX: relY * -16,
      y: -6,
      transformPerspective: 700,
      transformOrigin: "center",
      boxShadow: "0 24px 48px -20px rgba(20, 80, 212, 0.45)",
      duration: 0.5,
      ease: "power2.out",
    });

    const avatar = card.querySelector<HTMLElement>("[data-leader-avatar]");
    if (avatar) {
      gsap.to(avatar, {
        rotateY: relX * -10,
        rotateX: relY * 10,
        scale: 1.12,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  };

  const handleCardLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const card = event.currentTarget;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      y: 0,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      duration: 0.6,
      ease: "power3.out",
    });

    const avatar = card.querySelector<HTMLElement>("[data-leader-avatar]");
    if (avatar) {
      gsap.to(avatar, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.5, ease: "power3.out" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="leadership"
      aria-labelledby="leadership-heading"
      className={cx(
        "relative overflow-hidden py-16 md:py-24",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-gray-50")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="container relative mx-auto px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <span
              className={cx(
                "inline-block w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide",
                theme?.eyebrowBg ?? "bg-blue-50",
                theme?.eyebrowText ?? "text-blue-700"
              )}
            >
              {eyebrow}
            </span>
            <DynamicHeading level={resolveHeadingLevel(copy?.fields.headingLevel, "h2")}
              ref={headingRef}
              id="leadership-heading"
              className={cx(
                "mt-4 text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[40px]",
                theme?.heading ?? "text-gray-900"
              )}
            >
              {heading}
            </DynamicHeading>
          </div>
          <div
            className={cx(
              "rich-text text-[15px] leading-relaxed lg:col-span-5 lg:col-start-8",
              theme?.body ?? "text-gray-500"
            )}
          >
            {description}
          </div>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
              className="group relative z-1 aspect-[3/4] overflow-hidden rounded-2xl border border-black/5 transition-shadow duration-300 hover:shadow-2xl"
            >
              {/* Big avatar photo (or initials gradient) fills the whole
                  card — `data-leader-avatar` is what the tilt hover above
                  zooms/counter-tilts. */}
              {leader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                <img
                  data-leader-avatar
                  src={leader.avatarUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  data-leader-avatar
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1450d4] to-[#2d7dfa] text-[56px] font-extrabold text-white"
                >
                  {initialsFromName(leader.name)}
                </div>
              )}

              {/* Bottom scrim — always present so the name/role stay
                  readable over the photo, deepens slightly on hover to
                  keep the revealed bio/socials readable too. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-colors duration-300 group-hover:from-black/95"
              />

              {/* Name/role sit at the bottom edge at rest; bio + socials
                  stay collapsed (grid-rows 0fr) until hover, then expand
                  open — this is the "big photo first, name + social link
                  on hover" reveal, done in plain CSS so it needs no
                  measured height and still works under
                  prefers-reduced-motion (it's a disclosure, not a motion
                  effect). */}
              <div className="absolute inset-x-0 bottom-0 z-1 p-6 text-white">
                <p className="text-[18px] font-bold">{leader.name}</p>
                <p className="mt-0.5 text-[11px] font-bold tracking-wide text-white/85 uppercase">
                  {leader.role}
                </p>

                <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out group-hover:mt-3 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                  <div className="overflow-hidden">
                    <p className="text-[13px] leading-relaxed text-white/90">
                      {leader.bio}
                    </p>
                    {leader.socials.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {leader.socials.map((social) => (
                          <Link
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={social.label}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/100 bg-white/80 text-[11px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
                          >
                            {social.iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                              <img
                                src={social.iconUrl}
                                alt=""
                                aria-hidden
                                className="h-4 w-4 object-contain"
                              />
                            ) : (
                              social.label.slice(0, 2)
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
