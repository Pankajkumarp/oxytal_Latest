/**
 * Normalizes a `navType` field value ("dark"/"light", free text and
 * case-insensitive) to exactly one of those two — falls back to "light"
 * for an unset or unrecognized value, since most sections on this site
 * default to a light background, so a section that forgets to set this
 * is more likely to end up legible (dark nav text) than not.
 *
 * Shared between `ComposableElementRenderer` (a `composableElement`'s
 * own `navType`) and `PageBody` (the bare `dataVideo`/`dataText`/
 * `dataImage`/`bannerImage` body blocks' own `navType`) — both stamp the
 * result onto their rendered block's wrapper as a `data-nav-contrast`
 * attribute, which `Navbar.tsx`'s own scroll handler reads to decide
 * whether its logo/icons render white or dark (see that file's "NAV
 * CONTRAST" comment for the mechanism).
 */
export function resolveNavContrast(value?: string): "dark" | "light" {
  return value?.trim().toLowerCase() === "dark" ? "dark" : "light";
}
