"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { COOKIE_CONSENT_ENABLED } from "@/app/lib/cookieConsent";
// Side-effect import only, for the `Window.dataLayer`/`Window.gtag` global
// type augmentation `app/lib/gtm.ts` declares.
import "@/app/lib/gtm";

/**
 * Pushes the visitor's current "analytics" choice into Google Consent
 * Mode via the `gtag` stub that `GoogleTagManagerScript`
 * (`app/ui/GoogleTagManager.tsx`) defines before GTM loads. A no-op when
 * GTM isn't configured (`window.gtag` is never defined in that case) or
 * hasn't finished its `beforeInteractive` script yet.
 */
function updateGtagConsent() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("consent", "update", {
    analytics_storage: CookieConsent.acceptedCategory("analytics")
      ? "granted"
      : "denied",
  });
}

/**
 * Renders the `vanilla-cookieconsent` banner/preferences modal. Mounted
 * once per root layout — `app/(content)/[locale]/layout.tsx`,
 * `app/(content)/page-not-found/layout.tsx`, and
 * `app/global-not-found.tsx` — the same three places that each define
 * their own `<html>`/`<body>` (see those files' doc comments for why this
 * app has more than one root layout). Renders nothing itself; the library
 * injects its own markup into `document.body` on `CookieConsent.run()`.
 *
 * Gated on `COOKIE_CONSENT_ENABLED` (`app/lib/cookieConsent.ts`,
 * `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED`) so it can be turned off for a
 * given environment without a code change — when disabled, `run()` is
 * never called, so no consent cookie is set and no banner UI is injected.
 *
 * Only "necessary" and "analytics" categories are defined, since GTM
 * (`app/ui/GoogleTagManager.tsx`) is the only analytics/marketing
 * integration wired up so far and it's gated through Consent Mode rather
 * than a per-script `data-category` tag: `onFirstConsent`/`onConsent`/
 * `onChange` all call `updateGtagConsent()` above, which reports the
 * visitor's "analytics" choice to `gtag('consent', 'update', ...)`. Add a
 * new category here (and a matching `translations.en.preferencesModal.
 * sections` entry) before wiring up anything ads-related, rather than
 * folding it into "analytics".
 */
export default function CookieConsentBanner() {
  useEffect(() => {
    if (!COOKIE_CONSENT_ENABLED) return;

    CookieConsent.run({
      onFirstConsent: updateGtagConsent,
      onConsent: updateGtagConsent,
      onChange: updateGtagConsent,
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom left",
          equalWeightButtons: true,
        },
        preferencesModal: {
          layout: "box",
          equalWeightButtons: true,
        },
      },

      categories: {
        necessary: {
          readOnly: true,
          enabled: true,
        },
        analytics: {},
      },

      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "We use cookies",
              description:
                "We use cookies to make our site work and, with your consent, to understand how it's used so we can improve it.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Cookie preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              savePreferencesBtn: "Save preferences",
              closeIconLabel: "Close",
              sections: [
                {
                  title: "Necessary cookies",
                  description:
                    "These cookies are essential for the website to function properly and can't be switched off.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics cookies",
                  description:
                    "These cookies help us understand how visitors use the site so we can improve it. They're only set with your consent.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  return null;
}
