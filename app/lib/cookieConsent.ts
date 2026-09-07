/**
 * Whether the cookie-consent banner (`vanilla-cookieconsent`, wired up in
 * `app/ui/CookieConsent.tsx`) should run at all. Reads
 * `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED` so it can be switched off per
 * environment (e.g. a preview/staging deploy) without a code change or
 * redeploy of different source.
 *
 * Defaults to **enabled** — only the literal string `"false"` turns it off
 * — so an environment that forgets to set the var still ships the consent
 * banner rather than silently going without one.
 *
 * `NEXT_PUBLIC_` (rather than a server-only var) so this is readable from
 * `CookieConsent.tsx`'s `"use client"` component, the same reasoning
 * `app/lib/siteUrl.ts`'s `SITE_URL` documents for its own env var. Next.js
 * inlines `NEXT_PUBLIC_*` vars into the client bundle at build time, so
 * this resolves identically on the server and in the browser.
 */
export const COOKIE_CONSENT_ENABLED =
  process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED !== "false";
