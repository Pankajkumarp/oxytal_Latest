"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GTM_ID } from "@/app/lib/gtm";

/**
 * Pushes a `page_view` event (with the path + query string) to GTM's
 * `dataLayer` on **every** page load — the very first one (including a
 * hard refresh) and every client-side route change after it.
 *
 * Next.js App Router navigations (`<Link>`, `router.push`, etc.) use the
 * History API without a full page reload, so a GTM container whose tags
 * trigger on the built-in "All Pages" (Page View) trigger only ever fires
 * once, for the very first page a visitor lands on, then silently stops
 * firing for every page they navigate to afterwards.
 *
 * This event is a *separate* signal from that built-in trigger, not a
 * substitute limited to the routes it misses — so it has to fire on the
 * initial load too, not just later route changes: a GTM trigger configured
 * to match this custom `page_view` event (the standard SPA setup, and what
 * this app's tags should use — see the "Required environment variables"
 * section of CLAUDE.md) only ever hears about pages sent here. An earlier
 * version of this component skipped the first push on the assumption that
 * `gtm.js`'s own initial-load firing already covered it, which left a
 * `page_view`-triggered tag never firing on a fresh visit or Ctrl+F5 at
 * all — those two triggers don't share pageviews between them.
 *
 * (`gtm.js` does separately patch `history.pushState`/`replaceState` and
 * push its own `gtm.historyChange` event on every route change, but that
 * only drives tags using a **History Change** trigger, which most
 * containers don't have configured. Point a GTM trigger at the custom
 * event `page_view` pushed here instead — a Custom Event trigger, or your
 * GA4 configuration tag's own trigger — to fire on every page reliably.)
 *
 * Renders nothing; a no-op when GTM isn't configured (`GTM_ID` unset, see
 * `app/lib/gtm.ts`). Wrapped in its own `Suspense` boundary because
 * `useSearchParams` requires one during static prerendering (see
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`)
 * — kept isolated here so that boundary doesn't force the rest of whatever
 * layout mounts this into client-side rendering too.
 */
function GTMPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !window.dataLayer) return;

    const query = searchParams.toString();
    window.dataLayer.push({
      event: "page_view",
      page_path: query ? `${pathname}?${query}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GTMPageView() {
  if (!GTM_ID) return null;

  return (
    <Suspense fallback={null}>
      <GTMPageViewTracker />
    </Suspense>
  );
}
