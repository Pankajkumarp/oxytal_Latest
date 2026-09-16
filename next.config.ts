import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Lets app/global-not-found.tsx handle genuinely unmatched URLs. This
    // app has two independent root layouts (app/(content)/[[...slug]]/layout.tsx
    // and app/(content)/page-not-found/layout.tsx), and Next.js can't compose
    // a normal app/(content)/not-found.tsx boundary across multiple root
    // layouts — it silently falls back to its own generic built-in 404 UI
    // instead (see node_modules/next/dist/docs/.../not-found.md, "This can
    // happen in two cases: Your app has multiple root layouts..."). This flag
    // is the documented workaround for exactly that case.
    globalNotFound: true,
  },

  /**
   * Config-level redirects, handled by Vercel's edge routing layer directly
   * — unlike `proxy.ts` (removed; see app/(content)/[[...slug]]/page.tsx),
   * these don't invoke a Middleware/Function execution at all, so they're
   * free with respect to the Vercel Function/Middleware invocation quotas.
   *
   * This app used to serve every content page through a `[locale]` dynamic
   * segment, with `proxy.ts` rewriting every locale-less request (e.g. `/`,
   * `/about`) to `/en-US/...` behind the scenes so it could match that route
   * folder. That rewrite was invisible to visitors — the address bar always
   * showed the bare path, never `/en-US/...` — and every canonical URL/
   * sitemap entry in this app already used bare paths, so no legitimate
   * visitor, backlink, or search index entry should ever be pointing at an
   * `/en-US/...` URL. `[locale]` has since been removed (the app only ever
   * queries Contentful with a hardcoded `"en-US"` regardless of any URL
   * segment, so the dynamic segment wasn't doing anything real), and pages
   * are now served directly at their bare path via `app/(content)/
   * [[...slug]]/page.tsx`. This redirect is just a safety net in case some
   * external link or bookmark from that era still points at an `/en-US/...`
   * URL — without it, such a request would 404 instead of resolving.
   */
  async redirects() {
    return [
      {
        source: "/en-US/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
