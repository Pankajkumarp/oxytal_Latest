import Script from "next/script";
import { GTM_ID } from "@/app/lib/gtm";

/**
 * Google Tag Manager, wired for Google Consent Mode v2 so it respects the
 * `vanilla-cookieconsent` banner (`app/ui/CookieConsent.tsx`) instead of
 * firing analytics/ads tags before a visitor has actually consented.
 *
 * Two pieces, both no-ops when `GTM_ID` (`app/lib/gtm.ts`,
 * `NEXT_PUBLIC_GTM_ID`) is unset:
 *
 * - `GoogleTagManagerScript` — first sets Consent Mode's default state to
 *   "denied" and defines the `window.gtag` stub, via a `beforeInteractive`
 *   script (Next.js always injects `beforeInteractive` scripts into `<head>`
 *   ahead of everything else, regardless of where the component is placed in
 *   JSX — see `node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md`),
 *   then loads `gtm.js` itself via `afterInteractive`, Next's recommended
 *   strategy for tag managers. Because the default state is set first,
 *   GTM's own consent-aware tags (and any tag with "additional consent
 *   checks" configured in the container) start out blocked. Consent is then
 *   only relaxed when `CookieConsent.tsx` calls `window.gtag('consent',
 *   'update', ...)` from its `onFirstConsent`/`onConsent`/`onChange`
 *   callbacks, in response to the visitor's actual choice.
 * - `GoogleTagManagerNoScript` — the `<noscript>` fallback iframe from
 *   Google's own snippet, for visitors with JavaScript disabled (who by
 *   definition never see or interact with the consent banner either).
 *
 * Both are mounted in the same three places as `CookieConsentBanner` —
 * `app/(content)/[locale]/layout.tsx`, `app/(content)/page-not-found/layout.tsx`,
 * and `app/global-not-found.tsx` — see that component's doc comment for why
 * this app has three root layouts.
 */
export function GoogleTagManagerScript() {
  if (!GTM_ID) return null;

  return (
    <>
      <Script id="gtm-consent-defaults" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ window.dataLayer.push(arguments); }
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500
          });
        `}
      </Script>
      <Script id="gtm-container" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
    </>
  );
}

/** The `<noscript>` GTM fallback iframe — render immediately after `<body>`. */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height={0}
        width={0}
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
