"use client";

import { useEffect } from "react";
import { GTM_ID } from "@/app/lib/gtm";

/**
 * Pushes a `nav_link_click` or `footer_link_click` event (with the
 * clicked link's text and href) to GTM's `dataLayer` whenever a visitor
 * clicks a link inside the site's `<nav>` (`Navbar.tsx` — both the
 * desktop bar and its `aria-label="Bottom navigation"` mobile panel are
 * `<nav>` elements) or `<footer>` (`Footer.tsx`).
 *
 * A single delegated `document`-level click listener rather than
 * instrumenting each individual `<Link>` in either component: between
 * mega-menu items, socials, the mobile nav panel, footer nav columns,
 * contact links, and bottom links, those two components render dozens of
 * links, most of them Contentful-driven (an editor can add more at any
 * time) — delegation tracks all of them, present and future, with no
 * further code changes needed as content changes.
 *
 * Renders nothing; a no-op when GTM isn't configured (`GTM_ID` unset —
 * see `app/lib/gtm.ts`). Mounted in the same three root layouts as
 * `GoogleTagManagerScript`/`GTMPageView`.
 */
export default function GTMLinkTracking() {
  useEffect(() => {
    if (!GTM_ID) return;

    function onClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!anchor) return;

      const location = anchor.closest("nav")
        ? "navbar"
        : anchor.closest("footer")
          ? "footer"
          : null;
      if (!location) return;

      if (typeof window === "undefined" || !window.dataLayer) return;

      window.dataLayer.push({
        event: location === "navbar" ? "nav_link_click" : "footer_link_click",
        link_text: anchor.textContent?.trim().slice(0, 200) ?? "",
        link_url: anchor.getAttribute("href") ?? "",
      });
    }

    // Capture phase isn't needed here — `click` bubbles, and neither
    // Navbar nor Footer calls `stopPropagation()` on their links.
    document.addEventListener("click", onClick);

    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
