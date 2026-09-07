/**
 * Google Tag Manager container ID (e.g. `"GTM-XXXXXXX"`), read from
 * `NEXT_PUBLIC_GTM_ID`. `NEXT_PUBLIC_` so it's available both to the
 * server-rendered script tags in `app/ui/GoogleTagManager.tsx` and to the
 * client-side consent-mode wiring in `app/ui/CookieConsent.tsx`, the same
 * reasoning `app/lib/cookieConsent.ts` and `app/lib/siteUrl.ts` document for
 * their own env vars.
 *
 * Empty/unset disables GTM entirely — `GoogleTagManagerScript` and
 * `GoogleTagManagerNoScript` both render nothing — rather than loading a
 * container with a blank/invalid ID.
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
