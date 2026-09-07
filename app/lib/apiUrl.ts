/**
 * The Oxytal API's absolute origin, with no trailing slash — used to build
 * endpoint URLs like the contact form's `` `${API_URL}/jobs/contactus` ``
 * (see `app/ui/ContactFormInfo.tsx`'s `submitContactEnquiry`).
 *
 * Reads `NEXT_PUBLIC_API_URL` (see `.env.local`) and falls back to the
 * production API when it's unset, matching `app/lib/siteUrl.ts`'s own
 * `SITE_URL` fallback pattern for the same reason: a deploy/dev environment
 * that forgets to set it still gets a working URL rather than `undefined`
 * leaking into a `fetch` call. Trailing slash(es) are stripped so every
 * call site can safely do `` `${API_URL}/some-path` `` without risking a
 * doubled `//`.
 *
 * `NEXT_PUBLIC_` (rather than a server-only var) so this is also safe to
 * read from a `"use client"` component — `ContactFormInfo.tsx` submits
 * directly from the browser, not through a Next.js API route. Next.js
 * inlines `NEXT_PUBLIC_*` vars into the client bundle at build time, so
 * this resolves identically on the server and in the browser.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://www.api.oxyem.io"
).replace(/\/+$/, "");
