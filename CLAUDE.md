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
