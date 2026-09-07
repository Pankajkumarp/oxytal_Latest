import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The only locale Contentful is currently queried with (see
// app/lib/contentEntry.ts). Update this if more locales are added.
const DEFAULT_LOCALE = "en-US";

/**
 * The `(content)/[locale]/[[...slug]]` route requires a locale segment, so a
 * bare `/` (or any other locale-less path) doesn't match that route and 404s.
 * Rewrite locale-less requests to the default locale so `/` renders the same
 * "home" page as `/en-US` (and `/en-US/home`), without changing the URL the
 * visitor sees.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale =
    pathname === `/${DEFAULT_LOCALE}` ||
    pathname.startsWith(`/${DEFAULT_LOCALE}/`);

  if (hasLocale) {
    return;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, requests for files (e.g. /favicon.ico,
  // /globe.svg), and Next's code-generated metadata routes (app/icon.tsx,
  // app/apple-icon.tsx, app/sitemap.ts, app/robots.ts, and any future
  // opengraph-image.tsx/twitter-image.tsx) — these serve at a bare path
  // with no file extension (e.g. /icon, not /icon.png), so the "has a
  // dot" file check above doesn't catch them; without this they were
  // rewritten to /en-US/icon (which doesn't exist) and 404ed, breaking the
  // favicon site-wide.
  //
  // `page-not-found` also has to be excluded: it's a real route, but its
  // page.tsx lives at app/(content)/page-not-found/page.tsx — a sibling of
  // app/(content)/[locale]/, not nested inside it — so unlike every other
  // path here, it does NOT gain a locale segment. Without this exclusion it
  // was rewritten to /en-US/page-not-found, which matches nothing under
  // [locale]'s catch-all route, so Next silently fell through to its generic
  // app-level not-found handling (wrong title, no metadata) instead of this
  // route's own page/generateMetadata.
  //
  // `404` is deliberately NOT excluded (unlike the two above): there is no
  // dedicated `/404` route anymore (that page.tsx/layout.tsx were removed
  // in favor of `/page-not-found` and `app/global-not-found.tsx`), so a
  // bare `/404` request needs the same locale rewrite as any other path.
  // Excluding it used to skip the rewrite entirely, which meant `/404`
  // itself matched `[locale]/[[...slug]]` directly with `locale="404"`
  // and an *empty* catch-all `slug` — indistinguishable from requesting
  // the bare `/` home page, since this app hardcodes `"en-US"` for every
  // Contentful query rather than reading the `locale` param (see
  // app/(content)/[locale]/[[...slug]]/page.tsx). That silently served the
  // full home page with a 200 status at `/404` instead of a real 404 —
  // rewriting it to `/en-US/404` now makes it resolve through the normal
  // `getPageBySlug("404", ...)` lookup and 404 boundary like any other
  // unmatched slug.
  matcher: ["/((?!_next|api|page-not-found|icon|apple-icon|opengraph-image|twitter-image|.*\\..*).*)"],
};
