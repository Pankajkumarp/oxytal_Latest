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

/**
 * `window.dataLayer`/`window.gtag` are defined at runtime by
 * `GoogleTagManagerScript`'s `beforeInteractive` script (see
 * `app/ui/GoogleTagManager.tsx`) — declared here once, rather than in each
 * of `app/ui/CookieConsent.tsx` and `app/ui/GTMPageView.tsx`, since a
 * `declare global` augmentation applies project-wide regardless of which
 * file it lives in.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
