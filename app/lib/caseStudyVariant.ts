/**
 * Shared between `CaseStudyDetail.tsx` (a `"use client"` component) and
 * `CaseStudyDetailSection.tsx` (a Server Component) — a plain utility
 * function like this can't live inside a `"use client"` module and still
 * be *called* from server code: Next.js compiles every export of a
 * client-boundary file for the client runtime, so a Server Component
 * invoking it directly (not just rendering it as JSX) throws at request
 * time. Living here instead, in a module with no `"use client"` directive,
 * makes it a plain function either side can import and call normally.
 */

export type Variant = "reel" | "editorial" | "bento";

/** Normalizes a free-text layout value (from `composableElement.isFor`, or `contentDetail.layoutVariant` as a fallback — case/whitespace can vary either way) to one of the 3 supported designs. Defaults to "editorial" for an unset or unrecognized value. */
export function resolveVariant(value?: string): Variant {
  const normalized = value?.trim().toLowerCase();
  return normalized === "reel" || normalized === "bento" ? normalized : "editorial";
}
