/**
 * The site's own absolute origin, with no trailing slash — every place in
 * this app that needs to build an absolute URL (each root layout's
 * `metadataBase`, the slug page's/`page-not-found`'s OpenGraph `url`
 * fields, `sitemap.xml`'s entries, `robots.txt`'s `Sitemap:` directive,
 * and a few components' hardcoded contact-CTA fallback link) used to
 * hardcode the literal string `"https://www.oxytal.com"` directly, once
 * per file. That meant every one of them pointed at production even
 * when running `npm run dev` or a preview deploy, and changing the
 * domain later would have meant hunting down every occurrence by hand.
 *
 * Reads `NEXT_PUBLIC_SITE_URL` (see `.env.local` — set to
 * `http://localhost:3000/` for local dev) and falls back to the
 * production domain when it's unset, so a deploy that forgets to
 * configure it still gets a correct URL rather than `undefined` leaking
 * into production metadata. Trailing slash(es) are stripped so every
 * call site can safely do `` `${SITE_URL}/some-path` `` without risking a
 * doubled `//`.
 *
 * `NEXT_PUBLIC_` (rather than a server-only env var) so this is also
 * safe to read from a `"use client"` component — see `app/ui/HomeAI.tsx`/
 * `Home404.tsx`/`ServicesPage.tsx`'s own contact-link fallback. Next.js
 * inlines `NEXT_PUBLIC_*` vars into the client bundle at build time, so
 * this works identically on the server and in the browser.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oxytal.com"
).replace(/\/+$/, "");
