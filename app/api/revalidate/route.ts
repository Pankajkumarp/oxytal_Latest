import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * On-demand cache invalidation, meant to be called by a Contentful webhook
 * (Settings > Webhooks in the Contentful space) on Entry publish/unpublish/
 * delete. This is the *primary* way a Contentful change reaches the live
 * site: `REVALIDATE_SECONDS` (see app/lib/contentEntry.ts) is intentionally
 * set to 24 hours, a safety net rather than the expected path — this
 * endpoint is what actually makes a change visible immediately. If a
 * webhook call is ever missed, content only then falls back to
 * self-healing within that 24h window instead of staying stale forever.
 *
 * `proxy.ts`'s matcher explicitly excludes `api` from its locale rewrite,
 * so this route is reachable at the plain `/api/revalidate` path, not
 * `/en-US/api/revalidate`.
 *
 * Every `unstable_cache`-wrapped query in app/lib/contentEntry.ts is
 * already tagged with one of `TAGS` below. Revalidating all of them on
 * every call (rather than trying to map Contentful's webhook payload to
 * the one tag that actually changed) is deliberately simple: this site's
 * Contentful traffic is low enough that "revalidate everything on any
 * publish" costs nothing meaningful, and it stays correct even if a
 * content type's tag mapping changes later.
 *
 * `{ expire: 0 }` (rather than `revalidateTag(tag, "max")`) is the form
 * Next's own docs recommend specifically for "webhooks or third-party
 * services that need immediate expiration" (see
 * node_modules/next/dist/docs/.../revalidateTag.md) — the alternative,
 * `"max"`, only marks data stale and waits for the next visit to actually
 * refetch, which doesn't fit "reflect the change right now".
 *
 * `revalidateTag` alone marks the underlying *data* stale, but doesn't by
 * itself force an already fully static page's *built HTML* to
 * regenerate — that only happens once the page's own render actually
 * re-executes. Traced empirically: `/[locale]/[[...slug]]` (dynamic, `ƒ`
 * in the build output) re-renders on every request, so it picks up a
 * revalidated tag immediately; `/page-not-found` and `/_not-found`
 * (static, `○`) don't re-render at all once built, and kept serving the
 * old HTML through repeated `revalidateTag` calls in testing. Hence the
 * explicit `revalidatePath` calls below, covering both of this app's
 * independent root layouts (see PageBody/layout doc comments on why
 * there are two): `/` under `[locale]/layout.tsx` for every real content
 * page plus its own not-found boundary, and `/page-not-found` under its
 * own separate root layout. `global-not-found.tsx` (`/_not-found`) isn't
 * a normal file-route path `revalidatePath` can target directly — it
 * only refreshes via its own 24h window or the next deploy; low-stakes,
 * since it's the generic top-level 404 fallback rather than content
 * anyone edits often.
 *
 * Protected by a shared secret so this doesn't become a public "force
 * everyone's cache to reset" button: set `CONTENTFUL_REVALIDATE_SECRET`
 * in `.env.local` (and in your hosting platform's env vars for
 * production), then configure the Contentful webhook to call
 * `https://<your-domain>/api/revalidate?secret=<that same value>`.
 */
const TAGS = ["page", "footer", "navigation", "case-study"];

/** The two independent root layout trees this app can statically prerender under — see the doc comment above. */
const LAYOUT_PATHS = ["/", "/page-not-found"];

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CONTENTFUL_REVALIDATE_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { revalidated: false, message: "Invalid or missing secret" },
      { status: 401 }
    );
  }

  for (const tag of TAGS) {
    revalidateTag(tag, { expire: 0 });
  }

  for (const path of LAYOUT_PATHS) {
    revalidatePath(path, "layout");
  }

  return NextResponse.json({ revalidated: true, tags: TAGS, paths: LAYOUT_PATHS });
}
