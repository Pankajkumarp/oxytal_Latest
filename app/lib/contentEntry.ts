import { unstable_cache } from "next/cache";
import { client } from "./contentful";
import {
  ContentDetailSkeleton,
  FooterSkeleton,
  HeaderNavigationSkeleton,
  PageSkeleton,
} from "../types/contentful";

/**
 * How long (in seconds) a Contentful query result stays cached before the
 * next request triggers a fresh fetch, in the absence of any other signal.
 * Set to 24 hours (86400s) — deliberately long, because the *real*
 * invalidation mechanism is the Contentful webhook calling
 * `app/api/revalidate` on publish/unpublish/delete (see that route's own
 * doc comment), which expires the relevant tags immediately. This number
 * only matters if a webhook call is ever missed (wrong secret after a
 * redeploy, Contentful's webhook temporarily failing, a misconfigured
 * trigger, etc.) — it's a safety net so a missed webhook call self-heals
 * within a day instead of leaving stale content live indefinitely with no
 * symptom until someone happens to notice.
 */
const REVALIDATE_SECONDS = 60 * 60 * 24;

/**
 * In-flight promise map, keyed by a query's own `keyParts` + its
 * arguments. `unstable_cache` (used below) persists a *completed* result
 * across requests, but two calls that both start before either has
 * finished will both miss that persisted cache and each fire their own
 * Contentful request — exactly what happens on every single page view
 * here, since `generateMetadata` and the page component both call e.g.
 * `getPageBySlug` with the same arguments, concurrently rather than one
 * waiting on the other (confirmed by tracing actual Contentful calls while
 * diagnosing an API-quota overage: both calls reached the network before
 * either's result had been cached). This map catches that race: the
 * second concurrent call reuses the first call's in-flight promise
 * instead of starting a duplicate one.
 *
 * This app has no `cacheComponents` flag in `next.config.ts` (see the
 * "Caching (Previous Model)" guide in `node_modules/next/dist/docs`), so
 * React's own `cache()` — which *would* coalesce this for a plain
 * `fetch()`-based data layer — isn't reliably in play either; it dedupes
 * calls sharing one render's AsyncLocalStorage scope, and
 * `generateMetadata` doesn't reliably share that scope with the page
 * component here. Combining a plain module-level map (for the concurrent
 * race) with `unstable_cache` (for reuse across *separate*, non-concurrent
 * requests) covers both cases without depending on that scope.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Running counts of real Contentful hits since this server process
 * started — `liveFetchTotal` across every query, `liveFetchCountsByQuery`
 * broken out per query (keyed by `keyParts.join(":")`, e.g. "page-by-slug"
 * or "footer"). Both are printed as part of the `[contentful] live fetch`
 * log line in `cachedQuery` below, so "how many real API calls has this
 * process made" is always visible in the terminal without adding any
 * separate instrumentation.
 *
 * These reset to 0 on every server restart (in-memory only, not persisted
 * anywhere) and, on a platform that runs multiple server instances, each
 * instance keeps its own counts rather than a combined total — so treat
 * this as "how much is this one process generating", not as a stand-in
 * for Contentful's own dashboard total.
 */
let liveFetchTotal = 0;
const liveFetchCountsByQuery = new Map<string, number>();

/**
 * Wraps `fn` in `unstable_cache` (persists results across requests, keyed
 * by `keyParts` + arguments — see `REVALIDATE_SECONDS`) and, on top of
 * that, in the `inFlight` map above (coalesces concurrent calls with the
 * same arguments into a single underlying request). Every exported query
 * function in this file goes through this instead of calling
 * `unstable_cache` directly.
 *
 * The `contentful` SDK doesn't use Next's extended `fetch`, so none of
 * this happens automatically the way it would for a plain `fetch()` call
 * (see generateMetadata's own docs on fetch memoization) — hence wrapping
 * every exported function here explicitly.
 *
 * `fn` is only ever actually invoked on a genuine cache miss — that's
 * what `unstable_cache` guarantees — so the `console.log` right before
 * calling it is a reliable, low-noise way to see real Contentful traffic
 * happening: run `npm run build && npm run start`, then reload the site a
 * few times within `REVALIDATE_SECONDS` of each other and watch the
 * server's terminal output. One `[contentful] live fetch: ...` line per
 * query per revalidate window is the caching working as intended; a line
 * printing on every single reload means something regressed. (This
 * doesn't apply under `npm run dev` — Next intentionally never caches
 * page renders in development, so every reload logs regardless of this
 * code; see the "Good to know" note on route segment `revalidate` in
 * `node_modules/next/dist/docs/.../caching-without-cache-components.md`.)
 */
function cachedQuery<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: { revalidate: number; tags: string[] }
): (...args: Args) => Promise<T> {
  const namespace = keyParts.join(":");

  const fetchAndLog = (...args: Args): Promise<T> => {
    liveFetchTotal += 1;
    const queryTotal = (liveFetchCountsByQuery.get(namespace) ?? 0) + 1;
    liveFetchCountsByQuery.set(namespace, queryTotal);

    const label = args.length ? `${namespace} ${JSON.stringify(args)}` : namespace;
    console.log(
      `[contentful] live fetch #${liveFetchTotal} total (#${queryTotal} for this query) — ${label}`
    );
    return fn(...args);
  };

  const cached = unstable_cache(fetchAndLog, keyParts, options);

  return function query(...args: Args): Promise<T> {
    const key = `${namespace}:${JSON.stringify(args)}`;

    const existing = inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const promise = cached(...args).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
  };
}

/**
 * The site footer's `footer` entry (see app/types/contentful.ts). Only one
 * should ever exist, but `limit: 1` is a safety net either way, same
 * convention as `getNavigation`.
 *
 * `include: 3` resolves the nesting Footer needs: footer -> dataLink ->
 * icon (dataImage) — 2 levels deep, so 3 leaves headroom.
 */
export const getFooter = cachedQuery(
  async function getFooter() {
    const { items } = await client.getEntries<FooterSkeleton>({
      content_type: "footer",
      include: 3,
      limit: 1,
    });

    return items[0] ?? null;
  },
  ["footer"],
  { revalidate: REVALIDATE_SECONDS, tags: ["footer"] }
);

/**
 * The header nav's `headerNavigation` entry (a dedicated content type
 * built specifically for the nav — see app/types/contentful.ts). Only
 * one should ever exist, but `limit: 1` is a safety net either way.
 *
 * `include: 3` resolves the nesting Navbar needs: headerNavigation ->
 * navMenu -> items (navMenuItem) — 2 levels deep, so 3 leaves headroom.
 */
export const getNavigation = cachedQuery(
  async function getNavigation() {
    const { items } = await client.getEntries<HeaderNavigationSkeleton>({
      content_type: "headerNavigation",
      include: 3,
      limit: 1,
    });

    return items[0] ?? null;
  },
  ["navigation"],
  { revalidate: REVALIDATE_SECONDS, tags: ["navigation"] }
);

/**
 * Looked up by (`slug`, `locale`) — both become part of the cache key
 * automatically (see `cachedQuery` above for why this, rather than bare
 * `cache()`, is needed to actually dedupe `generateMetadata` and the page
 * component's calls here).
 */
export const getPageBySlug = cachedQuery(
  async function getPageBySlug(slug: string, locale: string) {
    const { items } = await client.getEntries<PageSkeleton>({
      content_type: "page",
      "fields.slug": slug,
      locale,
      include: 10,
      limit: 1,
    });

    return items[0] ?? null;
  },
  ["page-by-slug"],
  { revalidate: REVALIDATE_SECONDS, tags: ["page"] }
);

/**
 * One case study's own `contentDetail` entry, looked up by its `slug`
 * field directly (not the `page` content type) — this is what
 * `/case-studies/[slug]` (see `app/(content)/case-studies/[slug]/page.tsx`)
 * renders via `CaseStudyDetail`. Reuses the same `contentDetail` entries
 * `HomeCaseStudies`/`CaseStudiesListing` already source their cards from,
 * so there's no separate "page" entry to author per case study — one
 * `contentDetail` entry backs both its listing card and its own detail
 * page.
 *
 * `include: 3` resolves the nesting the detail page needs: contentDetail
 * -> statistic -> icon (dataImage), and contentDetail -> clientLogo/
 * heroImage (dataImage) — 2 levels deep, so 3 leaves headroom.
 *
 * Same reason as `getPageBySlug` for `cachedQuery`: the slug page's
 * `generateMetadata` and page component both call this with the same slug
 * as a fallback once `getPageBySlug` misses.
 */
export const getCaseStudyBySlug = cachedQuery(
  async function getCaseStudyBySlug(slug: string) {
    const { items } = await client.getEntries<ContentDetailSkeleton>({
      content_type: "contentDetail",
      "fields.slug": slug,
      include: 3,
      limit: 1,
    });

    return items[0] ?? null;
  },
  ["case-study-by-slug"],
  { revalidate: REVALIDATE_SECONDS, tags: ["case-study"] }
);

/**
 * The 4 `category` values `contentDetail` entries use specifically for
 * case studies (added alongside the `/case-studies` listing page — see
 * `CaseStudiesListing`) — distinct from the catalog labels other
 * `contentDetail` uses (products/services) reuse for `category`, so
 * `getRelatedCaseStudies` below only ever pulls in actual case studies.
 */
const CASE_STUDY_CATEGORIES = [
  "Brand Experience",
  "Enterprise Platform",
  "AI & Automation",
  "Strategy",
];

/**
 * Up to `limit` other case-study `contentDetail` entries (excluding
 * `excludeSlug`, the one whose detail page is currently rendering) — the
 * "More case studies" grid at the bottom of `CaseStudyDetail`.
 */
export const getRelatedCaseStudies = cachedQuery(
  async function getRelatedCaseStudies(excludeSlug: string, limit: number) {
    const { items } = await client.getEntries<ContentDetailSkeleton>({
      content_type: "contentDetail",
      "fields.category[in]": CASE_STUDY_CATEGORIES,
      "fields.slug[ne]": excludeSlug,
      limit,
    });

    return items;
  },
  ["related-case-studies"],
  { revalidate: REVALIDATE_SECONDS, tags: ["case-study"] }
);

/**
 * Every `page` entry flagged `fields.published` (see `PageSkeleton` — a
 * manual editorial flag distinct from Contentful's own entry publish
 * status, unused anywhere else in this codebase today) — the full list
 * `app/sitemap.ts` maps into sitemap URLs. `limit: 1000` (Contentful's own
 * per-request cap) rather than paginated fetching, same "good enough for
 * this site's actual scale" simplicity as every other query here.
 */
export const getSitemapPages = cachedQuery(
  async function getSitemapPages() {
    const { items } = await client.getEntries<PageSkeleton>({
      content_type: "page",
      "fields.published": true,
      include: 0,
      limit: 1000,
    });

    return items;
  },
  ["sitemap-pages"],
  { revalidate: REVALIDATE_SECONDS, tags: ["page"] }
);

/**
 * Every case-study `contentDetail` entry (same `CASE_STUDY_CATEGORIES`
 * filter `getRelatedCaseStudies` uses) — the full list `app/sitemap.ts`
 * maps into `/case-studies/<slug>` sitemap URLs.
 */
export const getSitemapCaseStudies = cachedQuery(
  async function getSitemapCaseStudies() {
    const { items } = await client.getEntries<ContentDetailSkeleton>({
      content_type: "contentDetail",
      "fields.category[in]": CASE_STUDY_CATEGORIES,
      include: 0,
      limit: 1000,
    });

    return items;
  },
  ["sitemap-case-studies"],
  { revalidate: REVALIDATE_SECONDS, tags: ["case-study"] }
);
