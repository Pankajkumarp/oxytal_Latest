/**
 * Shared resolver for `dataText.headingLevel` (and any other content
 * type with the same free-text "h1"–"h6" field) — every composableElement
 * section that renders a `dataText` entry's own `heading` used to just
 * hardcode a fixed tag (`<h2>`, `<h1>`, …) for it, silently ignoring
 * whatever level an editor picked in Contentful. This resolves that
 * field to an actual JSX tag name instead, with a per-section fallback
 * for when the field is unset (kept as each section's original hardcoded
 * level, so nothing changes until an editor deliberately picks another
 * one).
 *
 * Usage: `const HeadingTag = resolveHeadingLevel(copy?.fields.headingLevel, "h2");`
 * then render `<HeadingTag>{heading}</HeadingTag>` — a capitalized variable
 * holding a lowercase tag-name string is exactly how JSX picks a dynamic
 * native element at runtime.
 */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const HEADING_LEVELS: readonly HeadingLevel[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

export function resolveHeadingLevel(
  value: unknown,
  fallback: HeadingLevel
): HeadingLevel {
  return (HEADING_LEVELS as readonly string[]).includes(value as string)
    ? (value as HeadingLevel)
    : fallback;
}
