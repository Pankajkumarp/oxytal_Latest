import { createElement, forwardRef, type ComponentPropsWithoutRef } from "react";
import type { HeadingLevel } from "../lib/headingLevel";

// `JSX.IntrinsicElements["h1"]` through `"h6"` all share the same prop
// shape (they're every one just `HTMLAttributes<HTMLHeadingElement>` plus
// standard DOM attributes), so borrowing "h1"'s is a stand-in for any
// level `resolveHeadingLevel` might resolve to — lets callers pass
// anything a real heading takes (`id`, `aria-*`, ...), not just
// `className`/`children`.
interface Props extends ComponentPropsWithoutRef<"h1"> {
  /** Which heading tag to render — typically `resolveHeadingLevel(copy?.fields.headingLevel, fallback)` (see app/lib/headingLevel.ts). */
  level: HeadingLevel;
}

/**
 * Renders a `dataText`-driven heading at whatever level (`h1`–`h6`) an
 * editor picked in Contentful, instead of every section hardcoding a
 * fixed tag and ignoring the field.
 *
 * A plain `<HeadingTag>` (a capitalized local variable holding the tag
 * name, used directly as a JSX element name) is also a common way to do
 * this, but it trips `react-hooks/static-components` — the linter reads
 * a capitalized identifier computed inside a component's render as "a
 * new component created every render" and flags it, even though the
 * value here is just a string. Wrapping the same `createElement` call in
 * a real, statically-known component sidesteps that: `<DynamicHeading
 * level={...}>` is an ordinary, stable component reference as far as the
 * linter (and React) are concerned — the dynamic part is safely
 * encapsulated inside this component's own implementation instead of
 * expressed at the JSX-tag-name position.
 */
const DynamicHeading = forwardRef<HTMLHeadingElement, Props>(
  function DynamicHeading({ level, children, ...rest }, ref) {
    return createElement(level, { ref, ...rest }, children);
  }
);

export default DynamicHeading;
