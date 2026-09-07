"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GTM_ID } from "@/app/lib/gtm";

/**
 * Pushes a `page_view` event (with the new path + query string) to GTM's
 * `dataLayer` on every **client-side** route change.
 *
 * Next.js App Router navigations (`<Link>`, `router.push`, etc.) use the
 * History API without a full page reload, so `gtm.js`'s own default
 * pageview handling — which only fires once, off the initial page load —
 * never sees any route change after that first one. Without this, a GTM
 * container whose tags trigger on the built-in "All Pages" (Page View)
 * trigger only ever fires for the very first page a visitor lands on, and
 * silently stops firing for every page they navigate to afterwards.
 *
 * (`gtm.js` does patch `history.pushState`/`replaceState` itself and push a
 * `gtm.historyChange` event on every route change, but that only drives
 * tags in the container that use a **History Change** trigger — most
 * containers only have the default Page View trigger. Pushing an explicit
 * `page_view` event here is the reliable, container-config-independent
 * fix: point a GTM trigger at the custom event `page_view` — e.g. a Custom
 * Event trigger, or your GA4 configuration tag's trigger — to have it fire
 * on every route change.)
 *
 * Skips the very first pageview since `gtm.js`'s own initial load already
 * accounts for it (see `GoogleTagManagerScript` in `GoogleTagManager.tsx`);
 * pushing it here too would double-count that first page.
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
  const isFirstPageview = useRef(true);

  useEffect(() => {
    if (isFirstPageview.current) {
      isFirstPageview.current = false;
      return;
    }

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
