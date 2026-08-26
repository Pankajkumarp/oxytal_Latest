"use client";

import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import styles from "./DigitalCommerce.module.css";
import DigitalCommerceHero from "./DigitalCommerceHero";
import DigitalCommerceProblems from "./DigitalCommerceProblems";
import DigitalCommerceCapability from "./DigitalCommerceCapability";
import DigitalCommercePlatforms from "./DigitalCommercePlatforms";
import DigitalCommerceWhy from "./DigitalCommerceWhy";
import DigitalCommerceEvidence from "./DigitalCommerceEvidence";
import DigitalCommerceEngagement from "./DigitalCommerceEngagement";
import DigitalCommerceFaq from "./DigitalCommerceFaq";
import DigitalCommerceRelated from "./DigitalCommerceRelated";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dc-bricolage",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dc-plex-mono",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dc-plex-sans",
});

/**
 * "Digital Commerce" service page — a faithful, class-renamed port of
 * `Refrence/oxytal-digital-commerce_1.html`'s design (see
 * `DigitalCommerce.module.css`'s own doc comment for the CSS-side
 * deviations: camelCased/split-out class names, the `.page`-scoped base
 * rules, and the approximated hero background art).
 *
 * Each of the reference's 9 sections is its own file in this folder,
 * *and* its own `composableElement` subtype — same one-section-one-
 * subtype convention `aboutHero`/`aboutStats`/`aboutServices`/... (see
 * `ComposableElementRenderer`) already use, rather than one big entry
 * covering the whole page:
 *
 * - `DigitalCommerceHero` (subtype key `DigitalCommerceHero`, PascalCase —
 *   matches the value already added to the `subType` field's allowed
 *   list in Contentful) — headline, lede, CTAs, client-logo strip
 * - `DigitalCommerceProblems` — "the business problem" cards
 * - `DigitalCommerceCapability` — the commerce-lifecycle diagram + capability cards
 * - `DigitalCommercePlatforms` — Shopify/Adobe Commerce comparison + the version-support checker
 * - `DigitalCommerceWhy` — the "why Oxytal" grid
 * - `DigitalCommerceEvidence` — stats + case studies (`id="work"`, the hero's "See the outcomes" target)
 * - `DigitalCommerceEngagement` — the 3 engagement modes
 * - `DigitalCommerceFaq` — the FAQ accordion
 * - `DigitalCommerceRelated` — related services + the closing CTA
 *
 * The other 8 are still registered under their original camelCase
 * subtype keys (e.g. `digitalCommerceProblems`) — only `Hero` has a
 * Contentful entry yet, so only its key has been reconciled to match
 * what's actually in Contentful's `subType` enum. Reconcile the rest
 * the same way (rename the key in `ComposableElementRenderer`'s
 * `subtypeComponents` map, and add the matching value to `subType`'s
 * allowed list in Contentful) as each one gets its first real entry.
 *
 * CONTENT — none of these subtypes use `elements` (linked entries);
 * each instead reads `entry.fields.content`, a freeform JSON field
 * (see `ComposableElementSkeleton.content` in `app/types/contentful.
 * ts`) that an editor fills in directly in Contentful, cast to that
 * section's own expected shape (documented on each component). A
 * missing `content` — or a missing `entry` entirely, e.g. this file's
 * own standalone render below — falls back to the reference's own
 * literal copy, key-by-key for object-shaped content (so overriding
 * just one field doesn't blank out the rest) or as a wholesale swap
 * for array-shaped content (a card grid, the FAQ list, ...) — same
 * "Contentful data replaces the hardcoded default" convention every
 * other `elements`-driven section in this codebase already follows.
 *
 * This file itself is a convenience: rendering every section with no
 * `entry` (so each falls back to its own defaults) reproduces the
 * reference page verbatim, e.g. for local preview — it isn't how a
 * real page assembles these, which instead lists whichever
 * `digitalCommerce*` entries it wants (in whatever order, each with its
 * own `content`) among a page's own composable elements. It also wires
 * up the shared `next/font/google` variables (Bricolage Grotesque/IBM
 * Plex Sans/IBM Plex Mono — same pattern `AIPipelineDemo.tsx`/`.module.
 * css` already use for the same 3 families) and the GSAP plugin
 * registration every section's animation relies on.
 *
 * ANIMATION — every heading (`h1`/`h2`) across those 9 sections gets
 * this codebase's usual GSAP split-text scroll-reveal (`useSplitReveal`
 * in `./useReveal.ts`, same word-mask/stagger treatment
 * AboutApproach/HomeServices/... all use). Everything else the
 * reference reveals on scroll via its own vanilla `.reveal`/`.reveal.in`
 * class (a plain `IntersectionObserver`) is reimplemented with the same
 * file's `useFadeUp`/`useStaggerReveal` hooks instead — this codebase's
 * usual animation approach, in place of the reference's own mechanism.
 * The lifecycle diagram's drawn-in progress line (in
 * `DigitalCommerceCapability`) gets its own small scroll-triggered
 * stroke animation for the same reason. All of the above skip straight
 * to their settled state under `prefers-reduced-motion`.
 */
export default function DigitalCommerce() {
  return (
    <div className={cx(styles.page, bricolage.variable, plexMono.variable, plexSans.variable)}>
      <DigitalCommerceHero />
      <DigitalCommerceProblems />
      <DigitalCommerceCapability />
      <DigitalCommercePlatforms />
      <DigitalCommerceWhy />
      <DigitalCommerceEvidence />
      <DigitalCommerceEngagement />
      <DigitalCommerceFaq />
      <DigitalCommerceRelated />
    </div>
  );
}
