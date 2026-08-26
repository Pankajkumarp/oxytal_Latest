import { ImageResponse } from "next/og";

/**
 * Site-wide browser-tab favicon — a code-generated icon (Next.js's
 * `icon.tsx` file convention; see node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/01-metadata/app-icons.md) rather
 * than a static image asset, since there's no real Oxytal logo file to
 * work from yet. A simple "O" mark in the site's own default emerald
 * accent (`--color-emerald-600`, `#059669` — see app/globals.css and
 * `theme.light`/`theme.dark`'s own `buttonBg`/`accentText` in
 * app/lib/theme.ts), easy to swap for a real logo image later by
 * replacing this file's contents (or deleting it and dropping a
 * `favicon.ico`/`icon.png` here instead — either convention works from
 * this exact path).
 *
 * Placed at the true top-level `app/` (a sibling of the `(content)`
 * route group, not inside it) so it's inherited by every route beneath
 * it — including both of this project's separate root layouts
 * (`app/(content)/[locale]/layout.tsx` and
 * `app/(content)/page-not-found/layout.tsx`) as well as the
 * layout-bypassing `app/global-not-found.tsx` — without needing to be
 * duplicated or referenced from any of them.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0092b8",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "sans-serif",
          borderRadius: 6,
        }}
      >
        O
      </div>
    ),
    { ...size }
  );
}
