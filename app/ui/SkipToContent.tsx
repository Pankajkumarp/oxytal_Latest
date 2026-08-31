import Link from "next/link";

/**
 * WCAG 2.4.1 ("Bypass Blocks") skip link. Rendered as the very first
 * element on every real page — before `<Navbar>` — in each of this app's
 * 3 independent page entry points (`app/(content)/[locale]/[[...slug]]/
 * page.tsx`, `app/(content)/page-not-found/page.tsx`, and
 * `app/global-not-found.tsx`; see those files for why there are 3 rather
 * than one shared layout), so a keyboard or screen-reader user can jump
 * straight to `<main id="main-content">` instead of having to tab through
 * the full nav — including its mega-menus — on every single page.
 *
 * Invisible until it receives keyboard focus: `sr-only` hides it
 * visually while keeping it in the accessibility tree, and
 * `focus:not-sr-only` (Tailwind's standard skip-link idiom) reveals it
 * the moment Tab focuses it, so sighted keyboard users can see and use it
 * too. `focus:z-[60]` sits above `Navbar`'s own fixed nav (`z-50`, see
 * `app/ui/Navbar.tsx`) so the revealed link isn't hidden behind it.
 */
export default function SkipToContent() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </Link>
  );
}
