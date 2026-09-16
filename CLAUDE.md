@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

There is no test suite configured in this repo.

### Required environment variables

The Contentful client (`app/lib/contentful.ts`) reads these at import time with non-null assertions, so `npm run dev`/`npm run build` will fail or throw at request time without them (set in `.env.local`, not committed):

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ACCESS_TOKEN`
- `CONTENTFUL_ENV_ID`

`NEXT_PUBLIC_SITE_URL` (also `.env.local`, e.g. `http://localhost:3000/` for local dev) is read by `app/lib/siteUrl.ts`'s `SITE_URL` export — the site's absolute origin, used everywhere an absolute URL is needed (both root layouts' `metadataBase`, the slug/page-not-found pages' OpenGraph `url`, `sitemap.xml`, `robots.txt`'s `Sitemap:` directive, and a few components' contact-CTA fallback link). Not required in the same fail-hard sense as the Contentful vars — `SITE_URL` falls back to the production domain when it's unset — but the production deploy should still set it explicitly to the real domain rather than relying on that fallback.

`NEXT_PUBLIC_COOKIE_CONSENT_ENABLED` (also `.env.local`) is read by `app/lib/cookieConsent.ts`'s `COOKIE_CONSENT_ENABLED` export, which gates whether `app/ui/CookieConsent.tsx` (the `vanilla-cookieconsent` banner, mounted in every root layout) calls `CookieConsent.run()` at all. Defaults to enabled — only the literal string `"false"` turns it off — so leaving it unset still ships the consent banner.

`NEXT_PUBLIC_GTM_ID` (also `.env.local`, e.g. `GTM-XXXXXXX`) is read by `app/lib/gtm.ts`'s `GTM_ID` export. `app/ui/GoogleTagManager.tsx`'s `GoogleTagManagerScript`/`GoogleTagManagerNoScript` (mounted in every root layout, next to `CookieConsentBanner`) both render nothing when it's unset, so GTM is opt-in per environment. When set, GTM is wired to Google Consent Mode v2: a `beforeInteractive` script sets the default consent state to "denied" before `gtm.js` loads, and `CookieConsentBanner` calls `window.gtag('consent', 'update', ...)` from its `onFirstConsent`/`onConsent`/`onChange` callbacks to reflect the visitor's actual "analytics" choice — so consult that container's own tag/trigger consent settings before treating a tag as automatically compliant.

`app/ui/GTMPageView.tsx` (mounted next to the pieces above, in the same three root layouts) pushes a `page_view` event to `dataLayer` on every client-side route change, since `gtm.js`'s own pageview handling only fires once off the initial load — Next.js App Router navigations don't trigger a full page reload. A GTM container's default "All Pages" trigger only reacts to that first load, so any tag meant to fire per page needs its own trigger pointed at this `page_view` custom event (or the `page_path` variable it carries) rather than relying on the built-in Page View trigger.

`app/ui/GTMLinkTracking.tsx` (mounted next to the other GTM pieces, same three root layouts) pushes a `nav_link_click`/`footer_link_click` event (with the clicked link's text/href) to `dataLayer` whenever a visitor clicks a link inside `Navbar.tsx`'s `<nav>` or `Footer.tsx`'s `<footer>`. It's one delegated `document` click listener rather than an `onClick` on each individual `<Link>` — both components render many links, most of them Contentful-driven, so delegation tracks new ones automatically. Point a GTM trigger at these event names (or the `link_text`/`link_url` variables) to fire tags on them.

`NEXT_PUBLIC_API_URL` (also `.env.local`, e.g. `https://www.api.oxyem.io/`) is read by `app/lib/apiUrl.ts`'s `API_URL` export — the Oxytal API's absolute origin. Falls back to the production API when unset, matching `SITE_URL`'s own fallback pattern above. `app/ui/ContactFormInfo.tsx`'s `submitContactEnquiry` is the only current caller: it `POST`s the intake form's JSON payload straight to `` `${API_URL}/oxytal/contactus` `` from the browser (no Next.js API route in between) — that call remains the source of truth for whether an enquiry was received at all.

`AWS_SES_REGION`/`AWS_SES_ACCESS_KEY_ID`/`AWS_SES_SECRET_ACCESS_KEY`/`AWS_SES_FROM_EMAIL` (server-only — no `NEXT_PUBLIC_` prefix, since these hold real AWS credentials that must never reach the browser) and `CONTACT_ADMIN_EMAIL` (defaults to `info@oxytal.com` when unset) are read by `app/lib/ses.ts`, which sends two notification emails once `submitContactEnquiry` above has already succeeded: a "your request is submitted, we'll be in touch within one working day" confirmation to the visitor, and an internal notification listing everything they submitted to `CONTACT_ADMIN_EMAIL`. `app/ui/ContactFormInfo.tsx`'s `handleSubmit` triggers this by POSTing to `app/api/contact/route.ts` (a Next.js Route Handler, since SES needs credentials that can't live in client code) — that request is fire-and-forget: its success or failure never affects the success screen the visitor already sees, since the Oxytal API call is the real submission and this is only a best-effort follow-up. Leave the AWS vars unset and `sendContactEmails` logs a warning and skips sending rather than throwing, so the form keeps working before SES is configured. Getting real email flowing also requires verifying `AWS_SES_FROM_EMAIL` (or its domain) as a sender identity in AWS SES, and — while the SES account is still in the sandbox — either requesting production access or verifying every recipient address too.

## Architecture

This is a Next.js App Router site (Oxytal marketing site) whose page content is fetched from **Contentful** at request time rather than authored as static JSX.

### Content-driven routing

- `app/(content)/[locale]/[[...slug]]/page.tsx` is the catch-all route that renders every Contentful-backed page. The slug segments are joined into a path (empty slug → `"home"`), then looked up via `getPageBySlug(path, "en-US")`. Note the locale param is accepted in the URL but the page currently hardcodes `"en-US"` when querying Contentful rather than using it.
- `app/lib/contentEntry.ts` holds the Contentful query functions (`getPageBySlug`, `getFooter`); `app/lib/contentful.ts` creates the shared `contentful` client. New content queries should go in `contentEntry.ts` and reuse that client.
- `app/types/contentful.ts` defines content-type shapes as `EntrySkeletonType`s (e.g. `PageSkeleton`, `ImageSkeleton`) for use with the typed `client.getEntries<T>()` calls. Add a new skeleton type here whenever a new Contentful content type is queried.
- `generateMetadata` in the slug page derives SEO/OpenGraph/Twitter metadata directly from the fetched Contentful entry's `metaTitle`/`metaDescription`/`metaImage` fields; asset URLs from Contentful are protocol-relative and must be prefixed with `https:`.
- If no matching entry is found, the page calls `notFound()`.

### Multiple root layouts via route groups

The `(content)` route group contains two independent root layouts (each defines its own `<html>`/`<body>`), a deliberate use of the Next.js "multiple root layouts" pattern rather than a single shared `app/layout.tsx`:

- `app/(content)/[locale]/layout.tsx` — root layout for all locale/slug content pages: sets up the `Poppins` font and the default site-wide `Metadata` (title template, OpenGraph/Twitter defaults, `metadataBase`).
- `app/(content)/[locale]/[[...slug]]/layout.tsx` — a nested pass-through layout inside `[locale]` (no `<html>`/`<body>`; just renders `children`).
- `app/(content)/404/layout.tsx` — a separate root layout (own font setup, own `<head>` favicon/preconnect links) used only by the `/404` page.
- `app/(content)/not-found.tsx` is the group's `not-found` convention file; instead of rendering inline UI it `redirect()`s to `/404`, which is a real page with its own layout above.

There is no top-level `app/layout.tsx` or `app/page.tsx` — the originals from `create-next-app` were removed in favor of the content-driven structure above.

### UI

- `app/ui/Navbar.tsx` is a client component (`"use client"`) with its mega-menu/dropdown navigation structure (`MEGA_MENUS`) currently hardcoded in the component rather than sourced from Contentful.
- Styling is Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config`; theme tokens are declared inline in `app/globals.css` with `@theme inline`). The `Poppins` variable font is wired through `--font-poppins` and applied via `font-sans`/`body`.
- Path alias `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/app/ui/Navbar`.
