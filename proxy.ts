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
  // Skip Next internals, the dedicated /404 page (the redirect target of
  // not-found.tsx), requests for files (e.g. /favicon.ico, /globe.svg), and
  // Next's code-generated metadata routes (app/icon.tsx, app/apple-icon.tsx,
  // and any future opengraph-image.tsx/twitter-image.tsx) — these serve at
  // a bare path with no file extension (e.g. /icon, not /icon.png), so the
  // "has a dot" file check above doesn't catch them; without this they were
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
  matcher: ["/((?!_next|api|404|page-not-found|icon|apple-icon|opengraph-image|twitter-image|.*\\..*).*)"],
};
