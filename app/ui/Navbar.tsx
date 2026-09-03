"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import {
  DataImageSkeleton,
  DataLinkSkeleton,
  HeaderNavigationSkeleton,
  NavLinkSkeleton,
  NavMenuItemSkeleton,
  NavMenuSkeleton,
} from "../types/contentful";
import Link from "next/link";

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

type MegaEntry = {
  title: string;
  desc: string;
  href?: string;
};

type MegaMenu = {
  key: string;
  label: string;
  eyebrow: string;
  intro: string;
  menuType: "megaMenu" | "dropdown" | "SimpleLink";
  columns: MegaEntry[][];
  /**
   * For `menuType: "SimpleLink"` this is the item's only destination.
   * For `menuType: "megaMenu" | "dropdown"` it's optional: when set, the
   * top-level label itself becomes a link (desktop) alongside its
   * existing hover-to-open panel — see the desktop nav render below.
   */
  href?: string;
  cta: {
    tag: string;
    title: string;
    desc: string;
    linkLabel: string;
    href?: string;
  };
};

/**
 * Normalizes a nav item's own free-text `href` field (on `navLink`/
 * `navMenu`/`navMenuItem` — unlike `dataLink`, these have no separate
 * `linkedPage`/`externalUrl` split, just one plain Symbol an editor
 * types straight into) to an absolute path. Without this, an editor
 * typing "about-us" instead of "/about-us" renders as a *relative*
 * `<Link>` href — the browser then resolves it against the current
 * page's own path, so clicking it from `/service/digital-strategy`
 * lands on `/service/about-us` instead of `/about-us`. Leaves absolute
 * URLs (`http(s)://`, `mailto:`, `tel:`), in-page anchors (`#...`), and
 * already-absolute paths (`/...`) untouched.
 */
function normalizeNavHref(href: string | undefined): string | undefined {
  if (!href) {
    return href;
  }

  return /^(https?:|mailto:|tel:|#|\/)/i.test(href) ? href : `/${href}`;
}

/** Maps a resolved `navMenuItem` entry to one `MegaEntry`. */
function navMenuItemToMegaEntry(
  entry: PlainEntry<NavMenuItemSkeleton>
): MegaEntry {
  return {
    title: entry.fields.title ?? "",
    desc: entry.fields.description ?? "",
    href: normalizeNavHref(entry.fields.href),
  };
}

/**
 * Groups a `navMenu`'s flat `items` list into columns by each item's own
 * `column` number (1, 2, 3…) — no separate "column" entries needed.
 * Items with no `column` set default to column 1. Columns come out
 * ordered ascending by number; item order within a column follows the
 * order they're listed in Contentful.
 */
function groupItemsByColumn(
  items: PlainEntry<NavMenuItemSkeleton>[]
): MegaEntry[][] {
  const byColumn = new Map<number, MegaEntry[]>();

  for (const item of items) {
    const column = item.fields.column ?? 1;
    const group = byColumn.get(column) ?? [];
    group.push(navMenuItemToMegaEntry(item));
    byColumn.set(column, group);
  }

  return Array.from(byColumn.keys())
    .sort((a, b) => a - b)
    .map((column) => byColumn.get(column)!);
}

const MENU_TYPES = ["megaMenu", "dropdown"] as const;

/** `navMenu.menuType` is free text in Contentful — normalizes to one of `MENU_TYPES`, falling back to "megaMenu" for anything unrecognized. */
function resolveMenuType(value: unknown): "megaMenu" | "dropdown" {
  return (MENU_TYPES as readonly string[]).includes(value as string)
    ? (value as "megaMenu" | "dropdown")
    : "megaMenu";
}

/** Maps a resolved `navMenu` entry to one expandable `MegaMenu`. */
function navMenuEntryToMegaMenu(
  entry: PlainEntry<NavMenuSkeleton>
): MegaMenu {
  const items = (entry.fields.items ?? []).filter(
    (item): item is PlainEntry<NavMenuItemSkeleton> =>
      isEntry(item) && item.sys.contentType.sys.id === "navMenuItem"
  );

  return {
    key: entry.sys.id,
    label: entry.fields.label ?? "",
    eyebrow: entry.fields.eyebrow ?? "",
    intro: entry.fields.intro ?? "",
    menuType: resolveMenuType(entry.fields.menuType),
    columns: groupItemsByColumn(items),
    href: normalizeNavHref(entry.fields.href),
    cta: {
      tag: entry.fields.ctaTag ?? "",
      title: entry.fields.ctaTitle ?? "",
      desc: entry.fields.ctaDescription ?? "",
      linkLabel: entry.fields.ctaLinkLabel ?? "",
      href: normalizeNavHref(entry.fields.ctaLinkHref),
    },
  };
}

/** Maps a resolved `navLink` entry — placed directly in the nav's `items` array — to a simple, non-expanding `MegaMenu`. */
function navLinkToSimpleMenu(entry: PlainEntry<NavLinkSkeleton>): MegaMenu {
  return {
    key: entry.sys.id,
    label: entry.fields.label ?? "",
    eyebrow: "",
    intro: "",
    menuType: "SimpleLink",
    columns: [],
    href: normalizeNavHref(entry.fields.href),
    cta: { tag: "", title: "", desc: "", linkLabel: "" },
  };
}

/**
 * Builds the top nav's `MegaMenu[]` from the `headerNavigation` entry
 * fetched via `getNavigation()` (see app/lib/contentEntry.ts): each item
 * in its `items` array is either a plain `navLink` (renders as a simple
 * link) or a `navMenu` (renders as an expandable mega-menu/dropdown, see
 * `navMenuEntryToMegaMenu`). Falls back to `DEFAULT_MEGA_MENUS` when no
 * entry is passed in yet (or it has no `items`) — swap/add real nav items
 * in Contentful, nothing here needs to change.
 */
function buildMenus(
  entry: PlainEntry<HeaderNavigationSkeleton> | null | undefined
): MegaMenu[] {
  const items = entry?.fields.items ?? [];

  if (!items.length) {
    return DEFAULT_MEGA_MENUS;
  }

  return items.map((item) => {
    if (isEntry(item) && item.sys.contentType.sys.id === "navMenu") {
      return navMenuEntryToMegaMenu(item as unknown as PlainEntry<NavMenuSkeleton>);
    }

    return navLinkToSimpleMenu(item as unknown as PlainEntry<NavLinkSkeleton>);
  });
}

/**
 * Placeholder roster, used only until a real "Header Navigation"
 * `dataNavigation` entry is set up in Contentful (see `getNavigation` in
 * app/lib/contentEntry.ts and `buildMenus` above).
 */
const DEFAULT_MEGA_MENUS: MegaMenu[] = [];

interface SocialLink {
  /** The `dataLink` entry's own `sys.id` (or a fixed literal for `DEFAULT_SOCIAL_LINKS`) — used as the React list key instead of `label`, since two entries could share the same label. */
  id: string;
  label: string;
  href: string;
  iconUrl?: string;
}

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>` — same resolution `Footer`/`PageBody`/`HomeAboutUs` use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : "#";
}

/** Maps a resolved `dataLink` entry to the plain `SocialLink` shape this component renders — same `icon`/href resolution `Footer`'s own `socialLinks` uses. */
function dataLinkToSocialLink(entry: PlainEntry<DataLinkSkeleton>): SocialLink {
  const iconEntry = entry.fields.icon;

  return {
    id: entry.sys.id,
    label: entry.fields.label ?? "",
    href: resolveLinkHref(entry),
    iconUrl: isEntry(iconEntry)
      ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
      : undefined,
  };
}

/** Recognized platform name → its homepage, matched against a `dataImage`'s label (substring, case-insensitive), since a bare `dataImage` has no `externalUrl` field to hold a real link. */
const PLATFORM_HREFS: Array<{ test: RegExp; href: string }> = [
  { test: /twit|(?:^|\s)x(?:\s|$)/i, href: "https://x.com" },
  { test: /facebook/i, href: "https://facebook.com" },
  { test: /linkedin/i, href: "https://linkedin.com" },
  { test: /instagram/i, href: "https://instagram.com" },
  { test: /youtube/i, href: "https://youtube.com" },
  { test: /github/i, href: "https://github.com" },
  { test: /dribbble/i, href: "https://dribbble.com" },
  { test: /tiktok/i, href: "https://tiktok.com" },
];

/** Maps a resolved bare `dataImage` entry (an editor linked the icon image directly, skipping a wrapping `dataLink`) to the plain `SocialLink` shape this component renders. There's no `externalUrl` field on this shape to read a real destination from, so the href is a best-effort guess at the platform's homepage from the entry's label — falls back to "#" for an unrecognized label. */
function dataImageToSocialLink(entry: PlainEntry<DataImageSkeleton>): SocialLink {
  const rawLabel = entry.fields.altText ?? entry.fields.systemTitle ?? "";
  // Trims a trailing "Icon"/"Icons" word some editors include in the
  // asset's own title/alt text (e.g. "Twiter Icon") — just for a cleaner
  // aria-label; the platform match below runs against `rawLabel` either
  // way since the "Icon" suffix doesn't affect the substring test.
  const label = rawLabel.replace(/\s*icons?$/i, "").trim() || rawLabel;

  return {
    id: entry.sys.id,
    label,
    href: PLATFORM_HREFS.find(({ test }) => test.test(rawLabel))?.href ?? "#",
    iconUrl: getAssetUrl(entry.fields.image),
  };
}

/** Builds the nav's social-icon roster from the `headerNavigation` entry's own `socialLinks` field — each entry can be either a `dataLink` or a bare `dataImage` (see `dataImageToSocialLink`). Renders nothing when the field is unset/empty — no hardcoded placeholder roster. */
function buildSocialLinks(
  entry: PlainEntry<HeaderNavigationSkeleton> | null | undefined
): SocialLink[] {
  return (entry?.fields.socialLinks ?? [])
    .filter(
      (
        link
      ): link is PlainEntry<DataLinkSkeleton> | PlainEntry<DataImageSkeleton> =>
        isEntry(link)
    )
    .map((link) =>
      link.sys.contentType.sys.id === "dataImage"
        ? dataImageToSocialLink(link as unknown as PlainEntry<DataImageSkeleton>)
        : dataLinkToSocialLink(link as unknown as PlainEntry<DataLinkSkeleton>)
    );
}

/**
 * True when a mega-menu/dropdown item actually has entries to show in its
 * panel. A `navMenu` entry can exist in Contentful with `menuType` set to
 * "megaMenu"/"dropdown" but no `items` linked yet (or none assigned to a
 * column) — without this check, hovering it (desktop) or expanding it
 * (mobile) rendered an empty bordered panel with nothing inside.
 */
function hasMenuContent(menu: MegaMenu): boolean {
  return menu.columns.some((col) => col.length > 0);
}

/**
 * True when a mega menu's highlighted CTA card actually has something to
 * show. Contentful lets `ctaTag`/`ctaTitle`/`ctaDescription`/`ctaLinkLabel`
 * go unset on a `navMenu` entry — without this check, `MegaPanel` (and its
 * mobile counterpart) rendered the CTA's colored card/link with nothing
 * but an empty heading, paragraph and arrow icon inside.
 */
function hasCtaContent(cta: MegaMenu["cta"]): boolean {
  return Boolean(cta.tag || cta.title || cta.desc || cta.linkLabel);
}

// `hasCta` picks between two fully literal class strings per column count
// (rather than string-concatenating the `_340px` segment in) so Tailwind's
// static scan of this file's source still finds each arbitrary-value
// class it needs to generate — see the `dataVideo` comment in
// app/types/contentful.ts for the same constraint on generated classes.
function gridColsClass(count: number, hasCta: boolean) {
  if (count === 1) {
    return hasCta
      ? "md:grid-cols-[275px_1fr_340px]"
      : "md:grid-cols-[275px_1fr]";
  }

  if (count === 2) {
    return hasCta
      ? "md:grid-cols-[275px_1fr_1fr_340px]"
      : "md:grid-cols-[275px_1fr_1fr]";
  }

  return hasCta
    ? "md:grid-cols-[275px_1fr_1fr_1fr_340px]"
    : "md:grid-cols-[275px_1fr_1fr_1fr]";
}

/* =========================================================
   MEGA MENU
========================================================= */

function MegaPanel({ menu, theme }: { menu: MegaMenu; theme?: SectionTheme }) {
  const hasCta = hasCtaContent(menu.cta);

  return (
    <div
      className={`grid grid-cols-1 gap-8 ${gridColsClass(
        menu.columns.length,
        hasCta
      )} p-6 md:p-11 md:pb-12`}
    >
      {/* Intro */}
      <div>
        <span
          className={cx(
            "inline-block rounded-full px-0  text-[18px] tracking-wide",
            theme?.eyebrowText ?? "text-emerald-700"
          )}
        >
          {menu.eyebrow}
        </span>

        <p
          className={cx(
            "mt-1 max-w-[300px] text-[15.6px] leading-snug",
            theme?.body ?? "text-gray-500"
          )}
        >
          {menu.intro}
        </p>
      </div>

      {/* Columns */}
      {menu.columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-6">
          {col.map((entry) => (
            <Link
              key={entry.title}
              href={entry.href ?? "#"}
              className={cx(
                "-m-2 block rounded-lg p-2 transition-colors",
                theme ? "hover:opacity-70" : "hover:bg-gray-50"
              )}
            >
              <span
                className={cx(
                  "text-[18px] block",
                  theme?.link ?? "text-gray-900"
                )}
              >
                {entry.title}
              </span>

              <p
                className={cx(
                  "mt-1 text-[12.6px] leading-snug",
                  theme?.body ?? "text-gray-500"
                )}
              >
                {entry.desc}
              </p>
            </Link>
          ))}
        </div>
      ))}

      {/* CTA — only rendered when there's actual tag/title/desc/linkLabel
          content (`hasCta`); otherwise this card had nothing but an empty
          heading, paragraph and arrow icon inside. */}
      {hasCta && (
        <div
          className={cx(
            "flex flex-col rounded-2xl p-6 md:p-7",
            theme?.buttonBg ?? "bg-emerald-600",
            theme?.buttonText ?? "text-white"
          )}
        >
          <div
            className={cx(
              "mb-3.5 text-[11.5px] tracking-wider opacity-80",
              theme?.buttonText ?? "text-emerald-100"
            )}
          >
            {menu.cta.tag}
          </div>

          <span className="mb-3 text-xl tracking-tight block">
            {menu.cta.title}
          </span>

          <p
            className={cx(
              "mb-6 text-[13.5px] leading-relaxed opacity-80",
              theme?.buttonText ?? "text-emerald-50"
            )}
          >
            {menu.cta.desc}
          </p>

          <Link
            href={menu.cta.href ?? "#"}
            className={cx(
              "group mt-auto inline-flex items-center gap-1.5 text-sm",
              theme?.buttonText ?? "text-emerald-100"
            )}
          >
            {menu.cta.linkLabel}

            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SIMPLE DROPDOWN
========================================================= */

function DropdownPanel({ menu, theme }: { menu: MegaMenu; theme?: SectionTheme }) {
  return (
    <div
      className={cx(
        "top-5 w-[280px] border p-2 shadow-xs",
        theme?.cardBorder ?? "border-gray-100",
        // Uses `sectionBg` (the same field the opened nav bar's own
        // background uses — see `navOpen &&` below) rather than `cardBg`:
        // `cardBg` is near-identical white across every "vision" preset,
        // so the panel wouldn't visibly pick up the selected theme at all
        // otherwise. Matches `MegaPanel`'s wrapper for the same reason.
        theme?.sectionBg ?? "bg-white"
      )}
    >
      {menu.columns.flat().map((entry) => (
        <Link
          key={entry.title}
          href={entry.href ?? "#"}
          className={cx(
            "block rounded-lg px-4 py-3 transition-colors",
            theme ? "hover:opacity-70" : "hover:bg-gray-50"
          )}
        >
          <div
            className={cx(
              "text-[14px] font-semibold",
              theme?.heading ?? "text-gray-900"
            )}
          >
            {entry.title}
          </div>

          <div
            className={cx(
              "mt-1 text-[12.5px] leading-snug",
              theme?.body ?? "text-gray-500"
            )}
          >
            {entry.desc}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* =========================================================
   NAVBAR
========================================================= */

interface Props {
  /**
   * The `headerNavigation` entry, fetched via `getNavigation()` (see
   * app/lib/contentEntry.ts) and passed down from the page:
   * - `items` builds the nav menus (`buildMenus`) — falls back to
   *   `DEFAULT_MEGA_MENUS` when omitted/not set up yet
   * - `socialLinks` (a `dataLink[]`, same shape as `Footer`'s own
   *   `socialLinks`) builds the social-icon row (`buildSocialLinks`)
   *   shown next to "Contact us" on desktop and in the mobile slide-out
   *   panel — renders no icons when unset/empty
   */
  entry?: PlainEntry<HeaderNavigationSkeleton> | null;
}

export default function Navbar({ entry }: Props) {
  const menus = buildMenus(entry);
  const socialLinks = buildSocialLinks(entry);

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to the nav's link/hover/mega-panel/CTA-card colors.
  // `undefined` for an unset or unrecognized value, in which case every
  // themed class below falls back to the nav's own existing default look
  // (today's look, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [navOpen, setNavOpen] = useState(false);

  const [navHidden, setNavHidden] = useState(false);

  // Which section is currently sitting behind the fixed desktop nav —
  // "dark" renders the logo/toggle icon white, "light" renders them
  // dark. See the NAV CONTRAST effect below for how this gets computed;
  // starts "light" (dark text) as the safer guess for the first paint
  // before that effect has had a chance to run.
  const [navContrast, setNavContrast] = useState<"dark" | "light">("light");

  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navRef = useRef<HTMLElement>(null);

  const desktopNavRef = useRef<HTMLUListElement>(null);

  const desktopActionsRef = useRef<HTMLDivElement>(null);

  const lastScrollYRef = useRef(0);

  const scrollTickingRef = useRef(false);

  /* Open menu */
  const openMenu = (key: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    setActiveMenu(key);
  };

  /* Delayed close */
  const closeMenuDelayed = () => {
    closeTimer.current = setTimeout(() => {
      setActiveMenu(null);
    }, 120);
  };

  /* Close on outside click / Escape */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        navRef.current &&
        !navRef.current.contains(e.target as Node)
      ) {
        setActiveMenu(null);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setNavOpen(false);
        setMobileExpanded(null);
      }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Hide navbar on scroll down, show on scroll up. Stays visible near the
     top of the page. Scrolling down only slides the bar off-screen
     (`navHidden`) — it does NOT close the inline desktop reveal
     (`navOpen`), so scrolling back up brings the nav back in whatever
     open/closed state it was already in, instead of forcing it back to
     collapsed. An open mega/dropdown panel (`activeMenu`) still closes on
     scroll-down, though — its position is pinned to a specific nav
     button, so leaving it "active" while the bar itself slides off (and
     back on) would either block the hide or reappear mispositioned.
     Reads scroll position via requestAnimationFrame so it doesn't run a
     state update on every single scroll event.

     NAV CONTRAST — the fixed nav (see `<nav>` below) has no background
     of its own in its normal collapsed state, so it always sits
     transparently over whatever page content has scrolled underneath
     it. Each `composableElement` section carries its own `navType`
     ("dark"/"light", stamped as a `data-nav-contrast` attribute on its
     wrapper by `ComposableElementRenderer` — see that file), so on every
     scroll tick this samples the actual DOM element rendered just below
     the nav's own bottom edge (`document.elementFromPoint`, at a y
     coordinate the nav itself can't be covering) and walks up
     (`closest`) to the nearest section that declared one. Falls back to
     "light" when no such section is found (e.g. the very top of a page
     with no composableElement yet, or a bare `dataText`/`dataImage`
     body block, which doesn't carry this attribute) — same "assume
     light unless told otherwise" reasoning `resolveNavContrast`'s own
     doc comment uses. */
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function updateNavContrast() {
      if (typeof document === "undefined" || !navRef.current) {
        return;
      }

      const probeY = navRef.current.getBoundingClientRect().bottom + 2;
      const probeX = window.innerWidth / 2;
      const elementBelowNav = document.elementFromPoint(probeX, probeY);
      const section = elementBelowNav?.closest<HTMLElement>("[data-nav-contrast]");

      setNavContrast(section?.dataset.navContrast === "dark" ? "dark" : "light");
    }

    function onScroll() {
      if (scrollTickingRef.current) {
        return;
      }

      scrollTickingRef.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY < 80) {
          setNavHidden(false);
        } else if (currentY > lastScrollYRef.current) {
          setNavHidden(true);
          setActiveMenu(null);
        } else if (currentY < lastScrollYRef.current) {
          setNavHidden(false);
        }

        lastScrollYRef.current = currentY;
        scrollTickingRef.current = false;

        updateNavContrast();
      });
    }

    // Runs once on mount too — otherwise the very first section (e.g. a
    // dark hero at scrollY 0) wouldn't get picked up until the user's
    // first scroll event.
    updateNavContrast();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateNavContrast, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateNavContrast);
    };
  }, []);

  /* Lock body scroll — only for the full-screen mobile/tablet panel, not
     the inline desktop reveal (which doesn't cover the page). */
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    document.body.style.overflow = navOpen && !isDesktop ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  /* Desktop reveal animation — the nav links + "Contact us" are hidden by
     default on desktop (only the hamburger shows); opening them fades/slides
     the same markup in with a stagger instead of an instant display toggle. */
  useLayoutEffect(() => {
    if (!navOpen) {
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    if (!isDesktop) {
      return;
    }

    const targets = [
      ...(desktopNavRef.current
        ? Array.from(desktopNavRef.current.children)
        : []),
      desktopActionsRef.current,
    ].filter((el): el is Element => el !== null);

    if (!targets.length) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power3.out",
          stagger: 0.06,
          // Animating `y` makes GSAP set an inline `transform` on each
          // target — including every nav <li>. Left in place, that
          // transform (even resolved to an identity translate(0,0)) makes
          // the <li> a CSS containing block for any `position: absolute`
          // descendant, which silently breaks the mega-menu panel's
          // full-width sizing (`w-[100%]`/`left-1/2` end up resolving
          // against the tiny <li> instead of the full-width <nav>).
          // Clearing it once the tween finishes restores the <li> to
          // position:static with no transform, so that sizing correctly
          // bubbles up to <nav> again.
          clearProps: "transform",
        }
      );
    });

    return () => ctx.revert();
  }, [navOpen]);

  return (
    <>
      <nav
        aria-label="Main navigation"
        ref={navRef}
        className={cx(
          "top-0 z-50 w-full px-5 py-4 transition-transform duration-300 md:px-10 fixed",
          navOpen && (theme?.sectionBg ?? "bg-white"),
          navHidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div
          className={cx(
            "container mx-auto flex items-center justify-between",
            // Desktop 3-column layout — logo (left), nav links (center,
            // truly centered via the `1fr` middle track rather than just
            // whatever space is left after the logo/socials), socials
            // (right). Below lg this stays the plain 2-item flex row
            // (logo left, hamburger right) it always was — the grid only
            // ever applies at the `lg` breakpoint. Any column with no
            // visible content (nav/socials are both `hidden` outside the
            // `navOpen` reveal) just collapses to empty space, so the
            // closed state still renders as logo-only, left-aligned.
            "lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6"
          )}
        >
          {/* =================================================
            LOGO
        ================================================= */}
          <div className="flex items-center gap-4">
            {/* =================================================
            NAV TOGGLE — visible at every breakpoint. Below lg it opens the
            full-screen mobile menu; on lg+ it reveals the inline desktop
            nav/actions above instead.
        ================================================= */}
            {navOpen ? (null) : (
              <button
                type="button"
                className={cx(
                  "flex items-center justify-center rounded-lg p-2 hidden lg:block cursor-pointer",
                  navContrast === "dark" ? "text-white" : "text-gray-900"
                )}
                onClick={() => setNavOpen((v) => !v)}
                aria-label={navOpen ? "Close menu" : "Open menu"}
              >
                {navOpen ? '' : <Menu size={24} />}
              </button>
            )}
            <Link
              href="/"
              className={cx(
                "flex items-center text-[30px]  tracking-tight",
                navOpen
                  ? (theme?.heading ?? "text-gray-900")
                  : navContrast === "dark"
                    ? "text-white"
                    : "text-gray-900"
              )}
            >
              Oxytal
            </Link>
          </div>

          {/* =================================================
            DESKTOP NAV — hidden by default; the hamburger button
            (visible at every breakpoint) toggles `navOpen`, which
            reveals this exact markup on lg+ via the GSAP effect above.
            Its own grid column (the middle `1fr` track) centers it
            between the logo and the socials, instead of sitting flush
            against the logo.
        ================================================= */}
          <ul
            ref={desktopNavRef}
            className={`hidden items-center justify-center gap-1.5 ${navOpen ? "lg:flex" : "lg:hidden"
              }`}
          >
            {menus.map((menu) => {
              /*
               * SimpleLink does NOT have a dropdown.
               */
              if (menu.menuType === "SimpleLink") {
                return (
                  <li key={menu.key}>
                    <Link
                      href={menu.href ?? "#"}
                      className={cx(
                        "block rounded-lg px-3.5 py-2.5 text-[17px] font-medium transition-colors",
                        theme?.link ?? "text-gray-900",
                      )}
                    >
                      {menu.label}
                    </Link>
                  </li>
                );
              }

              /*
               * MegaMenu / Dropdown
               */
              // Whether this item actually has items to show — a `navMenu`
              // entry can be set to "megaMenu"/"dropdown" in Contentful with
              // no `items` linked yet. When false, hovering/clicking is a
              // no-op and no panel (nor its chevron toggle) renders at all,
              // instead of an empty bordered box popping open onto nothing.
              const hasContent = hasMenuContent(menu);

              return (
                <li
                  key={menu.key}
                  className={menu.menuType === "megaMenu" ? "" : "relative"}
                  onMouseEnter={() => hasContent && openMenu(menu.key)}
                  onMouseLeave={closeMenuDelayed}
                >
                  {/* When the top-level item has its own `href` (set in
                      Contentful), the label is a real link — clicking it
                      navigates — while the panel still opens on hover
                      (`onMouseEnter` above) or via the separate chevron
                      toggle. With no `href`, this stays the original
                      single, non-navigating toggle button. Either way the
                      chevron/toggle only renders when `hasContent`. */}
                  {menu.href ? (
                    <div
                      className={cx(
                        "flex items-center gap-1 rounded-lg pl-3.5 pr-2 py-2.5 text-[17px] font-medium transition-colors",
                        theme?.link ?? "text-gray-900",
                      )}
                    >
                      <Link href={menu.href}>{menu.label}</Link>

                      {hasContent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setActiveMenu((current) =>
                              current === menu.key ? null : menu.key
                            );
                          }}
                          aria-label={`Toggle ${menu.label} menu`}
                          className="flex items-center p-1.5"
                        >
                          <ChevronDown
                            size={13}
                            className={`transition-transform duration-200 ${activeMenu === menu.key ? "rotate-180" : ""
                              }`}
                          />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (!hasContent) {
                          return;
                        }

                        setActiveMenu((current) =>
                          current === menu.key ? null : menu.key
                        );
                      }}
                      className={cx(
                        "flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-[14.5px] font-medium transition-colors",
                        theme?.link ?? "text-gray-900",
                      )}
                    >
                      {menu.label}

                      {hasContent && (
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${activeMenu === menu.key ? "rotate-180" : ""
                            }`}
                        />
                      )}
                    </button>
                  )}

                  {/* =================================================
                      MENU CONTENT — only rendered when there's actually
                      something to show (`hasContent`); see its comment
                      above.
                  ================================================= */}
                  {hasContent && (
                    <div
                      className={`absolute left-1/2  -translate-x-1/2 pt-0 transition-all duration-150 ${menu.menuType === "megaMenu" ? "w-[100%] top-full" : "top-[142%]"} ${activeMenu === menu.key
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1.5 opacity-0"
                        }`}
                    >
                      {/* MEGA MENU — the outer wrapper (`w-[100%]` above)
                          already spans <nav>'s full width, so this just
                          needs to fill 100% of that; no separate `w-screen`
                          (100vw), which used to overflow past the true
                          viewport width by the scrollbar's width. */}
                      {menu.menuType === "megaMenu" && (
                        <div
                          className={cx(
                            "border-b shadow-xs",
                            theme?.cardBorder ?? "border-gray-100",
                            // Same `sectionBg` field (not `cardBg`) as
                            // `DropdownPanel`'s wrapper and the opened nav
                            // bar itself — see the comment there.
                            theme?.sectionBg ?? "bg-white"
                          )}
                        >
                          <MegaPanel menu={menu} theme={theme} />
                        </div>
                      )}

                      {/* SIMPLE DROPDOWN */}
                      {menu.menuType === "dropdown" && (
                        <DropdownPanel menu={menu} theme={theme} />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* =================================================
            DESKTOP RIGHT — same hidden-by-default / navOpen-reveals pattern
            as the desktop nav above. Its own grid column (the trailing
            `auto` track) pins it to the right edge.
        ================================================= */}

          <button
            type="button"
            className={cx(
              "flex items-center justify-center rounded-lg p-2 block lg:hidden",
              navOpen
                ? (theme?.heading ?? "text-gray-900")
                : navContrast === "dark"
                  ? "text-white"
                  : "text-gray-900"
            )}
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? "Close menu" : "Open menu"}
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div
            ref={desktopActionsRef}
            className={`hidden items-center justify-end gap-3.5 ${navOpen ? "lg:flex" : "lg:hidden"
              }`}
          >
            {/* Social icons — from the `headerNavigation` entry's own
              `socialLinks` field, same icon/href resolution `Footer`'s own
              social row uses. */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={cx(
                    "flex h-8 w-8 items-center justify-center text-[10px] font-bold transition-colors",
                    theme?.link ?? "text-gray-900",
                    theme ? "hover:opacity-70" : "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  )}
                >
                  {social.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={social.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    social.label.slice(0, 2)
                  )}
                </Link>
              ))}


            </div>
          </div>
          {navOpen ? (<button
            type="button"
            className={cx(
              "flex items-center justify-center rounded-lg p-2 hidden lg:block cursor-pointer text-black absolute right-2 top-2"
            )}
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? "Close menu" : "Open menu"}
          >
            {navOpen ? <X size={18} /> : ''}
          </button>) : (
            null
          )}
        </div>
      </nav>

      {/* =================================================
        MOBILE MENU — rendered as a sibling of <nav>, not a descendant.
        <nav> always has an active `translate` (from `translate-y-0`/
        `-translate-y-full`), and per spec any non-"none"
        `translate`/`transform`/etc. makes an element the containing
        block for its `position: fixed`/`absolute` descendants —
        regardless of the element's own `position`. Nesting this
        `fixed` panel inside <nav> made it size against nav's own
        ~77px box instead of the viewport (`top-[65px]` + `bottom-0`
        resolved to a ~12px sliver instead of spanning to the bottom
        of the screen). Keeping it outside <nav> avoids that hijack
        entirely, regardless of whatever transform/translate classes
        <nav> itself ends up with.
    ================================================= */}
      <nav 
      aria-label="Bottom navigation"
        className={cx(
          "fixed inset-x-0 top-[65px] bottom-0 z-40 overflow-y-auto transition-transform duration-200 lg:hidden",
          theme?.sectionBg ?? "bg-white",
          navOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {menus.map((menu) => {
            /*
             * SimpleLink on mobile
             */
            if (menu.menuType === "SimpleLink") {
              return (
                <Link
                  key={menu.key}
                  href={menu.href ?? "/"}
                  className={cx(
                    "border-b py-3.5 text-[15px] font-semibold",
                    theme?.cardBorder ?? "border-gray-100",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  {menu.label}
                </Link>
              );
            }

            /*
             * MegaMenu / Dropdown on mobile
             */
            // Same emptiness check as the desktop nav above — no items
            // linked yet means nothing to expand into.
            const hasContent = hasMenuContent(menu);

            return (
              <div
                key={menu.key}
                className={cx("border-b", theme?.cardBorder ?? "border-gray-100")}
              >
                <div
                  className={cx(
                    "flex w-full items-center justify-between py-3.5 text-[15px] font-semibold",
                    theme?.heading ?? "text-gray-900"
                  )}
                >
                  <Link href={menu.href || ""}>
                  {menu.label}
                  </Link>

                  {hasContent && (
                    <ChevronDown
                       onClick={() => {
                    if (!hasContent) {
                      return;
                    }

                    setMobileExpanded((current) =>
                      current === menu.key
                        ? null
                        : menu.key
                    );
                  }}
                      size={16}
                      className={`transition-transform ${mobileExpanded === menu.key
                          ? "rotate-180"
                          : ""
                        }`}
                    />
                  )}
                </div>

                {hasContent && mobileExpanded === menu.key && (
                  <div className="pb-5 pl-1">
                    {/* =========================================
                      MOBILE MEGA MENU
                  ========================================= */}
                    {menu.menuType === "megaMenu" && (
                      <div className="flex flex-col gap-4">
                        {menu.columns.flat().map((entry) => (
                          <Link
                            key={entry.title}
                            href={entry.href ?? "#"}
                            className="block"
                          >
                            <div
                              className={cx(
                                "text-[14.5px] font-medium leading-[1.8]",
                                theme?.link ?? "text-gray-900"
                              )}
                            >
                              {entry.title}
                            </div>

                            <div
                              className={cx(
                                "text-[13px]",
                                theme?.body ?? "text-gray-500"
                              )}
                            >
                              {entry.desc}
                            </div>
                          </Link>
                        ))}

                        {hasCtaContent(menu.cta) && (
                          <Link
                            href={menu.cta.href ?? "#"}
                            className={cx(
                              "mt-1 inline-flex items-center gap-1.5 text-[14px] font-bold",
                              theme?.accentText ?? "text-emerald-600"
                            )}
                          >
                            {menu.cta.linkLabel}

                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* =========================================
                      MOBILE DROPDOWN
                  ========================================= */}
                    {menu.menuType === "dropdown" && (
                      <div className="flex flex-col gap-3">
                        {menu.columns.flat().map((entry) => (
                          <Link
                            key={entry.title}
                            href={entry.href ?? "#"}
                            className={cx(
                              "block rounded-lg px-2 py-2",
                              theme ? "hover:opacity-70" : "hover:bg-gray-50"
                            )}
                          >
                            <div
                              className={cx(
                                "text-[14px] font-semibold",
                                theme?.heading ?? "text-gray-900"
                              )}
                            >
                              {entry.title}
                            </div>

                            <div
                              className={cx(
                                "mt-0.5 text-[12.5px]",
                                theme?.body ?? "text-gray-500"
                              )}
                            >
                              {entry.desc}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* =================================================
            MOBILE ACTIONS
        ================================================= */}
          <div className="mt-5 flex flex-col gap-4">
            {/* Social icons — same roster/resolution as the desktop row
              above, sized up slightly for touch on the mobile panel. */}
            <div className="flex items-center justify-center gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={cx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                    theme?.link ?? "text-gray-900",
                    theme ? "hover:opacity-70" : "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  )}
                >
                  {social.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img
                      src={social.iconUrl}
                      alt=""
                      aria-hidden
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    social.label.slice(0, 2)
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
