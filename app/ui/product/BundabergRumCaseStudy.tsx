"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useFadeUp, useListStagger } from "./useReveal";
import type { HeadingLevel } from "@/app/lib/headingLevel";
import DynamicHeading from "@/app/ui/DynamicHeading";
import { Entry, EntrySkeletonType } from "contentful";
import { ComposableElementSkeleton, ContentDetailSkeleton, DataLinkSkeleton } from "@/app/types/contentful";
import { getAssetUrl } from "@/app/lib/contentfulAsset";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

// Contentful wiring — same shape as `DiageoBrandPromoterCaseStudy`'s own:
// `entry.fields.elements` may hold up to 4 `contentDetail` entries. `[0]`
// supplies this case study's own hero photo (`heroImage`) and gallery
// (`gallery`, matched to `BUILT_ROWS` by position — see `galleryImages`
// in the default export below). Row 1 ("Compliance") renders a
// hand-drawn SVG diagram, not a photo, so it has nothing for a gallery
// entry to override and is left untouched regardless of what's in that
// position; rows 2–4 each hold a real photo and take the override when
// one resolves (see `BuiltRow`'s own `visual` discriminant below).
// `[1]`–`[3]` each become one `RelatedSection` card (see
// `resolveRelatedItem`). Everything here works exactly as before when
// `entry` is omitted or those fields are unset — each piece falls back
// to its own hardcoded default individually.
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

interface AnyEntry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: Record<string, unknown>;
}

function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

/**
 * `BundabergRumCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/oxytal-case-study-bundaberg.html`. Same treatment
 * as its siblings in this folder (`RedMirchiCaseStudy`/`TinyIslandCaseStudy`/
 * `KaneffCaseStudy`): keeps the reference's own colour identity (`--ink`
 * `#14110D`, `--body` `#5E574C`, `--muted` `#948A7B`, `--accent`
 * `#976C1C`, `--accent-2` `#956D1D`, `--accent-soft` `#FBF3E2`, the
 * `--deep-1`/`--deep-2` `#0E0C0A`/`#221D16` near-black gradient) rather
 * than the site's per-page `themeColor` accent, and typography stays the
 * site's own inherited `Poppins`. Every heading size, lede size, and
 * section container width (`max-w-*`) matches its siblings exactly —
 * 12px eyebrows, `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s, 16px/1.8
 * ledes, `max-w-7xl` for the wide sections, `max-w-5xl` for the narrow
 * prose ones, `max-w-6xl` for "what we built" — rather than the numbers
 * baked into the reference's own stylesheet. Content is still the
 * reference's own hardcoded copy/photography; the only genuine
 * Contentful wiring is the optional `entry` prop (see the doc comment
 * above the `isEntry` helper) — a `contentDetail` entry's own `heroImage`
 * can override the hero photo, and up to 3 more `contentDetail` entries
 * can override the related-case-study cards, each falling back to its
 * own hardcoded default individually when unset.
 *
 * One thing unique to this one: "What we built"'s 4 rows (not the usual
 * 3, since the reference genuinely walks through 4 parts of the store —
 * compliance, merchandising, campaigns, the distillery) mix a hand-drawn
 * inline SVG diagram for row 1 (same idiom `KaneffCaseStudy`'s/
 * `RedMirchiCaseStudy`'s diagrams use) with real photography for rows
 * 2–4, via `BuiltRow`'s own `visual` discriminant — same shape
 * `RedMirchiCaseStudy` uses for its mixed rows, minus the "varieties"
 * variant this reference doesn't have. Unlike `RedMirchiCaseStudy`,
 * though, the photo rows here *are* gallery-overridable — `galleryImages`
 * is matched to `BUILT_ROWS` by position the same way
 * `DiageoBrandPromoterCaseStudy` does it, but `BuiltRow` only consults
 * that override inside its `"photo"` branch, so a gallery entry sitting
 * in the diagram row's position is simply never read. "How we worked"
 * also labels its 5
 * phases by trading rhythm (Standing/Weekly/Seasonal/Peak/Always) rather
 * than the usual `01`–`05` sequence, since that's the reference's own
 * device for a store with a trading calendar rather than a build
 * timeline.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype `bundabergRum`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/media fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-bundaberg.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Bundaberg Distilling Company" },
  { k: "Sector", v: "Drinks · direct-to-consumer retail" },
  { k: "Platform", v: "Shopify" },
  { k: "Services", v: "Digital Commerce · Support & Optimisation" },
  { k: "Status", v: "Live, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "3", l: "Businesses in one checkout — spirits, merch, tours" },
  { v: "12+", l: "Collections across bottles, merchandise and gifting" },
  { v: "$55–$500", l: "Price range in a single catalogue" },
  { v: "—", l: "Orders processed since handover" },
  { v: "—", l: "Peak-season uptime" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "The licence is a design constraint",
    text: "Under the Queensland Liquor Act every page carries the licence number, the licensed selling entity and the address orders are dispatched from. That isn't a footer decoration — it's a legal condition of trading, and it has to survive every theme change and campaign takeover.",
  },
  {
    n: "02",
    title: "The cart has to know what's in it",
    text: "Age restrictions, delivery limitations and fulfilment rules differ by product type. The checkout can't treat a bottle, a t-shirt and a tour booking the same way — and it has to explain a refusal clearly rather than simply failing.",
  },
  {
    n: "03",
    title: "Every change touches money",
    text: "This store trades daily. A broken variant selector, a mispriced bundle or a slow product page is lost revenue that afternoon — not a defect to schedule for the next sprint.",
  },
];

/* =========================================================
   WHAT WE BUILT — compliance diagram
========================================================= */

function ComplianceDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="Legal elements held in shared layout so they survive campaign and theme changes."
    >
      <rect x="26" y="34" width="180" height="120" rx="12" fill="#F7F3EC" stroke="#EBE5DA" />
      <text x="116" y="60" fill="#948A7B" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        CAMPAIGN A
      </text>
      <g fill="#DFD5C4">
        <rect x="46" y="72" width="140" height="10" rx="5" />
        <rect x="46" y="90" width="112" height="10" rx="5" />
        <rect x="46" y="108" width="126" height="10" rx="5" />
      </g>
      <rect x="26" y="170" width="180" height="96" rx="12" fill="#F7F3EC" stroke="#EBE5DA" />
      <text x="116" y="196" fill="#948A7B" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        CAMPAIGN B
      </text>
      <g fill="#DFD5C4">
        <rect x="46" y="208" width="140" height="10" rx="5" />
        <rect x="46" y="226" width="98" height="10" rx="5" />
      </g>
      <g stroke="#976C1C" strokeWidth="2" fill="none" strokeDasharray="5 6">
        <path d="M222 94h44" />
        <path d="M222 216h44" />
      </g>
      <path d="M260 88l8 6-8 6M260 210l8 6-8 6" fill="none" stroke="#976C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="282" y="34" width="214" height="232" rx="14" fill="#FBF3E2" stroke="#976C1C" />
      <text x="389" y="62" fill="#976C1C" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        SHARED LAYOUT · FIXED
      </text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10.5" fill="#5E574C">
        <rect x="302" y="78" width="174" height="26" rx="7" fill="#fff" stroke="#EBE5DA" />
        <text x="316" y="95">Licence no. 180574</text>
        <rect x="302" y="112" width="174" height="26" rx="7" fill="#fff" stroke="#EBE5DA" />
        <text x="316" y="129">Licensed selling entity</text>
        <rect x="302" y="146" width="174" height="26" rx="7" fill="#fff" stroke="#EBE5DA" />
        <text x="316" y="163">Dispatch address</text>
        <rect x="302" y="180" width="174" height="26" rx="7" fill="#fff" stroke="#EBE5DA" />
        <text x="316" y="197">Liquor Act 1992 (Qld)</text>
        <rect x="302" y="214" width="174" height="26" rx="7" fill="#fff" stroke="#EBE5DA" />
        <text x="316" y="231">DrinkWise</text>
      </g>
    </svg>
  );
}

type BuiltRow =
  | { n: string; title: string; desc: string; bullets: string[]; visual: "diagram" }
  | { n: string; title: string; desc: string; bullets: string[]; visual: "photo"; img: string; alt: string };

const BUILT_ROWS: BuiltRow[] = [
  {
    n: "01 · Compliance",
    title: "Licensing that survives every release",
    desc: "The legal elements are treated as fixed structure rather than content anyone can move. Licence number, selling entity, dispatch address, the Liquor Act notice and the DrinkWise message stay present through campaign takeovers, seasonal themes and template changes.",
    bullets: [
      "Licence details held in shared layout, not per-page content",
      "Age verification enforced before the store, not at the checkout",
      "Responsible-drinking messaging carried through every template",
      "Checked as part of release, because compliance drift is silent",
    ],
    visual: "diagram",
  },
  {
    n: "02 · Merchandising",
    title: "One catalogue, four kinds of shopper",
    desc: "Someone buying a $54.95 bottle for themselves, someone spending $499.95 on a heritage barrel, someone picking up a branded glass, and someone buying a gift card for a relative all use the same store. The collection structure separates them rather than making everyone browse everything.",
    bullets: [
      "Bottle Shop split into Exclusive Range, Royal Liqueur, Master Distillers, Premix and bundles",
      "Merchandise separated into barware, clothing, leisure, heritage and food",
      "Bundle offers with a genuine incentive — save when you buy three or more",
      "Live stock states shown honestly, including low stock on limited items",
    ],
    visual: "photo",
    img: "https://www.bundabergrum.com.au/cdn/shop/collections/Bundy_Merchandise.png?v=1781607427&width=1200",
    alt: "Bundaberg Rum official merchandise range",
  },
  {
    n: "03 · Campaigns",
    title: "Limited releases, on the store's own timetable",
    desc: "Campfire, Single Barrel, Limited Editions and the Drop Bear campaign each get their own space in the navigation and their own landing page. On a store rather than a brand site, a campaign has to arrive with stock, pricing and a working path to checkout — not just artwork.",
    bullets: [
      "Campaign pages that connect directly to purchasable products",
      "Homepage takeovers for a release, reversible when the moment passes",
      "Partnership content — the NRL and Queensland Rum Day — held alongside commerce",
      "Team publishes campaigns without waiting on a development release",
    ],
    visual: "photo",
    img: "https://www.bundabergrum.com.au/cdn/shop/files/campfire_12_2000.png?v=1788174527&width=1200",
    alt: "Bundaberg Campfire Rum campaign",
  },
  {
    n: "04 · The distillery",
    title: "A tour booking is not a product",
    desc: "Bundaberg is a genuine tourist destination — the distillery has been operating since 1888 and people travel to visit it. Booking a tour sits in the same store as buying a bottle, but it has a date, a capacity and nothing to ship, so it can't behave like a physical product.",
    bullets: [
      "Tour booking presented alongside commerce without confusing the cart",
      "Visit and distillery content that serves people planning a trip, not a purchase",
      "Recipes as a proper blog with drinks and food, bringing search traffic in",
    ],
    visual: "photo",
    img: "https://www.bundabergrum.com.au/cdn/shop/files/Visit_the_Distillery.jpg?v=1781082718&width=1200",
    alt: "Visit the Bundaberg Rum distillery",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "Refuse for a reason, not silently",
    text: "A blocked order has to explain itself. A checkout that simply fails costs the sale and generates a support call — a checkout that says what's wrong lets the customer fix it.",
  },
  {
    title: "Rules by product type",
    text: "Spirits, merchandise and tour bookings each carry their own conditions. Mixed carts are the interesting case, and the one that gets tested most carefully.",
  },
  {
    title: "Age checked at the door",
    text: "Verification happens before the store, not at the point of payment. Somebody shouldn't be able to fill a cart with restricted products only to be turned away at the end.",
  },
  {
    title: "Tested on every release",
    text: "Checkout conditions are the first thing verified after any change. On a store that trades daily, a broken purchase path is the one defect that can't wait for a sprint.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "Standing",
    title: "Same team, continuous cover",
    text: "The people who know the theme and the catalogue structure are the ones who change it. On a store with this many product types, familiarity is the difference between a five-minute change and a broken collection.",
  },
  {
    n: "Weekly",
    title: "Merchandising and content",
    text: "New products, price and stock changes, collection updates, recipes and campaign content — published by the brand team, supported by us where it needs engineering.",
  },
  {
    n: "Seasonal",
    title: "Campaigns and limited releases",
    text: "Campfire, Single Barrel, limited editions and partnership moments prepared ahead of the date, with stock, pricing and the purchase path verified before anything goes live.",
  },
  {
    n: "Peak",
    title: "Freeze, then watch",
    text: "Nothing risky ships into the highest trading weeks. Changes go out early, then the store is monitored rather than modified while the revenue is arriving.",
  },
  {
    n: "Always",
    title: "Performance and platform health",
    text: "Page speed on product and collection pages, app hygiene, theme updates, accessibility and the Shopify platform changes that arrive whether anyone asked for them or not.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Platform", items: ["Shopify", "Custom theme", "Collections & variants", "Customer accounts"] },
  { title: "Commerce", items: ["Bundle offers", "Gift cards & vouchers", "Stock status display", "Wishlist"] },
  { title: "Content", items: ["Campaign landing pages", "Recipes blog with tagging", "Distillery & visit content", "Predictive search"] },
  { title: "Compliance", items: ["Age verification", "Liquor Act notices", "Checkout conditions", "DrinkWise & cookie consent"] },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/inkjet-world",
    img: "https://staginginkjet.oxytalapps.com/wp-content/uploads/2026/04/BusinessCard_Sample_1-scaled.png",
    alt: "InkJet World print shop",
    k: "Commerce",
    title: "InkJet World",
    text: 'You can\'t put "a poster" in a shopping cart.',
  },
  {
    href: "/case-studies/aviation-american-gin",
    img: "https://images.ctfassets.net/sl666vhlv2bs/730yUEymNTlERXBbgHACb8/f958b3b6e606e688ffad71ab60a65a39/desktop-banner.webp",
    alt: "Aviation American Gin",
    k: "Diageo · Support",
    title: "Aviation American Gin",
    text: "The hardest platform to change is one you didn't build.",
  },
  {
    href: "/case-studies/taffers-browned-butter-bourbon",
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5rN8pXjYf81OJlJsQc7RyN/91074d680f5cac8db16497cacfaeb3c7/Deck-Slides-Bottle-Closeup.webp",
    alt: "Taffer's Browned Butter Bourbon",
    k: "Diageo · Brand",
    title: "Taffer's Browned Butter Bourbon",
    text: "An unfamiliar product, and the doubt a site has to answer.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#976C1C" }: { children: ReactNode; color?: string }) {
  return (
    <span className="mb-4 flex items-center gap-2.5 text-[12px] font-bold  uppercase" style={{ color }}>
      <span aria-hidden className="h-0.5 w-[22px] rounded-sm" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  eyebrowColor,
  title,
  lede,
  dark,
  narrow = true,
  headingLevel = "h2",
}: {
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  lede?: ReactNode;
  dark?: boolean;
  narrow?: boolean;
  /** Which heading tag to render — `h1`–`h6` (see app/lib/headingLevel.ts). Defaults to `h2`, this component's original fixed level, so every existing call site renders unchanged. */
  headingLevel?: HeadingLevel;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={narrow ? "max-w-[620px]" : undefined}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <DynamicHeading
        level={headingLevel}
        ref={titleRef}
        className={cx(
          "max-w-[20ch] text-[clamp(28px,3.2vw,40px)] leading-[1.2] font-extrabold tracking-[-0.03em]",
          dark ? "text-white" : "text-[#14110D]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#B5AB9A]" : "text-[#5E574C]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#976C1C" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* =========================================================
   BREADCRUMB
========================================================= */

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="bg-[#0E0C0A] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#877E70] uppercase">
          <li>
            <Link href="/" className="text-[#B5AB9A] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#B5AB9A] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Bundaberg Rum</span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ mainBanner }: { mainBanner?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const clientRef = useRef<HTMLParagraphElement>(null);
  const standRef = useRef<HTMLParagraphElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);
  const visitRef = useRef<HTMLAnchorElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);

  // Hero's own `<h1>` plays on mount rather than on scroll — it's
  // already in view the instant the page loads, same as every sibling
  // case study's own hero.
  useLayoutEffect(() => {
    if (!titleRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(titleRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(titleRef.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 3,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.05,
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const targets = [clientRef.current, standRef.current, factsRef.current, visitRef.current, shotRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(clientRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(standRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.5)
        .from(factsRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from(visitRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.7)
        .from(shotRef.current, { opacity: 0, y: 24, duration: 0.7 }, 0.8);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-[#0E0C0A] to-[#221D16] pt-12 text-[#F2EDE4] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(227,190,115,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#956D1D] uppercase">
          Case study · Bundaberg Distilling Company · Queensland
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[22ch] text-[clamp(32px,4.4vw,54px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Selling rum online is a licensing problem before it&apos;s a commerce problem.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#B5AB9A]">
          Bundaberg has been distilling in Queensland since 1888. Its store sells licensed spirits, official
          merchandise and distillery tours through one Shopify checkout — under the Queensland Liquor Act, with a
          licence number on every page and every sale legally made from a single address in Bundaberg East. We
          support that store and enhance it continuously.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#0E0C0A] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#877E70] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#F2EDE4]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.bundabergrum.com.au/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#956D1D] hover:bg-[#956D1D]/12 sm:mb-12"
        >
          Visit the live store
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>

        <div
          ref={shotRef}
          className="overflow-hidden rounded-t-[10px] aspect-[1672/941] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.75)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src={
              mainBanner ??
              ""
            }
            alt="Bundaberg Rum — Australia's most iconic distillery"
            aria-hidden
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   OUTCOMES
========================================================= */

function OutcomesSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#EBE5DA] bg-[#EBE5DA] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#976C1C]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#5E574C]">{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   THE CHALLENGE
========================================================= */

function ChallengeSection() {
  const bodyRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="Three businesses sharing one cart." headingLevel="h2" narrow={false} />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#14110D]">
          Most of our drinks work ends at &quot;where to buy&quot;. This one doesn&apos;t — Bundaberg takes the
          order. And what&apos;s being ordered varies more than any other store we work on.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#5E574C]">
          A bottle of Royal Liqueur at $54.95 is a licensed alcohol sale under Queensland law. A Heritage 4L barrel
          at $499.95 is high-value freight. A hoodie from the merchandise range is ordinary retail with none of the
          same restrictions. A distillery tour is a ticketed experience with a date, a capacity and no delivery at
          all. Gift cards are something else again.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#5E574C]">
          All of it goes through one checkout, and every one of those categories carries different rules about who
          can buy, where it can be sent, and what has to be shown before the order is taken.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#976C1C] bg-[#FBF3E2] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#14110D]">
            On a brand site, a mistake is embarrassing. On this one it either stops revenue or breaches a liquor
            licence. That difference sets the standard for every change we ship.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHY IT'S HARD
========================================================= */

function WhyItWasHardSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-gradient-to-b from-[#FAF5EC] to-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it's hard"
            title="Three constraints that don't apply to ordinary retail."
            headingLevel="h2"
            lede="Any competent Shopify partner can run a store. These are the parts that make an alcohol store different."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EBE5DA] bg-[#EBE5DA] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#976C1C]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#14110D] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#5E574C]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT WE DO
========================================================= */

function WhatWeBuiltSection({ galleryImages = [] }: { galleryImages?: string[] }) {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we do"
            title="Keeping a trading store trading."
            headingLevel="h2"
            lede="Ongoing Shopify work across a catalogue that spans regulated spirits, merchandise, gifting and experiences."
            narrow={false}
          />
        </div>

        <div className="mt-10 flex flex-col gap-14 sm:mt-16 sm:gap-16">
          {BUILT_ROWS.map((row, index) => (
            <BuiltRow key={row.n} row={row} image={galleryImages[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** `image` overrides `row.img` when a matching Contentful gallery entry resolved (see `galleryImages` in the default export below) — but only for a `"photo"` row; the `"diagram"` row ignores it entirely, since there's no photo slot there for a gallery entry to fill. */
function BuiltRow({ row, image }: { row: BuiltRow; image?: string }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-semibold text-[12px] text-[#976C1C]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#14110D] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#5E574C]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#5E574C]",
                index > 0 && "border-t border-[#F7F3EC]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {row.visual === "diagram" && (
        <div
          ref={mediaRef}
          className="rounded-[18px] border border-[#EBE5DA] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(20,17,13,0.24)] sm:p-7"
        >
          <ComplianceDiagram />
        </div>
      )}

      {row.visual === "photo" && (
        <div
          ref={mediaRef}
          className="overflow-hidden rounded-[15px]  shadow-[0_20px_46px_-22px_rgba(20,17,13,0.24)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img src={image ?? row.img} alt={row.alt}  loading="lazy" className="block aspect-[606/600] w-full object-cover" />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   THE DETAIL THAT MATTERED
========================================================= */

function DetailThatMatteredSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0E0C0A] to-[#221D16] px-5 py-14 text-[#F2EDE4] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(227,190,115,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#956D1D"
            headingLevel="h3"
            title="The most important message in the store is a refusal."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#B5AB9A]">
            Somewhere in this checkout there&apos;s a line that reads{" "}
            <strong className="font-semibold text-white">&quot;Cannot place order, conditions not met.&quot;</strong>{" "}
            It&apos;s the least glamorous string on the site and arguably the most important one, because
            it&apos;s what stands between a licensed business and a sale it isn&apos;t permitted to make.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#B5AB9A]">
            Getting that logic right matters more than any layout decision on the store.{" "}
            <strong className="font-semibold text-white">An alcohol checkout has to be able to say no</strong> —
            clearly, for the right reasons, and without leaving a paying customer stuck with no idea what to
            change.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#0E0C0A] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9CB2B4]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HOW WE WORK
========================================================= */

function HowWeWorkedSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const phasesRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we work"
            title="Support shaped around a trading calendar."
            headingLevel="h3"
            lede="A store has rhythms a brand site doesn't. Christmas, Father's Day and Queensland Rum Day are known long in advance, and nothing risky ships near them."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#EBE5DA] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[86px_1fr] gap-4 p-6 sm:grid-cols-[110px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#EBE5DA]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#976C1C]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#14110D] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#5E574C]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHY THIS MATTERS
========================================================= */

function StillOursSection() {
  const panelRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#0E0C0A] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(227,190,115,.18), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="Why this matters"
              eyebrowColor="#956D1D"
              headingLevel="h3"
              title="Shopify expertise, proven where it counts."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#B5AB9A]">
              Plenty of agencies list Shopify. Fewer have supported a store where a licensing breach is possible,
              where a single catalogue runs from a $54.95 bottle to a $499.95 barrel, and where a tour booking
              shares a checkout with physical freight.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#B5AB9A]">
              Bundaberg is the reference we point to when a merchant asks whether we understand the awkward parts.
              The ordinary parts of commerce are well solved — it&apos;s the exceptions that decide whether a store
              works.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#956D1D]">
              {"Regulated\ncommerce"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9CB2B4]">
              Licensed alcohol, merchandise, gifting and experiences in one Shopify store — supported and enhanced
              continuously.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TECHNOLOGY
========================================================= */

function TechnologySection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("x", 16);

  return (
    <section className="bg-gradient-to-b from-[#FAF5EC] to-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Shopify, used properly."
            headingLevel="h4"
            lede="A store this varied rewards using the platform as intended rather than fighting it — and being disciplined about what gets added on top."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#976C1C] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#5E574C]", index > 0 && "border-t border-[#F7F3EC]")}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   RELATED
========================================================= */

type RelatedItem = (typeof RELATED)[number];

const RELATED_DESCRIPTION_MAX_LENGTH = 150;

/**
 * Truncates to at most `max` characters, trimmed back to the nearest word
 * boundary so a cut never lands mid-word, and suffixed with "…". Text
 * already at or under the limit passes through unchanged, no ellipsis
 * added.
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Maps one `contentDetail` entry (`contentDetailEntries[1]`/`[2]`/`[3]` —
 * `[0]` is this case study's own hero-photo source, see the default
 * export below) to one `RelatedSection` card. Same field convention
 * `CaseStudiesListing`'s own card mapping uses elsewhere in this app:
 * `heroImage` for the photo, `category` for the small tag, `title`/
 * `shortDescription` for the copy (capped at
 * `RELATED_DESCRIPTION_MAX_LENGTH` characters, via `truncate`, so a long
 * editor-written description can't unbalance the 3-up card grid), and a
 * link resolved from `cta` (preferred) or else `/case-studies/<slug>`.
 * Returns `undefined` for a missing entry or one with no `heroImage` — a
 * related card with no photo would look broken here, so it's dropped
 * rather than shown empty.
 */
function resolveRelatedItem(entry: PlainEntry<ContentDetailSkeleton> | undefined): RelatedItem | undefined {
  if (!entry) {
    return undefined;
  }

  const heroImageEntry = entry.fields.heroImage;
  const img = heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  if (!img) {
    return undefined;
  }

  const ctaEntry = entry.fields.cta?.find((link) => link && "fields" in link) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;
  const ctaHref = ctaEntry
    ? ctaEntry.fields.externalUrl || (ctaEntry.fields.linkedPage ? `/${ctaEntry.fields.linkedPage}` : undefined)
    : undefined;

  return {
    href: ctaHref ?? (entry.fields.slug ? `/case-studies/${entry.fields.slug}` : "#"),
    img,
    alt: entry.fields.title ?? "",
    k: entry.fields.category ?? entry.fields.clientName ?? "",
    title: entry.fields.title ?? "",
    text: entry.fields.shortDescription ? truncate(entry.fields.shortDescription, RELATED_DESCRIPTION_MAX_LENGTH) : "",
  };
}

/** Falls back to the static `RELATED` list when `related` is unset or empty — i.e. until a page's composableElement actually has `contentDetailEntries[1]`/`[2]`/`[3]` set (see `resolveRelatedItem`/the default export below). */
function RelatedSection({ related }: { related?: RelatedItem[] }) {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);
  const items = related?.length ? related : RELATED;

  return (
    <section className="bg-[#FDFCFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#EBE5DA] bg-white hover:-translate-y-1 hover:border-[#DFCFA8] hover:shadow-[0_20px_44px_-20px_rgba(20,17,13,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-semibold text-[12px] text-[#976C1C] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#14110D] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#5E574C]">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BundabergRumCaseStudy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];
  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const heromainEntry = contentDetailEntries[0];
  const heroImageEntry = heromainEntry?.fields.heroImage;
  const mainBanner =
    heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  // `gallery` is an array of `dataImage` *entries*, not raw assets — same
  // "resolve the entry, then its own `image` field" two-step
  // `heroImageEntry` above already uses. One resolved entry becomes one
  // `BuiltRow`'s photo, matched by position: the first gallery image
  // overrides `BUILT_ROWS[0].img` (the diagram row — `BuiltRow` never
  // reads it there), the second overrides `BUILT_ROWS[1].img`, and so
  // on. A photo row with no corresponding gallery entry keeps its own
  // static `img` unchanged (see `WhatWeBuiltSection`/`BuiltRow`'s own
  // `image` prop above).
  const galleryImages = (heromainEntry?.fields.gallery ?? [])
    .map((image) => (image && "fields" in image ? getAssetUrl(image.fields.image) : undefined))
    .filter((url): url is string => Boolean(url));

  // The 3 related-case-study cards, one per entry — `[0]` stays this
  // case study's own hero/gallery source above, so the related cards
  // start at `[1]`. `resolveRelatedItem` drops any that don't resolve
  // (missing entry, or no `heroImage`), and `RelatedSection` falls back
  // to its own static list whenever none of the three do.
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2], contentDetailEntries[3]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FDFCFA]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero mainBanner={mainBanner} />
      </div>
      <OutcomesSection />
      <ChallengeSection />
      <WhyItWasHardSection />
      <WhatWeBuiltSection galleryImages={galleryImages} />
      <div data-nav-contrast="dark">
        <DetailThatMatteredSection />
      </div>
      <HowWeWorkedSection />
      <div data-nav-contrast="dark">
        <StillOursSection />
      </div>
      <TechnologySection />
      <RelatedSection related={relatedItems} />
    </div>
  );
}
